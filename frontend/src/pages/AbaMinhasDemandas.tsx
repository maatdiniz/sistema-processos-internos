// Arquivo: frontend/src/pages/AbaMinhasDemandas.tsx
import { useState, useEffect } from 'react';

interface Demanda {
    id: number;
    protocolo: string;
    assunto: string;
    tipo_nome: string;
    prioridade_nome: string;
    prioridade_cor: string;
    departamento_destino_nome: string;
    responsavel_nome: string | null;
    status: string;
    prazo_desejado: string | null;
    created_at: string;
}

function TabelaDemandas({ demandas, vazia }: { demandas: Demanda[]; vazia: string }) {
    const getStatusClass = (s: string) => {
        const l = s.toLowerCase();
        if (l.includes('andamento')) return 'status-em-andamento';
        if (l.includes('resolv')) return 'status-resolvido';
        if (l.includes('fechad')) return 'status-fechado';
        return 'status-aberto';
    };

    if (demandas.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon"><i className="bi bi-inbox"></i></div>
                <p>{vazia}</p>
            </div>
        );
    }

    return (
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
                            <th>Prazo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {demandas.map(d => (
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
                                <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                    {d.prazo_desejado ? new Date(d.prazo_desejado + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function AbaMinhasDemandas() {
    const [subAba, setSubAba] = useState<'solicitacoes' | 'atribuicoes'>('solicitacoes');
    const [todasDemandas, setTodasDemandas] = useState<Demanda[]>([]);
    const [carregando, setCarregando] = useState(true);

    const buscar = async () => {
        setCarregando(true);
        try {
            const res = await fetch('http://localhost:3000/demandas');
            if (res.ok) setTodasDemandas(await res.json());
        } catch (e) { console.error('Erro de conexão', e); }
        finally { setCarregando(false); }
    };

    useEffect(() => { buscar(); }, []);

    // TODO: Quando tiver autenticação, filtrar por funcionario_solicitante_id e funcionario_responsavel_id
    // Por enquanto mostra todas, separadas pela lógica conceitual
    const solicitacoes = todasDemandas; // Futuro: .filter(d => d.funcionario_solicitante_id === usuarioLogadoId)
    const atribuicoes = todasDemandas.filter(d => d.responsavel_nome); // Mostra as que têm responsável atribuído

    const contSolicitacoes = solicitacoes.length;
    const contAtribuicoes = atribuicoes.length;

    return (
        <div className="page-section fade-in">
            <div className="section-header" style={{ marginBottom: 16 }}>
                <div className="section-header-left">
                    <div className="section-icon"><i className="bi bi-person-lines-full"></i></div>
                    <div>
                        <h2 className="section-title">Minhas Demandas</h2>
                        <p className="section-subtitle">Suas solicitações e demandas atribuídas a você</p>
                    </div>
                </div>
                <button className="btn-ghost" onClick={buscar}>
                    <i className="bi bi-arrow-clockwise"></i> Atualizar
                </button>
            </div>

            {/* Sub-abas */}
            <div className="admin-tabs" style={{ marginBottom: 20 }}>
                <button
                    className={`admin-tab ${subAba === 'solicitacoes' ? 'active' : ''}`}
                    onClick={() => setSubAba('solicitacoes')}
                >
                    <i className="bi bi-send"></i>
                    Solicitações
                    <span className="tab-count">{contSolicitacoes}</span>
                </button>
                <button
                    className={`admin-tab ${subAba === 'atribuicoes' ? 'active' : ''}`}
                    onClick={() => setSubAba('atribuicoes')}
                >
                    <i className="bi bi-person-check"></i>
                    Atribuídas a mim
                    <span className="tab-count">{contAtribuicoes}</span>
                </button>
            </div>

            {carregando ? (
                <div className="loading-spinner"><i className="bi bi-arrow-repeat"></i> Carregando...</div>
            ) : (
                <div key={subAba} className="fade-in">
                    {subAba === 'solicitacoes' && (
                        <>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                                <i className="bi bi-info-circle me-1"></i>
                                Tudo aquilo que você requisitou — demandas abertas por você para outros setores.
                            </p>
                            <TabelaDemandas demandas={solicitacoes} vazia="Você ainda não abriu nenhuma solicitação." />
                        </>
                    )}
                    {subAba === 'atribuicoes' && (
                        <>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                                <i className="bi bi-info-circle me-1"></i>
                                Responsabilidades delegadas a você — demandas que outros setores encaminharam para resolução.
                            </p>
                            <TabelaDemandas demandas={atribuicoes} vazia="Nenhuma demanda foi atribuída a você no momento." />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}