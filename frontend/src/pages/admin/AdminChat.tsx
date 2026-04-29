// Arquivo: frontend/src/pages/admin/AdminChat.tsx
import { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:3000';

interface Sessao {
    id: number;
    protocolo: string;
    assunto: string;
    status: string;
    usuario_nome: string | null;
    admin_nome: string | null;
    total_mensagens: number;
    created_at: string;
    encerrado_at: string | null;
}

interface Mensagem {
    id: number;
    mensagem: string;
    tipo: string;
    autor_nome: string | null;
    created_at: string;
}

export function AdminChat() {
    const [sessoes, setSessoes] = useState<Sessao[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [sessaoAberta, setSessaoAberta] = useState<Sessao | null>(null);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [textoMsg, setTextoMsg] = useState('');
    const [statusChat, setStatusChat] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollingRef = useRef<number | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [mensagens]);

    const carregar = async () => {
        try {
            const res = await fetch(`${API}/admin/chat/sessoes`);
            if (res.ok) setSessoes(await res.json());
        } catch { console.error('Erro ao carregar sessões'); }
        finally { setCarregando(false); }
    };

    useEffect(() => { carregar(); }, []);

    // Polling quando chat aberto
    useEffect(() => {
        if (sessaoAberta && statusChat !== 'Encerrado') {
            pollingRef.current = window.setInterval(() => {
                buscarMensagens(sessaoAberta.id);
            }, 3000);
            return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
        }
    }, [sessaoAberta, statusChat]);

    const buscarMensagens = async (id: number) => {
        try {
            const res = await fetch(`${API}/chat/sessoes/${id}/mensagens`);
            if (!res.ok) return;
            const data = await res.json();
            setMensagens(data.mensagens);
            if (data.status) setStatusChat(data.status);
        } catch { /* silencioso */ }
    };

    const aceitar = async (id: number) => {
        try {
            const res = await fetch(`${API}/admin/chat/sessoes/${id}/aceitar`, { method: 'PATCH' });
            if (res.ok) {
                carregar();
                if (sessaoAberta?.id === id) {
                    setStatusChat('Ativo');
                    await buscarMensagens(id);
                }
            } else {
                const d = await res.json();
                alert(d.erro || 'Erro.');
            }
        } catch { alert('Erro de conexão.'); }
    };

    const abrirChat = async (s: Sessao) => {
        setSessaoAberta(s);
        setStatusChat(s.status);
        setTextoMsg('');
        await buscarMensagens(s.id);
    };

    const fecharChat = () => {
        setSessaoAberta(null);
        setMensagens([]);
        if (pollingRef.current) clearInterval(pollingRef.current);
    };

    const enviar = async () => {
        if (!textoMsg.trim() || !sessaoAberta) return;
        try {
            const res = await fetch(`${API}/chat/sessoes/${sessaoAberta.id}/mensagens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensagem: textoMsg })
            });
            if (res.ok) {
                setTextoMsg('');
                await buscarMensagens(sessaoAberta.id);
            }
        } catch { /* silencioso */ }
    };

    const encerrar = async (id: number) => {
        try {
            const res = await fetch(`${API}/chat/sessoes/${id}/encerrar`, { method: 'PATCH' });
            if (res.ok) {
                carregar();
                if (sessaoAberta?.id === id) {
                    setStatusChat('Encerrado');
                    await buscarMensagens(id);
                }
            }
        } catch { alert('Erro de conexão.'); }
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

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {sessoes.length} sessão(ões) — {aguardando.length} aguardando, {ativos.length} ativo(s)
                </span>
                <button className="btn-ghost" onClick={carregar}>
                    <i className="bi bi-arrow-clockwise"></i> Atualizar
                </button>
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
                                    <div className="admin-chat-item-assunto">{s.assunto}</div>
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
                            {ativos.map(s => (
                                <div key={s.id} className={`admin-chat-item ${sessaoAberta?.id === s.id ? 'active' : ''}`} onClick={() => abrirChat(s)}>
                                    <div className="admin-chat-item-top">
                                        <span className="protocol-id" style={{ fontSize: 12 }}>{s.protocolo}</span>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.total_mensagens} msgs</span>
                                    </div>
                                    <div className="admin-chat-item-assunto">{s.assunto}</div>
                                    <div className="admin-chat-item-time">{new Date(s.created_at).toLocaleString('pt-BR')}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {encerrados.length > 0 && (
                        <div className="admin-chat-group">
                            <div className="admin-chat-group-title" style={{ color: 'var(--text-muted)' }}>
                                <span className="chat-status-dot chat-status-encerrado"></span>
                                Encerrados ({encerrados.length})
                            </div>
                            {encerrados.map(s => (
                                <div key={s.id} className={`admin-chat-item ${sessaoAberta?.id === s.id ? 'active' : ''}`} style={{ opacity: 0.6 }} onClick={() => abrirChat(s)}>
                                    <div className="admin-chat-item-top">
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.protocolo}</span>
                                        <span className={`status-badge ${getStatusClass(s.status)}`} style={{ fontSize: 10, padding: '2px 6px' }}>{s.status}</span>
                                    </div>
                                    <div className="admin-chat-item-assunto">{s.assunto}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {sessoes.length === 0 && (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                            <i className="bi bi-chat-dots" style={{ fontSize: 32, display: 'block', marginBottom: 8, opacity: 0.3 }}></i>
                            Nenhuma sessão de chat registrada.
                        </div>
                    )}
                </div>

                {/* ── Área de chat ── */}
                <div className="admin-chat-area">
                    {!sessaoAberta ? (
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
                                    <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>{sessaoAberta.assunto}</span>
                                </div>
                                <div className="d-flex gap-1 align-items-center">
                                    <span className={`status-badge ${getStatusClass(statusChat)}`} style={{ fontSize: 10, padding: '2px 8px' }}>{statusChat}</span>
                                    {statusChat === 'Aguardando' && (
                                        <button className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: '3px 10px' }}
                                            onClick={() => aceitar(sessaoAberta.id)}>
                                            <i className="bi bi-check-lg me-1"></i>Aceitar
                                        </button>
                                    )}
                                    {statusChat === 'Ativo' && (
                                        <button className="btn btn-outline-danger btn-sm" style={{ fontSize: 11, padding: '3px 10px' }}
                                            onClick={() => encerrar(sessaoAberta.id)}>
                                            <i className="bi bi-x-lg me-1"></i>Encerrar
                                        </button>
                                    )}
                                    <button className="btn-icon" onClick={fecharChat} style={{ width: 28, height: 28, fontSize: 12 }}>
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Mensagens */}
                            <div className="admin-chat-messages">
                                {mensagens.map(m => (
                                    <div key={m.id} className={`chat-bubble chat-bubble-${m.tipo === 'sistema' ? 'system' : 'user'}`}>
                                        {m.tipo === 'sistema' ? (
                                            <div className="chat-bubble-system-text">
                                                <i className="bi bi-info-circle me-1"></i>{m.mensagem}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="chat-bubble-content">{m.mensagem}</div>
                                                <div className="chat-bubble-time">{formatHora(m.created_at)}</div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            {statusChat === 'Ativo' && (
                                <div className="chat-input-area" style={{ borderRadius: '0 0 0 0' }}>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
