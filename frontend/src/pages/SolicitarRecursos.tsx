// Arquivo: frontend/src/pages/SolicitarRecursos.tsx
import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

interface SolicitacaoRecurso {
    id: number;
    protocolo: string;
    nome_sugerido: string;
    descricao_sugerida: string | null;
    nome_aprovado: string | null;
    descricao_aprovada: string | null;
    status: string;
    justificativa_admin: string | null;
    solicitante_nome: string | null;
    admin_nome: string | null;
    created_at: string;
    updated_at: string;
}

function getStatusRecursoClass(status: string): string {
    switch (status) {
        case 'Pendente': return 'status-pendente';
        case 'Em Tratamento': return 'status-em-analise';
        case 'Aprovado': return 'status-aprovado';
        case 'Recusado': return 'status-recusado';
        default: return '';
    }
}

export function SolicitarRecursos() {
    // ── Form state ──
    const [nomeSugerido, setNomeSugerido] = useState('');
    const [descricaoSugerida, setDescricaoSugerida] = useState('');
    const [protocoloCriado, setProtocoloCriado] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);
    const [erroForm, setErroForm] = useState('');

    // ── Lista de solicitações ──
    const [solicitacoes, setSolicitacoes] = useState<SolicitacaoRecurso[]>([]);
    const [carregando, setCarregando] = useState(true);

    // ── Admin: modal de aprovação ──
    const [modalAberto, setModalAberto] = useState<'aprovar' | 'recusar' | null>(null);
    const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<SolicitacaoRecurso | null>(null);
    const [nomeAprovado, setNomeAprovado] = useState('');
    const [descricaoAprovada, setDescricaoAprovada] = useState('');
    const [justificativaAdmin, setJustificativaAdmin] = useState('');
    const [erroModal, setErroModal] = useState('');

    // Buscar solicitações
    const buscar = async () => {
        try {
            const res = await fetch(`${API}/solicitacoes-recurso`);
            if (res.ok) setSolicitacoes(await res.json());
        } catch { console.error('Erro ao carregar solicitações de recurso'); }
        finally { setCarregando(false); }
    };

    useEffect(() => { buscar(); }, []);

    // ── Enviar nova solicitação ──
    const enviar = async () => {
        setErroForm('');
        if (!nomeSugerido.trim()) { setErroForm('Informe o nome da categoria.'); return; }
        setEnviando(true);
        try {
            const res = await fetch(`${API}/solicitacoes-recurso`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_sugerido: nomeSugerido, descricao_sugerida: descricaoSugerida })
            });
            const data = await res.json();
            if (res.ok) {
                setProtocoloCriado(data.protocolo);
                setNomeSugerido('');
                setDescricaoSugerida('');
                buscar();
            } else {
                setErroForm(data.erro || 'Erro ao enviar solicitação.');
            }
        } catch { setErroForm('Erro de conexão com o servidor.'); }
        finally { setEnviando(false); }
    };

    // ── Admin: Iniciar análise ──
    const iniciarAnalise = async (id: number) => {
        try {
            const res = await fetch(`${API}/admin/solicitacoes-recurso/${id}/analisar`, { method: 'PATCH' });
            if (res.ok) buscar();
            else { const d = await res.json(); alert(d.erro || 'Erro.'); }
        } catch { alert('Erro de conexão.'); }
    };

    // ── Admin: Abrir modal de aprovação ──
    const abrirAprovacao = (s: SolicitacaoRecurso) => {
        setSolicitacaoSelecionada(s);
        setNomeAprovado(s.nome_sugerido);
        setDescricaoAprovada(s.descricao_sugerida || '');
        setErroModal('');
        setModalAberto('aprovar');
    };

    // ── Admin: Abrir modal de recusa ──
    const abrirRecusa = (s: SolicitacaoRecurso) => {
        setSolicitacaoSelecionada(s);
        setJustificativaAdmin('');
        setErroModal('');
        setModalAberto('recusar');
    };

    // ── Admin: Confirmar aprovação ──
    const confirmarAprovacao = async () => {
        if (!solicitacaoSelecionada) return;
        setErroModal('');
        if (!nomeAprovado.trim()) { setErroModal('O nome não pode estar vazio.'); return; }
        try {
            const res = await fetch(`${API}/admin/solicitacoes-recurso/${solicitacaoSelecionada.id}/aprovar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_aprovado: nomeAprovado, descricao_aprovada: descricaoAprovada })
            });
            const data = await res.json();
            if (res.ok) { setModalAberto(null); buscar(); }
            else { setErroModal(data.erro || data.detalhes?.join(', ') || 'Erro ao aprovar.'); }
        } catch { setErroModal('Erro de conexão.'); }
    };

    // ── Admin: Confirmar recusa ──
    const confirmarRecusa = async () => {
        if (!solicitacaoSelecionada) return;
        setErroModal('');
        if (!justificativaAdmin.trim()) { setErroModal('A justificativa é obrigatória.'); return; }
        try {
            const res = await fetch(`${API}/admin/solicitacoes-recurso/${solicitacaoSelecionada.id}/recusar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ justificativa_admin: justificativaAdmin })
            });
            const data = await res.json();
            if (res.ok) { setModalAberto(null); buscar(); }
            else { setErroModal(data.erro || data.detalhes?.join(', ') || 'Erro ao recusar.'); }
        } catch { setErroModal('Erro de conexão.'); }
    };

    // Fechar modal
    const fecharModal = () => { setModalAberto(null); setSolicitacaoSelecionada(null); setErroModal(''); };

    return (
        <div className="page-section fade-in">

            {/* ════════════════════════════════════════════
                SEÇÃO SUPERIOR — Formulário de Solicitação
               ════════════════════════════════════════════ */}
            <div className="card border-0" style={{ marginBottom: 32 }}>
                <div className="card-body p-4 p-lg-5">
                    <div className="section-header-left mb-4">
                        <div className="section-icon" style={{ background: 'var(--warning-light)' }}>
                            <i className="bi bi-lightbulb" style={{ color: '#D97706' }}></i>
                        </div>
                        <div style={{ marginLeft: 14 }}>
                            <h2 className="section-title">Solicitar Novo Recurso</h2>
                            <p className="section-subtitle">Sugira uma nova categoria de demanda para ser adicionada ao sistema</p>
                        </div>
                    </div>

                    {protocoloCriado ? (
                        <div className="fade-in" style={{ textAlign: 'center', padding: '24px 0' }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <i className="bi bi-check-lg" style={{ fontSize: 28, color: 'var(--success)' }}></i>
                            </div>
                            <h5 style={{ fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Solicitação Enviada!</h5>
                            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Sua sugestão foi registrada com o protocolo:</p>
                            <div style={{ display: 'inline-block', background: 'var(--warning-light)', padding: '10px 24px', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
                                <span style={{ fontSize: 24, fontWeight: 800, color: '#D97706', letterSpacing: '-0.02em' }}>{protocoloCriado}</span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Acompanhe o status na seção abaixo.</p>
                            <button className="btn btn-outline-secondary btn-sm mt-2 px-3" onClick={() => setProtocoloCriado(null)}>
                                <i className="bi bi-plus-circle me-1"></i>Enviar outra solicitação
                            </button>
                        </div>
                    ) : (
                        <div className="fade-in">
                            <div className="row g-3">
                                <div className="col-12 col-md-6">
                                    <label className="form-label">Nome da Categoria Sugerida</label>
                                    <input type="text" className="form-control"
                                        placeholder="Ex: Transferência de Curso"
                                        value={nomeSugerido} onChange={e => setNomeSugerido(e.target.value)} />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label">Justificativa / Descrição <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                                    <input type="text" className="form-control"
                                        placeholder="Por que essa categoria deveria existir?"
                                        value={descricaoSugerida} onChange={e => setDescricaoSugerida(e.target.value)} />
                                </div>
                            </div>
                            {erroForm && <div className="text-danger mt-2" style={{ fontSize: 13 }}><i className="bi bi-exclamation-circle me-1"></i>{erroForm}</div>}
                            <div style={{ borderTop: '1px solid var(--border-light)', marginTop: 20, paddingTop: 16 }}>
                                <button className="btn btn-primary px-4" onClick={enviar} disabled={enviando}>
                                    {enviando ? <><i className="bi bi-arrow-repeat me-2" style={{ animation: 'spin 1s linear infinite' }}></i>Enviando...</> :
                                        <><i className="bi bi-send me-2"></i>Enviar Solicitação</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ════════════════════════════════════════════
                SEÇÃO INFERIOR — Solicitações Recentes
               ════════════════════════════════════════════ */}
            <div className="section-header" style={{ marginBottom: 16 }}>
                <div className="section-header-left">
                    <div className="section-icon">
                        <i className="bi bi-clock-history"></i>
                    </div>
                    <div>
                        <h2 className="section-title">Solicitações de Recursos</h2>
                        <p className="section-subtitle">{solicitacoes.length} solicitação(ões) registrada(s)</p>
                    </div>
                </div>
                <button className="btn-ghost" onClick={buscar}>
                    <i className="bi bi-arrow-clockwise"></i> Atualizar
                </button>
            </div>

            {carregando ? (
                <div className="loading-spinner"><i className="bi bi-arrow-repeat"></i> Carregando...</div>
            ) : solicitacoes.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><i className="bi bi-lightbulb"></i></div>
                    <p>Nenhuma solicitação de recurso registrada ainda.</p>
                </div>
            ) : (
                <div className="card border-0">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table-crm">
                            <thead>
                                <tr>
                                    <th style={{ width: 100 }}>Protocolo</th>
                                    <th>Nome Sugerido</th>
                                    <th>Justificativa</th>
                                    <th style={{ width: 120 }}>Status</th>
                                    <th>Resultado</th>
                                    <th style={{ width: 140 }}>Data</th>
                                    <th style={{ width: 160 }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {solicitacoes.map(s => (
                                    <tr key={s.id}>
                                        <td><span className="protocol-id">{s.protocolo}</span></td>
                                        <td style={{ fontWeight: 500 }}>{s.nome_sugerido}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {s.descricao_sugerida || '—'}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatusRecursoClass(s.status)}`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 13 }}>
                                            {s.status === 'Aprovado' && s.nome_aprovado && (
                                                <span style={{ color: 'var(--success)', fontWeight: 500 }}>
                                                    <i className="bi bi-check-circle me-1"></i>{s.nome_aprovado}
                                                </span>
                                            )}
                                            {s.status === 'Recusado' && s.justificativa_admin && (
                                                <span style={{ color: 'var(--text-muted)' }} title={s.justificativa_admin}>
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    {s.justificativa_admin.length > 40 ? s.justificativa_admin.substring(0, 40) + '...' : s.justificativa_admin}
                                                </span>
                                            )}
                                            {(s.status === 'Pendente' || s.status === 'Em Tratamento') && (
                                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aguardando</span>
                                            )}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                            {new Date(s.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1 flex-wrap">
                                                {s.status === 'Pendente' && (
                                                    <button className="btn btn-outline-primary btn-sm" style={{ fontSize: 11, padding: '3px 8px' }}
                                                        onClick={() => iniciarAnalise(s.id)}>
                                                        <i className="bi bi-eye me-1"></i>Analisar
                                                    </button>
                                                )}
                                                {(s.status === 'Pendente' || s.status === 'Em Tratamento') && (
                                                    <>
                                                        <button className="btn btn-outline-success btn-sm" style={{ fontSize: 11, padding: '3px 8px' }}
                                                            onClick={() => abrirAprovacao(s)}>
                                                            <i className="bi bi-check-lg me-1"></i>Aprovar
                                                        </button>
                                                        <button className="btn btn-outline-danger btn-sm" style={{ fontSize: 11, padding: '3px 8px' }}
                                                            onClick={() => abrirRecusa(s)}>
                                                            <i className="bi bi-x-lg me-1"></i>Recusar
                                                        </button>
                                                    </>
                                                )}
                                                {(s.status === 'Aprovado' || s.status === 'Recusado') && (
                                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Finalizado</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                MODAL DE APROVAÇÃO
               ════════════════════════════════════════════ */}
            {modalAberto === 'aprovar' && solicitacaoSelecionada && (
                <div className="modal-overlay fade-in" onClick={fecharModal}>
                    <div className="modal-recurso fade-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-recurso-header">
                            <h5><i className="bi bi-check-circle me-2" style={{ color: 'var(--success)' }}></i>Aprovar Solicitação</h5>
                            <button className="btn-icon" onClick={fecharModal} style={{ width: 32, height: 32, fontSize: 14 }}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="modal-recurso-body">
                            <div className="confirmation-card" style={{ marginBottom: 20 }}>
                                <h6><i className="bi bi-info-circle"></i> Dados originais do solicitante</h6>
                                <div className="confirmation-row">
                                    <span className="confirmation-label">Protocolo</span>
                                    <span className="confirmation-value" style={{ fontWeight: 600, color: '#D97706' }}>{solicitacaoSelecionada.protocolo}</span>
                                </div>
                                <div className="confirmation-row">
                                    <span className="confirmation-label">Nome sugerido</span>
                                    <span className="confirmation-value">{solicitacaoSelecionada.nome_sugerido}</span>
                                </div>
                                <div className="confirmation-row">
                                    <span className="confirmation-label">Justificativa</span>
                                    <span className="confirmation-value">{solicitacaoSelecionada.descricao_sugerida || 'Nenhuma'}</span>
                                </div>
                            </div>

                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                                <i className="bi bi-pencil me-1"></i>Edite abaixo antes de aprovar. Esses serão os dados finais do novo tipo de demanda:
                            </p>
                            <div className="row g-3">
                                <div className="col-12">
                                    <label className="form-label">Nome Final da Categoria</label>
                                    <input type="text" className="form-control"
                                        value={nomeAprovado} onChange={e => setNomeAprovado(e.target.value)} />
                                </div>
                                <div className="col-12">
                                    <label className="form-label">Descrição Final <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                                    <textarea className="form-control" rows={3}
                                        value={descricaoAprovada} onChange={e => setDescricaoAprovada(e.target.value)}></textarea>
                                </div>
                            </div>
                            {erroModal && <div className="text-danger mt-2" style={{ fontSize: 13 }}><i className="bi bi-exclamation-circle me-1"></i>{erroModal}</div>}
                        </div>
                        <div className="modal-recurso-footer">
                            <button className="btn btn-outline-secondary px-3" onClick={fecharModal}>Cancelar</button>
                            <button className="btn btn-success px-4" onClick={confirmarAprovacao}>
                                <i className="bi bi-check-circle me-2"></i>Aprovar e Criar Categoria
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                MODAL DE RECUSA
               ════════════════════════════════════════════ */}
            {modalAberto === 'recusar' && solicitacaoSelecionada && (
                <div className="modal-overlay fade-in" onClick={fecharModal}>
                    <div className="modal-recurso fade-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-recurso-header">
                            <h5><i className="bi bi-x-circle me-2" style={{ color: 'var(--danger)' }}></i>Recusar Solicitação</h5>
                            <button className="btn-icon" onClick={fecharModal} style={{ width: 32, height: 32, fontSize: 14 }}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="modal-recurso-body">
                            <div className="confirmation-card" style={{ marginBottom: 20 }}>
                                <h6><i className="bi bi-info-circle"></i> Solicitação</h6>
                                <div className="confirmation-row">
                                    <span className="confirmation-label">Protocolo</span>
                                    <span className="confirmation-value" style={{ fontWeight: 600, color: '#D97706' }}>{solicitacaoSelecionada.protocolo}</span>
                                </div>
                                <div className="confirmation-row">
                                    <span className="confirmation-label">Nome sugerido</span>
                                    <span className="confirmation-value">{solicitacaoSelecionada.nome_sugerido}</span>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Justificativa da Recusa <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <textarea className="form-control" rows={3}
                                    placeholder="Explique o motivo da recusa para o solicitante..."
                                    value={justificativaAdmin} onChange={e => setJustificativaAdmin(e.target.value)}></textarea>
                            </div>
                            {erroModal && <div className="text-danger mt-2" style={{ fontSize: 13 }}><i className="bi bi-exclamation-circle me-1"></i>{erroModal}</div>}
                        </div>
                        <div className="modal-recurso-footer">
                            <button className="btn btn-outline-secondary px-3" onClick={fecharModal}>Cancelar</button>
                            <button className="btn btn-danger px-4" onClick={confirmarRecusa}>
                                <i className="bi bi-x-circle me-2"></i>Confirmar Recusa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
