// Arquivo: frontend/src/pages/Solicitacoes.tsx
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
    prazo_desejado: string | null;
    created_at: string;
}

export function Solicitacoes() {
    const [demandas, setDemandas] = useState<Demanda[]>([]);
    const [carregando, setCarregando] = useState(true);

    const buscar = async () => {
        setCarregando(true);
        try {
            const res = await fetch('http://localhost:3000/demandas');
            if (res.ok) {
                // TODO: Filtrar por funcionario_solicitante_id === usuarioLogadoId quando tiver auth
                setDemandas(await res.json());
            }
        } catch (e) { console.error('Erro de conexão', e); }
        finally { setCarregando(false); }
    };

    useEffect(() => { buscar(); }, []);

    const getStatusClass = (s: string) => {
        const l = s.toLowerCase();
        if (l.includes('andamento')) return 'status-em-andamento';
        if (l.includes('resolv')) return 'status-resolvido';
        if (l.includes('fechad')) return 'status-fechado';
        return 'status-aberto';
    };

    return (
        <div className="page-section fade-in">
            <div className="section-header" style={{ marginBottom: 16 }}>
                <div className="section-header-left">
                    <div className="section-icon"><i className="bi bi-send"></i></div>
                    <div>
                        <h2 className="section-title">Minhas Solicitações</h2>
                        <p className="section-subtitle">Tudo aquilo que você requisitou — demandas abertas por você para outros setores</p>
                    </div>
                </div>
                <button className="btn-ghost" onClick={buscar}>
                    <i className="bi bi-arrow-clockwise"></i> Atualizar
                </button>
            </div>

            {carregando ? (
                <div className="loading-spinner"><i className="bi bi-arrow-repeat"></i> Carregando...</div>
            ) : demandas.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><i className="bi bi-inbox"></i></div>
                    <p>Você ainda não abriu nenhuma solicitação.</p>
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
            )}
        </div>
    );
}
