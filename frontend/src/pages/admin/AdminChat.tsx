import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';

const API = 'http://localhost:3000';

interface Sessao {
    id: number;
    protocolo: string;
    assunto: string;
    status: string;
    funcionario_usuario_id: number;
    funcionario_admin_id: number | null;
    usuario_nome: string | null;
    admin_nome: string | null;
    total_mensagens: number;
    created_at: string;
    encerrado_at: string | null;
}

interface Mensagem {
    id: number;
    funcionario_id: number | null;
    mensagem: string;
    tipo: string;
    autor_nome: string | null;
    created_at: string;
}

interface Funcionario {
    id: number;
    nome: string;
    matricula: string;
}

export function AdminChat() {
    const { token, usuario } = useAuth();
    const [sessoes, setSessoes] = useState<Sessao[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [sessaoAberta, setSessaoAberta] = useState<Sessao | null>(null);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [textoMsg, setTextoMsg] = useState('');
    
    // Para Nova Conversa
    const [modoNovo, setModoNovo] = useState(false);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [novoUsuarioId, setNovoUsuarioId] = useState('');
    const [novoProtocoloRef, setNovoProtocoloRef] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [mensagens]);

    const authHeaders = { 'Authorization': "Bearer $token" };

    const carregarSessoes = async () => {
        try {
            const res = await fetch(`${API}/admin/chat/sessoes`, { headers: authHeaders });
            if (res.ok) setSessoes(await res.json());
        } catch { console.error('Erro ao carregar sessões'); }
        finally { setCarregando(false); }
    };

    const carregarFuncionarios = async () => {
        try {
            const res = await fetch(`${API}/funcionarios`, { headers: authHeaders });
            if (res.ok) setFuncionarios(await res.json());
        } catch { console.error('Erro ao carregar funcionários'); }
    };

    useEffect(() => { 
        carregarSessoes(); 
        carregarFuncionarios();
    }, []);

    // Conexão WebSocket
    useEffect(() => {
        if (!token) return;
        const socket = io('http://localhost:3000', { auth: { token } });
        socketRef.current = socket;

        socket.on('nova_sessao', (sessao: Sessao) => {
            // Emite um alerta (balão flutuante via browser se possível ou só no DOM)
            // Aqui estamos atualizando a lista
            setSessoes(prev => [sessao, ...prev]);
        });

        socket.on('sessao_atualizada', (data: { id: number, status: string, funcionario_admin_id?: number }) => {
            setSessoes(prev => prev.map(s => s.id === data.id ? { ...s, status: data.status, funcionario_admin_id: data.funcionario_admin_id || s.funcionario_admin_id } : s));
            if (sessaoAberta?.id === data.id) {
                setSessaoAberta(prev => prev ? { ...prev, status: data.status, funcionario_admin_id: data.funcionario_admin_id || prev.funcionario_admin_id } : null);
            }
        });

        socket.on('nova_mensagem', (msg: Mensagem) => {
            setMensagens(prev => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        });

        return () => { socket.disconnect(); };
    }, [token, sessaoAberta]);

    const buscarMensagens = async (id: number) => {
        try {
            const res = await fetch(`${API}/chat/sessoes/${id}/mensagens`, { headers: authHeaders });
            if (!res.ok) return;
            const data = await res.json();
            setMensagens(data.mensagens);
        } catch { /* silencioso */ }
    };

    const aceitar = async (id: number) => {
        try {
            const res = await fetch(`${API}/chat/sessoes/${id}/aceitar`, { method: 'PATCH', headers: authHeaders });
            if (res.ok) {
                if (sessaoAberta?.id === id) await buscarMensagens(id);
            } else {
                const d = await res.json();
                alert(d.erro || 'Erro.');
            }
        } catch { alert('Erro de conexão.'); }
    };

    const abrirChat = async (s: Sessao) => {
        setModoNovo(false);
        setSessaoAberta(s);
        setTextoMsg('');
        await buscarMensagens(s.id);
        socketRef.current?.emit('join_chat', s.id);
    };

    const fecharChat = () => {
        setSessaoAberta(null);
        setMensagens([]);
    };

    const enviar = async () => {
        if (!textoMsg.trim() || !sessaoAberta) return;
        try {
            const res = await fetch(`${API}/chat/sessoes/${sessaoAberta.id}/mensagens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ mensagem: textoMsg })
            });
            if (res.ok) setTextoMsg('');
        } catch { /* silencioso */ }
    };

    const encerrar = async (id: number) => {
        try {
            await fetch(`${API}/chat/sessoes/${id}/encerrar`, { method: 'PATCH', headers: authHeaders });
        } catch { alert('Erro de conexão.'); }
    };

    const iniciarNovoChatAdmin = async () => {
        if (!novoUsuarioId || !novoProtocoloRef.trim()) return;
        
        const func = funcionarios.find(f => f.id.toString() === novoUsuarioId);
        if (!func) return;

        const nomePri = func.nome.split(' ')[0];
        const template = `Olá ${nomePri}, gostaria de falar sobre o seu chamado/sua solicitação numero ${novoProtocoloRef}, aguardo resposta.`;

        try {
            const res = await fetch(`${API}/chat/sessoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({
                    funcionario_usuario_id: Number(novoUsuarioId),
                    assunto: novoProtocoloRef,
                    mensagem_inicial: template
                })
            });
            const data = await res.json();
            if (res.ok) {
                setModoNovo(false);
                setNovoUsuarioId('');
                setNovoProtocoloRef('');
                abrirChat(data.sessao);
            } else {
                alert(data.erro);
            }
        } catch {
            alert('Erro ao criar chat.');
        }
    };

    const aplicarTemplateRapido = () => {
        if (sessaoAberta?.usuario_nome) {
            const nomePri = sessaoAberta.usuario_nome.split(' ')[0];
            setTextoMsg(`Olá ${nomePri}, como posso ajudar?`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
    };

    const formatHora = (dt: string) => {
        try { return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
        catch { return ''; }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Aguardando': return 'status-pendente';
            case 'Ativo': return 'status-aprovado';
            case 'Encerrado': return 'status-fechado';
            default: return '';
        }
    };

    const aguardando = sessoes.filter(s => s.status === 'Aguardando');
    const ativos = sessoes.filter(s => s.status === 'Ativo');
    const encerrados = sessoes.filter(s => s.status === 'Encerrado');

    if (carregando) return <div className="loading-spinner"><i className="bi bi-arrow-repeat"></i> Carregando...</div>;

    // Regra de bloqueio
    const isSessaoBloqueada = sessaoAberta?.funcionario_admin_id && sessaoAberta.funcionario_admin_id !== usuario?.id;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {sessoes.length} sessão(ões) — {aguardando.length} aguardando, {ativos.length} ativo(s)
                </span>
                <div>
                    <button className="btn btn-primary btn-sm me-2" onClick={() => { setSessaoAberta(null); setModoNovo(true); }}>
                        <i className="bi bi-plus-lg me-1"></i> Nova Conversa
                    </button>
                    <button className="btn-ghost" onClick={carregarSessoes}>
                        <i className="bi bi-arrow-clockwise"></i> Atualizar
                    </button>
                </div>
            </div>

            <div className="admin-chat-layout">
                {/* ── Lista de sessões ── */}
                <div className="admin-chat-list">
                    {aguardando.length > 0 && (
                        <div className="admin-chat-group">
                            <div className="admin-chat-group-title">
                                <span className="chat-status-dot chat-status-aguardando"></span>
                                Aguardando ({aguardando.length})
                            </div>
                            {aguardando.map(s => (
                                <div key={s.id} className={`admin-chat-item ${sessaoAberta?.id === s.id ? 'active' : ''}`} onClick={() => abrirChat(s)}>
                                    <div className="admin-chat-item-top">
                                        <span className="protocol-id" style={{ fontSize: 12 }}>{s.protocolo}</span>
                                        <button className="btn btn-outline-primary btn-sm" style={{ fontSize: 10, padding: '2px 8px' }}
                                            onClick={e => { e.stopPropagation(); aceitar(s.id); }}>
                                            <i className="bi bi-check-lg me-1"></i>Aceitar
                                        </button>
                                    </div>
                                    <div className="admin-chat-item-assunto">{s.assunto} <span style={{fontSize: 10, color: '#666'}}>({s.usuario_nome})</span></div>
                                    <div className="admin-chat-item-time">{new Date(s.created_at).toLocaleString('pt-BR')}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {ativos.length > 0 && (
                        <div className="admin-chat-group">
                            <div className="admin-chat-group-title">
                                <span className="chat-status-dot chat-status-ativo"></span>
                                Ativos ({ativos.length})
                            </div>
                            {ativos.map(s => {
                                const outroTI = s.funcionario_admin_id !== usuario?.id;
                                return (
                                    <div key={s.id} className={`admin-chat-item ${sessaoAberta?.id === s.id ? 'active' : ''}`} style={{ opacity: outroTI ? 0.6 : 1 }} onClick={() => abrirChat(s)}>
                                        <div className="admin-chat-item-top">
                                            <span className="protocol-id" style={{ fontSize: 12 }}>{s.protocolo}</span>
                                            {outroTI && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}><i className="bi bi-lock-fill"></i> Bloqueado</span>}
                                        </div>
                                        <div className="admin-chat-item-assunto">{s.assunto} <span style={{fontSize: 10, color: '#666'}}>({s.usuario_nome})</span></div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {encerrados.length > 0 && (
                        <div className="admin-chat-group">
                            <div className="admin-chat-group-title" style={{ color: 'var(--text-muted)' }}>
                                <span className="chat-status-dot chat-status-encerrado"></span>
                                Encerrados ({encerrados.length})
                            </div>
                            {encerrados.map(s => (
                                <div key={s.id} className={`admin-chat-item ${sessaoAberta?.id === s.id ? 'active' : ''}`} style={{ opacity: 0.5 }} onClick={() => abrirChat(s)}>
                                    <div className="admin-chat-item-top">
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.protocolo}</span>
                                    </div>
                                    <div className="admin-chat-item-assunto">{s.assunto}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Área de chat / Nova Conversa ── */}
                <div className="admin-chat-area">
                    {modoNovo ? (
                        <div style={{ padding: '30px' }}>
                            <h4 style={{ marginBottom: 20 }}>Iniciar Nova Conversa</h4>
                            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Inicie um chat com um usuário a respeito de uma solicitação ou demanda específica.</p>
                            
                            <div className="mb-3">
                                <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>Usuário Alvo</label>
                                <select className="form-select form-select-sm" value={novoUsuarioId} onChange={e => setNovoUsuarioId(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {funcionarios.map(f => (
                                        <option key={f.id} value={f.id}>{f.nome} ({f.matricula})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>Protocolo Referência (Ex: DEM-12, SR-5)</label>
                                <input type="text" className="form-control form-control-sm" value={novoProtocoloRef} onChange={e => setNovoProtocoloRef(e.target.value)} />
                            </div>
                            
                            <div style={{ padding: 15, backgroundColor: 'var(--bg-color)', borderRadius: 8, fontSize: 13, marginBottom: 20, fontStyle: 'italic' }}>
                                <strong>Mensagem Automática:</strong><br/>
                                "Olá [Nome], gostaria de falar sobre o seu chamado/sua solicitação numero {novoProtocoloRef || '[Protocolo]'}, aguardo resposta."
                            </div>

                            <button className="btn btn-primary" disabled={!novoUsuarioId || !novoProtocoloRef.trim()} onClick={iniciarNovoChatAdmin}>
                                Iniciar Chat e Enviar
                            </button>
                            <button className="btn btn-ghost ms-2" onClick={() => setModoNovo(false)}>Cancelar</button>
                        </div>
                    ) : !sessaoAberta ? (
                        <div className="admin-chat-empty">
                            <i className="bi bi-chat-square-text" style={{ fontSize: 48, opacity: 0.15 }}></i>
                            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 12 }}>Selecione uma sessão para visualizar</p>
                        </div>
                    ) : (
                        <>
                            {/* Header do chat aberto */}
                            <div className="admin-chat-area-header">
                                <div>
                                    <strong>{sessaoAberta.protocolo}</strong>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>{sessaoAberta.usuario_nome} • {sessaoAberta.assunto}</span>
                                </div>
                                <div className="d-flex gap-1 align-items-center">
                                    <span className={`status-badge ${getStatusClass(sessaoAberta.status)}`} style={{ fontSize: 10, padding: '2px 8px' }}>{sessaoAberta.status}</span>
                                    
                                    {isSessaoBloqueada && (
                                        <span className="badge bg-secondary ms-2"><i className="bi bi-lock-fill me-1"></i>Com {sessaoAberta.admin_nome}</span>
                                    )}

                                    {sessaoAberta.status === 'Aguardando' && (
                                        <button className="btn btn-primary btn-sm ms-2" style={{ fontSize: 11, padding: '3px 10px' }}
                                            onClick={() => aceitar(sessaoAberta.id)}>
                                            <i className="bi bi-check-lg me-1"></i>Aceitar
                                        </button>
                                    )}
                                    {sessaoAberta.status === 'Ativo' && !isSessaoBloqueada && (
                                        <button className="btn btn-outline-danger btn-sm ms-2" style={{ fontSize: 11, padding: '3px 10px' }}
                                            onClick={() => encerrar(sessaoAberta.id)}>
                                            <i className="bi bi-x-lg me-1"></i>Encerrar
                                        </button>
                                    )}
                                    <button className="btn-icon ms-2" onClick={fecharChat} style={{ width: 28, height: 28, fontSize: 12 }}>
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Mensagens */}
                            <div className="admin-chat-messages">
                                {mensagens.map(m => {
                                    const isMe = m.funcionario_id === usuario?.id;
                                    const tipoBubble = m.tipo === 'sistema' ? 'system' : (isMe ? 'me' : 'user');
                                    
                                    return (
                                        <div key={m.id} className={`chat-bubble chat-bubble-${tipoBubble}`}>
                                            {m.tipo === 'sistema' ? (
                                                <div className="chat-bubble-system-text">
                                                    <i className="bi bi-info-circle me-1"></i>{m.mensagem}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="chat-bubble-content">{m.mensagem}</div>
                                                    <div className="chat-bubble-time">
                                                        {!isMe && m.autor_nome && <span style={{fontWeight: 600, marginRight: 5}}>{m.autor_nome}</span>}
                                                        {formatHora(m.created_at)}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            {sessaoAberta.status === 'Ativo' && !isSessaoBloqueada && (
                                <div className="chat-input-area" style={{ borderRadius: '0 0 0 0', flexWrap: 'wrap' }}>
                                    <div style={{ width: '100%', marginBottom: 8 }}>
                                        <button className="btn btn-outline-secondary btn-sm" style={{ fontSize: 11, padding: '2px 8px' }} onClick={aplicarTemplateRapido}>
                                            <i className="bi bi-lightning-charge me-1"></i>Template: Resposta Rápida
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        className="chat-input"
                                        placeholder="Responder..."
                                        value={textoMsg}
                                        onChange={e => setTextoMsg(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <button className="chat-send-btn" onClick={enviar} disabled={!textoMsg.trim()}>
                                        <i className="bi bi-send-fill"></i>
                                    </button>
                                </div>
                            )}
                            
                            {sessaoAberta.status === 'Ativo' && isSessaoBloqueada && (
                                <div className="chat-input-area" style={{ borderRadius: '0 0 0 0', backgroundColor: '#f5f5f5', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}><i className="bi bi-lock-fill me-1"></i>Chat atribuído a outro atendente ({sessaoAberta.admin_nome}).</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}


