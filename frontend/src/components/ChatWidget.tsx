import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

const API = 'http://localhost:3000';

interface Mensagem {
    id: number;
    chat_sessao_id: number;
    funcionario_id: number | null;
    mensagem: string;
    tipo: string;
    autor_nome: string | null;
    created_at: string;
}

interface Sessao {
    id: number;
    protocolo: string;
    assunto: string;
    status: string;
    created_at: string;
}

export function ChatWidget() {
    const { token, usuario } = useAuth();
    const [aberto, setAberto] = useState(false);
    
    const [sessoes, setSessoes] = useState<Sessao[]>([]);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    
    const [textoMsg, setTextoMsg] = useState('');
    const [assunto, setAssunto] = useState('');
    
    const [carregando, setCarregando] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');
    const [exibirFormNovo, setExibirFormNovo] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    const sessaoAtiva = sessoes.length > 0 && sessoes[sessoes.length - 1].status !== 'Encerrado' 
        ? sessoes[sessoes.length - 1] 
        : null;

    // Auto-scroll
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => { scrollToBottom(); }, [mensagens, aberto, exibirFormNovo]);

    // Conexão WebSocket e Histórico
    useEffect(() => {
        if (!token) return;

        // Iniciar conexão socket
        const socket = io('http://localhost:3000', {
            auth: { token }
        });
        socketRef.current = socket;

        socket.on('nova_mensagem', (msg: Mensagem) => {
            setMensagens(prev => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        });

        socket.on('sessao_atualizada', (data: { id: number, status: string }) => {
            setSessoes(prev => prev.map(s => s.id === data.id ? { ...s, status: data.status } : s));
        });

        return () => {
            socket.disconnect();
        };
    }, [token]);

    // Buscar histórico ao abrir pela primeira vez
    useEffect(() => {
        if (aberto && sessoes.length === 0) {
            buscarHistorico();
        }
    }, [aberto]);

    const buscarHistorico = async () => {
        try {
            const res = await fetch(`${API}/chat/historico`);
            if (!res.ok) return;
            const data = await res.json();
            setSessoes(data.sessoes);
            setMensagens(data.mensagens);

            // Se não tem sessão ativa, exibir o form de novo atendimento (a menos que não tenha nenhuma sessão)
            if (data.sessoes.length === 0 || data.sessoes[data.sessoes.length - 1].status === 'Encerrado') {
                setExibirFormNovo(true);
            } else {
                setExibirFormNovo(false);
                // Entrar na sala do chat via socket para atualizações mais rápidas
                socketRef.current?.emit('join_chat', data.sessoes[data.sessoes.length - 1].id);
            }
        } catch (e) {
            console.error('Erro ao buscar histórico', e);
        }
    };

    const abrirChat = async () => {
        setErro('');
        if (!assunto.trim()) { setErro('Informe o assunto.'); return; }
        setCarregando(true);
        try {
            const res = await fetch(`${API}/chat/sessoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assunto })
            });
            const data = await res.json();
            if (res.ok) {
                // Ao criar, o servidor já envia a mensagem automática via websocket se estivermos ouvindo.
                // Mas para garantir, podemos dar reload no histórico.
                await buscarHistorico();
                setAssunto('');
                setExibirFormNovo(false);
            } else {
                setErro(data.erro || 'Erro ao abrir chat.');
            }
        } catch { setErro('Erro de conexão.'); }
        finally { setCarregando(false); }
    };

    const enviar = async () => {
        if (!textoMsg.trim() || !sessaoAtiva) return;
        setEnviando(true);
        try {
            const res = await fetch(`${API}/chat/sessoes/${sessaoAtiva.id}/mensagens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensagem: textoMsg })
            });
            if (res.ok) {
                setTextoMsg('');
            }
        } catch { /* silencioso */ }
        finally { setEnviando(false); }
    };

    const encerrar = async () => {
        if (!sessaoAtiva) return;
        try {
            await fetch(`${API}/chat/sessoes/${sessaoAtiva.id}/encerrar`, { method: 'PATCH' });
            setExibirFormNovo(true);
        } catch { /* silencioso */ }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
    };

    const formatHora = (dt: string) => {
        try { return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
        catch { return ''; }
    };

    // Agrupar mensagens por sessão para renderizar os separadores
    const renderizarMensagens = () => {
        let elements: React.ReactNode[] = [];
        
        sessoes.forEach(sessao => {
            const msgsSessao = mensagens.filter(m => m.chat_sessao_id === sessao.id);
            
            // Renderizar separador
            elements.push(
                <div key={`sep-${sessao.id}`} style={{ textAlign: 'center', margin: '20px 0', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }}></div>
                    <span style={{ padding: '0 10px', fontWeight: 600 }}>--- {sessao.protocolo} ---</span>
                    <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }}></div>
                </div>
            );

            // Renderizar mensagens
            msgsSessao.forEach(m => {
                const isMe = m.funcionario_id === usuario?.id;
                elements.push(
                    <div key={m.id} className={`chat-bubble chat-bubble-${m.tipo === 'sistema' ? 'system' : (isMe ? 'me' : 'user')}`}>
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
            });
        });

        return elements;
    };

    return (
        <>
            {/* ── Botão flutuante ── */}
            <button
                className={`chat-fab ${aberto ? 'chat-fab-active' : ''}`}
                onClick={() => setAberto(!aberto)}
                title="Suporte TI"
            >
                <i className={`bi ${aberto ? 'bi-x-lg' : 'bi-chat-dots-fill'}`}></i>
            </button>

            {/* ── Painel do chat ── */}
            {aberto && (
                <div className="chat-panel fade-in">
                    {/* Header */}
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <div className="chat-header-icon">
                                <i className="bi bi-headset"></i>
                            </div>
                            <div>
                                <div className="chat-header-title">
                                    {sessaoAtiva ? sessaoAtiva.protocolo : 'Suporte TI'}
                                </div>
                                <div className="chat-header-status">
                                    {sessaoAtiva ? (
                                        <span className={`chat-status-dot chat-status-${sessaoAtiva.status.toLowerCase().replace(' ', '-')}`}></span>
                                    ) : null}
                                    {sessaoAtiva ? sessaoAtiva.status : 'Tire suas dúvidas conosco'}
                                </div>
                            </div>
                        </div>
                        {sessaoAtiva && sessaoAtiva.status !== 'Encerrado' && (
                            <button className="btn-icon" onClick={encerrar} title="Encerrar chat" style={{ width: 30, height: 30, fontSize: 13, color: 'var(--text-color)' }}>
                                <i className="bi bi-box-arrow-right"></i>
                            </button>
                        )}
                    </div>

                    {/* Corpo */}
                    <div className="chat-body" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="chat-messages" style={{ flex: 1, paddingBottom: 10 }}>
                            {sessoes.length === 0 && !exibirFormNovo && (
                                <div style={{textAlign: 'center', color: 'var(--text-muted)', marginTop: 40}}>
                                    Carregando histórico...
                                </div>
                            )}

                            {renderizarMensagens()}

                            {/* Aviso de aguardando para a sessão ativa */}
                            {sessaoAtiva && sessaoAtiva.status === 'Aguardando' && (
                                <div className="chat-waiting-banner">
                                    <i className="bi bi-hourglass-split"></i>
                                    <span>Aguardando um atendente aceitar...</span>
                                </div>
                            )}

                            {/* Formulário Novo Atendimento */}
                            {exibirFormNovo && (
                                <div className="chat-welcome mt-3" style={{ borderTop: sessoes.length > 0 ? '1px solid var(--border-color)' : 'none', paddingTop: 20 }}>
                                    {sessoes.length === 0 && (
                                        <>
                                            <div className="chat-welcome-icon">
                                                <i className="bi bi-chat-heart"></i>
                                            </div>
                                            <h6>Olá, {usuario?.nome.split(' ')[0]}! 👋</h6>
                                            <p>Descreva brevemente o que precisa e um atendente irá te ajudar.</p>
                                        </>
                                    )}
                                    <div style={{ width: '100%' }}>
                                        <input
                                            type="text" className="form-control form-control-sm mb-2"
                                            placeholder="Qual o assunto?"
                                            value={assunto}
                                            onChange={e => setAssunto(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') abrirChat(); }}
                                        />
                                        {erro && <div className="text-danger mb-2" style={{ fontSize: 12 }}>{erro}</div>}
                                        <button className="btn btn-primary btn-sm w-100" onClick={abrirChat} disabled={carregando}>
                                            {carregando ? 'Abrindo...' : <><i className="bi bi-send me-1"></i>Iniciar {sessoes.length > 0 ? 'Novo' : ''} Atendimento</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input de mensagem */}
                    {sessaoAtiva && sessaoAtiva.status !== 'Encerrado' && (
                        <div className="chat-input-area">
                            <input
                                type="text"
                                className="chat-input"
                                placeholder={sessaoAtiva.status === 'Aguardando' ? 'Aguardando atendente...' : 'Digite sua mensagem...'}
                                value={textoMsg}
                                onChange={e => setTextoMsg(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={sessaoAtiva.status === 'Aguardando' || enviando}
                            />
                            <button
                                className="chat-send-btn"
                                onClick={enviar}
                                disabled={!textoMsg.trim() || sessaoAtiva.status === 'Aguardando' || enviando}
                            >
                                <i className="bi bi-send-fill"></i>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
