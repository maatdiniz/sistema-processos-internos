// Arquivo: frontend/src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';

interface Demanda {
    id: number;
    protocolo: string;
    assunto: string;
    tipo_nome: string;
    prioridade_nome: string;
    prioridade_cor: string;
    departamento_destino_nome: string;
    status: string;
    created_at: string;
}

interface Contadores {
    total: number;
    abertos: number;
    emAndamento: number;
    resolvidos: number;
}

export function Dashboard() {
    const [recentes, setRecentes] = useState<Demanda[]>([]);
    const [contadores, setContadores] = useState<Contadores>({ total: 0, abertos: 0, emAndamento: 0, resolvidos: 0 });
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3000/demandas')
            .then(r => r.json())
            .then((dados: Demanda[]) => {
                setRecentes(dados.slice(0, 10));
                setContadores({
                    total: dados.length,
                    abertos: dados.filter(d => d.status === 'Aberto').length,
                    emAndamento: dados.filter(d => d.status === 'Em Andamento').length,
                    resolvidos: dados.filter(d => d.status === 'Resolvido' || d.status === 'Fechado').length,
                });
            })
            .catch(() => {})
            .finally(() => setCarregando(false));
    }, []);

    const getStatusClass = (s: string) => {
        const l = s.toLowerCase();
        if (l.includes('andamento')) return 'status-em-andamento';
        if (l.includes('resolv')) return 'status-resolvido';
        if (l.includes('fechad')) return 'status-fechado';
        return 'status-aberto';
    };

    const cards = [
        { label: 'Total de Demandas', valor: contadores.total, icon: 'bi-folder2-open', cor: 'var(--primary)', bgCor: 'var(--primary-light)' },
        { label: 'Em Aberto', valor: contadores.abertos, icon: 'bi-clock-history', cor: 'var(--info)', bgCor: 'var(--info-light)' },
        { label: 'Em Andamento', valor: contadores.emAndamento, icon: 'bi-arrow-repeat', cor: '#D97706', bgCor: 'var(--warning-light)' },
        { label: 'Resolvidas', valor: contadores.resolvidos, icon: 'bi-check-circle', cor: '#059669', bgCor: 'var(--success-light)' },
    ];

    if (carregando) return <div className="loading-spinner fade-in"><i className="bi bi-arrow-repeat"></i> Carregando...</div>;

    return (
        <div className="page-section fade-in">
            {/* ── Cards de resumo ── */}
            <div className="dashboard-cards">
                {cards.map((c, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-card-icon" style={{ background: c.bgCor }}>
                            <i className={`bi ${c.icon}`} style={{ color: c.cor }}></i>
                        </div>
                        <div className="stat-card-info">
                            <span className="stat-card-value">{c.valor}</span>
                            <span className="stat-card-label">{c.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Demandas recentes ── */}
            <div style={{ marginTop: 28 }}>
                <div className="section-header" style={{ marginBottom: 16 }}>
                    <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-clock-history" style={{ fontSize: 18, color: 'var(--text-muted)' }}></i>
                        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>Demandas Recentes</h3>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                            Últimas {recentes.length}
                        </span>
                    </div>
                </div>

                {recentes.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon"><i className="bi bi-inbox"></i></div>
                        <p>Nenhuma demanda registrada ainda.</p>
                    </div>
                ) : (
                    <div className="card border-0">
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table-crm">
                                <thead>
                                    <tr>
                                        <th>Protocolo</th>
                                        <th>Assunto</th>
                                        <th>Tipo</th>
                                        <th>Destino</th>
                                        <th>Prioridade</th>
                                        <th>Status</th>
                                        <th>Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentes.map(d => (
                                        <tr key={d.id}>
                                            <td><span className="protocol-id">{d.protocolo}</span></td>
                                            <td>{d.assunto}</td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{d.tipo_nome}</td>
                                            <td style={{ fontSize: 13 }}>{d.departamento_destino_nome}</td>
                                            <td>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: d.prioridade_cor }}>
                                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.prioridade_cor }}></span>
                                                    {d.prioridade_nome}
                                                </span>
                                            </td>
                                            <td><span className={`status-badge ${getStatusClass(d.status)}`}>{d.status}</span></td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                                                {d.created_at ? new Date(d.created_at).toLocaleDateString('pt-BR') : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
