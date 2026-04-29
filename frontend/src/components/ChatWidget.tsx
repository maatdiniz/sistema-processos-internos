// Arquivo: frontend/src/components/ChatWidget.tsx
import { useState, useEffect, useRef } from 'react';

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
    const [aberto, setAberto] = useState(false);
    const [sessaoAtiva, setSessaoAtiva] = useState<Sessao | null>(null);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [textoMsg, setTextoMsg] = useState('');
    const [assunto, setAssunto] = useState('');
    const [statusSessao, setStatusSessao] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollingRef = useRef<number | null>(null);

    // Auto-scroll para última mensagem
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [mensagens]);

    // Buscar sessão ativa ao abrir
    useEffect(() => {
        if (aberto && !sessaoAtiva) {
            buscarSessaoAtiva();
        }
    }, [aberto]);

    // Polling de mensagens quando há sessão ativa
    useEffect(() => {
        if (sessaoAtiva && sessaoAtiva.status !== 'Encerrado') {
            pollingRef.current = window.setInterval(() => {
                buscarMensagens(sessaoAtiva.id);
            }, 3000);
            return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
        }
    }, [sessaoAtiva]);

    const buscarSessaoAtiva = async () => {
        try {
            const res = await fetch(`${API}/chat/sessoes`);
            if (!res.ok) return;
            const sessoes: Sessao[] = await res.json();
            const ativa = sessoes.find(s => s.status === 'Aguardando' || s.status === 'Ativo');
            if (ativa) {
                setSessaoAtiva(ativa);
                setStatusSessao(ativa.status);
                await buscarMensagens(ativa.id);
            }
        } catch { /* silencioso */ }
    };

    const buscarMensagens = async (sessaoId: number) => {
        try {
            const res = await fetch(`${API}/chat/sessoes/${sessaoId}/mensagens`);
            if (!res.ok) return;
            const data = await res.json();
            setMensagens(data.mensagens);
            if (data.status) setStatusSessao(data.status);
            if (data.status === 'Encerrado') {
                if (pollingRef.current) clearInterval(pollingRef.current);
            }
        } catch { /* silencioso */ }
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
                const novaSessao: Sessao = { id: data.id, protocolo: data.protocolo, assunto, status: 'Aguardando', created_at: new Date().toISOString() };
                setSessaoAtiva(novaSessao);
                setStatusSessao('Aguardando');
                setAssunto('');
                await buscarMensagens(data.id);
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
                await buscarMensagens(sessaoAtiva.id);
            }
        } catch { /* silencioso */ }
        finally { setEnviando(false); }
    };

    const encerrar = async () => {
        if (!sessaoAtiva) return;
        try {
            const res = await fetch(`${API}/chat/sessoes/${sessaoAtiva.id}/encerrar`, { method: 'PATCH' });
            if (res.ok) {
                setStatusSessao('Encerrado');
                if (pollingRef.current) clearInterval(pollingRef.current);
                await buscarMensagens(sessaoAtiva.id);
            }
        } catch { /* silencioso */ }
    };

    const novoChat = () => {
        setSessaoAtiva(null);
        setMensagens([]);
        setStatusSessao('');
        setTextoMsg('');
        setAssunto('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
    };

    const formatHora = (dt: string) => {
        try { return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
        catch { return ''; }
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
                                        <span className={`chat-status-dot chat-status-${statusSessao.toLowerCase().replace(' ', '-')}`}></span>
                                    ) : null}
                                    {sessaoAtiva ? statusSessao : 'Tire suas dúvidas conosco'}
                                </div>
                            </div>
                        </div>
                        {sessaoAtiva && statusSessao !== 'Encerrado' && (
                            <button className="btn-icon" onClick={encerrar} title="Encerrar chat" style={{ width: 30, height: 30, fontSize: 13 }}>
                                <i className="bi bi-box-arrow-right"></i>
                            </button>
                        )}
                    </div>

                    {/* Corpo */}
                    <div className="chat-body">
                        {!sessaoAtiva ? (
                            /* ── Tela inicial: abrir chat ── */
                            <div className="chat-welcome">
                                <div className="chat-welcome-icon">
                                    <i className="bi bi-chat-heart"></i>
                                </div>
                                <h6>Olá! 👋</h6>
                                <p>Descreva brevemente o que precisa e um atendente irá te ajudar.</p>
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
                                        {carregando ? 'Abrindo...' : <><i className="bi bi-send me-1"></i>Iniciar Conversa</>}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ── Área de mensagens ── */
                            <div className="chat-messages">
                                {statusSessao === 'Aguardando' && (
                                    <div className="chat-waiting-banner">
                                        <i className="bi bi-hourglass-split"></i>
                                        <span>Aguardando um atendente aceitar...</span>
                                    </div>
                                )}
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
                                {statusSessao === 'Encerrado' && (
                                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px' }}>Chat encerrado</p>
                                        <button className="btn btn-outline-primary btn-sm" onClick={novoChat}>
                                            <i className="bi bi-plus-circle me-1"></i>Novo Chat
                                        </button>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input de mensagem */}
                    {sessaoAtiva && statusSessao !== 'Encerrado' && (
                        <div className="chat-input-area">
                            <input
                                type="text"
                                className="chat-input"
                                placeholder={statusSessao === 'Aguardando' ? 'Aguardando atendente...' : 'Digite sua mensagem...'}
                                value={textoMsg}
                                onChange={e => setTextoMsg(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={statusSessao === 'Aguardando' || enviando}
                            />
                            <button
                                className="chat-send-btn"
                                onClick={enviar}
                                disabled={!textoMsg.trim() || statusSessao === 'Aguardando' || enviando}
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
