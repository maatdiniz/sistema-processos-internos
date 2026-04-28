// Arquivo: frontend/src/pages/admin/AdminTiposDemanda.tsx
import { useState, useEffect } from 'react';

const API = 'http://localhost:3000/admin/tipos-demanda';

interface TipoDemanda {
    id: number;
    nome: string;
    descricao: string | null;
    ativo: number;
}

export function AdminTiposDemanda() {
    const [lista, setLista] = useState<TipoDemanda[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [formAberto, setFormAberto] = useState(false);
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [erro, setErro] = useState('');

    const carregar = async () => {
        try {
            const res = await fetch(API);
            if (res.ok) setLista(await res.json());
        } catch { console.error('Erro ao carregar tipos de demanda'); }
        finally { setCarregando(false); }
    };

    useEffect(() => { carregar(); }, []);

    const resetForm = () => { setNome(''); setDescricao(''); setEditandoId(null); setFormAberto(false); setErro(''); };

    const abrirEdicao = (tipo: TipoDemanda) => {
        setNome(tipo.nome);
        setDescricao(tipo.descricao || '');
        setEditandoId(tipo.id);
        setFormAberto(true);
        setErro('');
    };

    const salvar = async () => {
        setErro('');
        try {
            const url = editandoId ? `${API}/${editandoId}` : API;
            const method = editandoId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, descricao })
            });
            const data = await res.json();
            if (!res.ok) { setErro(data.erro || data.detalhes?.join(', ') || 'Erro ao salvar.'); return; }
            resetForm();
            carregar();
        } catch { setErro('Erro de conexão com o servidor.'); }
    };

    const alternarAtivo = async (id: number) => {
        try {
            await fetch(`${API}/${id}/toggle`, { method: 'PATCH' });
            carregar();
        } catch { console.error('Erro ao alternar status'); }
    };

    if (carregando) return <div className="loading-spinner"><i className="bi bi-arrow-repeat"></i> Carregando...</div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{lista.length} tipo(s) cadastrado(s)</span>
                <button className="btn btn-primary btn-sm px-3" onClick={() => { resetForm(); setFormAberto(true); }}>
                    <i className="bi bi-plus-lg me-1"></i> Adicionar
                </button>
            </div>

            {formAberto && (
                <div className="card border-0 mb-3" style={{ background: 'var(--primary-light)' }}>
                    <div className="card-body p-3">
                        <h6 className="mb-3" style={{ fontWeight: 600, fontSize: 14 }}>
                            {editandoId ? 'Editar Tipo de Demanda' : 'Novo Tipo de Demanda'}
                        </h6>
                        <div className="row g-2 mb-2">
                            <div className="col-md-5">
                                <input type="text" className="form-control" placeholder="Nome do tipo" value={nome} onChange={e => setNome(e.target.value)} />
                            </div>
                            <div className="col-md-5">
                                <input type="text" className="form-control" placeholder="Descrição (opcional)" value={descricao} onChange={e => setDescricao(e.target.value)} />
                            </div>
                            <div className="col-md-2 d-flex gap-1">
                                <button className="btn btn-primary btn-sm flex-grow-1" onClick={salvar}>Salvar</button>
                                <button className="btn btn-outline-secondary btn-sm" onClick={resetForm}>✕</button>
                            </div>
                        </div>
                        {erro && <div className="text-danger" style={{ fontSize: 12 }}>{erro}</div>}
                    </div>
                </div>
            )}

            <div className="card border-0">
                <table className="table-crm">
                    <thead>
                        <tr>
                            <th style={{ width: 60 }}>ID</th>
                            <th>Nome</th>
                            <th>Descrição</th>
                            <th style={{ width: 100 }}>Status</th>
                            <th style={{ width: 120 }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lista.map(t => (
                            <tr key={t.id} style={{ opacity: t.ativo ? 1 : 0.5 }}>
                                <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{t.id}</td>
                                <td style={{ fontWeight: 500 }}>{t.nome}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.descricao || '—'}</td>
                                <td>
                                    <span className={`status-badge ${t.ativo ? 'status-resolvido' : 'status-fechado'}`}>
                                        {t.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td>
                                    <div className="d-flex gap-1">
                                        <button className="btn-icon" title="Editar" onClick={() => abrirEdicao(t)} style={{ width: 32, height: 32, fontSize: 14 }}>
                                            <i className="bi bi-pencil"></i>
                                        </button>
                                        <button className="btn-icon" title={t.ativo ? 'Desativar' : 'Ativar'} onClick={() => alternarAtivo(t.id)} style={{ width: 32, height: 32, fontSize: 14 }}>
                                            <i className={`bi ${t.ativo ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
