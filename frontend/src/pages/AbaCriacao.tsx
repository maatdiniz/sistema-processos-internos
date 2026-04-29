import { useState, useEffect } from 'react';

interface TipoDemanda { id: number; nome: string; descricao: string | null; template: string | null; }
interface Departamento { id: number; nome: string; }
interface Prioridade { id: number; nome: string; descricao: string; ordem: number; cor: string; }
interface Funcionario { id: number; nome: string; matricula: string; }

const API = 'http://localhost:3000';

export function AbaCriacao() {
    const [etapaAtual, setEtapaAtual] = useState(1);
    const [tiposDemanda, setTiposDemanda] = useState<TipoDemanda[]>([]);
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    const [prioridades, setPrioridades] = useState<Prioridade[]>([]);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [protocoloCriado, setProtocoloCriado] = useState<string | null>(null);

    // Campos do formulário
    const [assunto, setAssunto] = useState('');
    const [tipoDemandaId, setTipoDemandaId] = useState<number>(0);
    const [descricao, setDescricao] = useState('');
    const [deptoDestinoId, setDeptoDestinoId] = useState<number>(0);
    const [funcionarioId, setFuncionarioId] = useState<number | null>(null);
    const [prioridadeId, setPrioridadeId] = useState<number>(0);
    const [prazoDesejado, setPrazoDesejado] = useState('');

    // Carregar dados do backend
    useEffect(() => {
        Promise.all([
            fetch(`${API}/tipos-demanda`).then(r => r.json()),
            fetch(`${API}/departamentos`).then(r => r.json()),
            fetch(`${API}/prioridades`).then(r => r.json()),
        ]).then(([tipos, deptos, prios]) => {
            setTiposDemanda(tipos);
            setDepartamentos(deptos);
            setPrioridades(prios);
            if (tipos.length > 0) {
                setTipoDemandaId(tipos[0].id);
                setDescricao(prev => prev || tipos[0].template || '');
            }
            if (deptos.length > 0) setDeptoDestinoId(deptos[0].id);
        }).catch(err => console.error('Erro ao carregar dados:', err));
    }, []);

    const handleTipoDemandaChange = (novoId: number) => {
        const tipoAntigo = tiposDemanda.find(t => t.id === tipoDemandaId);
        const novoTipo = tiposDemanda.find(t => t.id === novoId);
        
        // Atualizar o template apenas se a descrição estiver vazia ou for igual ao template do tipo antigo
        setDescricao(prevDesc => {
            if (!prevDesc || (tipoAntigo?.template && prevDesc.trim() === tipoAntigo.template.trim())) {
                return novoTipo?.template || '';
            }
            return prevDesc;
        });
        
        setTipoDemandaId(novoId);
    };

    // Carregar funcionários quando mudar o departamento destino
    useEffect(() => {
        if (!deptoDestinoId) return;
        fetch(`${API}/funcionarios/departamento/${deptoDestinoId}`)
            .then(r => r.json())
            .then(data => { setFuncionarios(data); setFuncionarioId(null); })
            .catch(() => setFuncionarios([]));
    }, [deptoDestinoId]);

    const etapas = [
        { num: 1, label: 'Identificação' },
        { num: 2, label: 'Detalhamento' },
        { num: 3, label: 'Prioridade & Prazo' },
        { num: 4, label: 'Confirmação' },
    ];

    // Lookup helpers
    const tipoNome = tiposDemanda.find(t => t.id === tipoDemandaId)?.nome || '—';
    const deptoNome = departamentos.find(d => d.id === deptoDestinoId)?.nome || '—';
    const prioSelecionada = prioridades.find(p => p.id === prioridadeId);
    const funcNome = funcionarios.find(f => f.id === funcionarioId)?.nome;

    const resetTudo = () => {
        setEtapaAtual(1);
        setAssunto('');
        setTipoDemandaId(tiposDemanda[0]?.id || 0);
        setDescricao(tiposDemanda[0]?.template || '');
        setDeptoDestinoId(departamentos[0]?.id || 0);
        setFuncionarioId(null);
        setPrioridadeId(0);
        setPrazoDesejado('');
        setProtocoloCriado(null);
    };

    const enviar = async () => {
        try {
            const res = await fetch(`${API}/demandas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assunto,
                    descricao,
                    tipo_demanda_id: tipoDemandaId,
                    prioridade_id: prioridadeId,
                    departamento_destino_id: deptoDestinoId,
                    funcionario_responsavel_id: funcionarioId,
                    prazo_desejado: prazoDesejado || undefined
                })
            });
            const data = await res.json();
            if (res.ok) {
                setProtocoloCriado(data.protocolo);
            } else {
                alert(data.erro || data.detalhes?.join(', ') || 'Erro ao registrar demanda.');
            }
        } catch {
            alert('Erro de conexão com o servidor.');
        }
    };

    // ── Tela de protocolo criado com sucesso ──
    if (protocoloCriado) {
        return (
            <div className="page-section fade-in">
                <div className="card border-0">
                    <div className="card-body p-5 text-center">
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <i className="bi bi-check-lg" style={{ fontSize: 32, color: 'var(--success)' }}></i>
                        </div>
                        <h3 style={{ fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Demanda Registrada!</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 24 }}>
                            Sua demanda foi criada com o protocolo:
                        </p>
                        <div style={{ display: 'inline-block', background: 'var(--primary-light)', padding: '12px 28px', borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
                            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>{protocoloCriado}</span>
                        </div>
                        <div className="confirmation-card" style={{ maxWidth: 500, margin: '0 auto 24px', textAlign: 'left' }}>
                            <div className="confirmation-row"><span className="confirmation-label">Assunto</span><span className="confirmation-value">{assunto}</span></div>
                            <div className="confirmation-row"><span className="confirmation-label">Tipo</span><span className="confirmation-value">{tipoNome}</span></div>
                            <div className="confirmation-row"><span className="confirmation-label">Destino</span><span className="confirmation-value">{deptoNome}</span></div>
                            {funcNome && <div className="confirmation-row"><span className="confirmation-label">Responsável</span><span className="confirmation-value">{funcNome}</span></div>}
                            <div className="confirmation-row">
                                <span className="confirmation-label">Prioridade</span>
                                <span className="confirmation-value" style={{ color: prioSelecionada?.cor, fontWeight: 600 }}>{prioSelecionada?.nome}</span>
                            </div>
                            {prazoDesejado && <div className="confirmation-row"><span className="confirmation-label">Prazo</span><span className="confirmation-value">{new Date(prazoDesejado + 'T00:00:00').toLocaleDateString('pt-BR')}</span></div>}
                        </div>
                        <button className="btn btn-primary px-4" onClick={resetTudo}>
                            <i className="bi bi-plus-circle me-2"></i> Abrir Nova Demanda
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-section fade-in">
            <div className="card border-0">
                <div className="card-body p-4 p-lg-5">

                    {/* Header */}
                    <div className="section-header-left mb-4">
                        <div className="section-icon"><i className="bi bi-send"></i></div>
                        <div style={{ marginLeft: 14 }}>
                            <h2 className="section-title">Nova Demanda</h2>
                            <p className="section-subtitle">Preencha as informações para registrar sua solicitação</p>
                        </div>
                    </div>

                    {/* Stepper 4 etapas */}
                    <div className="wizard-stepper">
                        {etapas.map((etapa) => (
                            <div key={etapa.num} className={`wizard-step ${etapaAtual === etapa.num ? 'active' : ''} ${etapaAtual > etapa.num ? 'completed' : ''}`}>
                                <div className="step-circle">
                                    {etapaAtual > etapa.num ? <i className="bi bi-check2" style={{ fontSize: 16 }}></i> : etapa.num}
                                </div>
                                <span className="step-label">{etapa.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* ═══ ETAPA 1 — Identificação ═══ */}
                    {etapaAtual === 1 && (
                        <div className="row g-4 fade-in">
                            <div className="col-12 col-md-7">
                                <label className="form-label">Assunto da Demanda</label>
                                <input type="text" className="form-control form-control-lg" style={{ fontSize: 14 }}
                                    placeholder="Ex: Criação de turma para Pedagogia 2026.1"
                                    value={assunto} onChange={e => setAssunto(e.target.value)} />
                            </div>
                            <div className="col-12 col-md-5">
                                <label className="form-label">Tipo de Demanda</label>
                                <select className="form-select form-select-lg" style={{ fontSize: 14 }}
                                    value={tipoDemandaId} onChange={e => handleTipoDemandaChange(Number(e.target.value))}>
                                    {tiposDemanda.map(t => (
                                        <option key={t.id} value={t.id}>{t.nome}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* ═══ ETAPA 2 — Detalhamento + Destino ═══ */}
                    {etapaAtual === 2 && (
                        <div className="fade-in">
                            <div className="row g-4">
                                <div className="col-12">
                                    <label className="form-label">Descrição Detalhada</label>
                                    <textarea className="form-control" rows={5}
                                        placeholder="Descreva os detalhes da sua solicitação..."
                                        value={descricao} onChange={e => setDescricao(e.target.value)} />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label">Setor de Destino</label>
                                    <select className="form-select" value={deptoDestinoId}
                                        onChange={e => setDeptoDestinoId(Number(e.target.value))}>
                                        {departamentos.map(d => (
                                            <option key={d.id} value={d.id}>{d.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label">Pessoa Responsável <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                                    <select className="form-select" value={funcionarioId ?? ''}
                                        onChange={e => setFuncionarioId(e.target.value ? Number(e.target.value) : null)}>
                                        <option value="">— Qualquer pessoa do setor —</option>
                                        {funcionarios.map(f => (
                                            <option key={f.id} value={f.id}>{f.nome} ({f.matricula})</option>
                                        ))}
                                    </select>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                        O setor de destino pode escalonar para uma pessoa específica depois.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ ETAPA 3 — Prioridade & Prazo ═══ */}
                    {etapaAtual === 3 && (
                        <div className="fade-in">
                            <label className="form-label mb-3">Nível de Prioridade</label>
                            <div className="priority-grid">
                                {prioridades.map(p => (
                                    <button key={p.id} type="button"
                                        className={`priority-card ${prioridadeId === p.id ? 'selected' : ''}`}
                                        style={{ '--priority-color': p.cor } as React.CSSProperties}
                                        onClick={() => setPrioridadeId(p.id)}>
                                        <div className="priority-card-header">
                                            <div className="priority-dot" style={{ background: p.cor }}></div>
                                            <span className="priority-name" style={{ color: p.cor }}>{p.nome}</span>
                                        </div>
                                        <p className="priority-desc">{p.descricao}</p>
                                    </button>
                                ))}
                            </div>

                            <div className="row g-4 mt-3">
                                <div className="col-12 col-md-4">
                                    <label className="form-label">Prazo Desejado <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                                    <input type="date" className="form-control"
                                        value={prazoDesejado} onChange={e => setPrazoDesejado(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]} />
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                        Futuramente, alguns tipos de demanda terão prazo mínimo obrigatório.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ ETAPA 4 — Confirmação ═══ */}
                    {etapaAtual === 4 && (
                        <div className="fade-in">
                            <div className="confirmation-card">
                                <h6><i className="bi bi-clipboard-check"></i> Resumo da Demanda</h6>
                                <div className="confirmation-row">
                                    <span className="confirmation-label">Assunto</span>
                                    <span className="confirmation-value">{assunto || '—'}</span>
                                </div>
                                <div className="confirmation-row">
                                    <span className="confirmation-label">Tipo</span>
                                    <span className="confirmation-value">{tipoNome}</span>
                                </div>
                                <div className="confirmation-row" style={{ alignItems: 'flex-start' }}>
                                    <span className="confirmation-label">Descrição</span>
                                    <span className="confirmation-value" style={{ whiteSpace: 'pre-wrap' }}>{descricao || 'Nenhuma descrição.'}</span>
                                </div>
                                <div className="confirmation-row">
                                    <span className="confirmation-label">Setor destino</span>
                                    <span className="confirmation-value">{deptoNome}</span>
                                </div>
                                {funcNome && (
                                    <div className="confirmation-row">
                                        <span className="confirmation-label">Responsável</span>
                                        <span className="confirmation-value">{funcNome}</span>
                                    </div>
                                )}
                                <div className="confirmation-row">
                                    <span className="confirmation-label">Prioridade</span>
                                    <span className="confirmation-value">
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: prioSelecionada?.cor }}></span>
                                            <span style={{ color: prioSelecionada?.cor, fontWeight: 600 }}>{prioSelecionada?.nome || '—'}</span>
                                        </span>
                                    </span>
                                </div>
                                {prazoDesejado && (
                                    <div className="confirmation-row">
                                        <span className="confirmation-label">Prazo desejado</span>
                                        <span className="confirmation-value">{new Date(prazoDesejado + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══ Botões de navegação ═══ */}
                    <div style={{ borderTop: '1px solid var(--border-light)', marginTop: 32, paddingTop: 24 }}>
                        <div className="d-flex justify-content-between">
                            <div>
                                {etapaAtual > 1 && (
                                    <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setEtapaAtual(etapaAtual - 1)}>
                                        <i className="bi bi-arrow-left me-2"></i>Voltar
                                    </button>
                                )}
                            </div>
                            <div>
                                {etapaAtual < 4 ? (
                                    <button type="button" className="btn btn-primary px-4"
                                        onClick={() => setEtapaAtual(etapaAtual + 1)}
                                        disabled={
                                            (etapaAtual === 1 && (!assunto.trim() || !tipoDemandaId)) ||
                                            (etapaAtual === 2 && !deptoDestinoId) ||
                                            (etapaAtual === 3 && !prioridadeId)
                                        }>
                                        Próxima Etapa <i className="bi bi-arrow-right ms-2"></i>
                                    </button>
                                ) : (
                                    <button type="button" className="btn btn-success px-4" onClick={enviar}>
                                        <i className="bi bi-check-circle me-2"></i> Confirmar e Gerar Protocolo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}