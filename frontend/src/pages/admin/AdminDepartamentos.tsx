// Arquivo: frontend/src/pages/admin/AdminDepartamentos.tsx
import { useState, useEffect } from 'react';

const API = 'http://localhost:3000/admin/departamentos';

interface Departamento {
    id: number;
    nome: string;
    ativo: number;
    created_at: string;
}

export function AdminDepartamentos() {
    const [lista, setLista] = useState<Departamento[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [formAberto, setFormAberto] = useState(false);
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [nome, setNome] = useState('');
    const [erro, setErro] = useState('');

    const carregar = async () => {
        try {
            const res = await fetch(API);
            if (res.ok) setLista(await res.json());
        } catch { console.error('Erro ao carregar departamentos'); }
        finally { setCarregando(false); }
    };

    useEffect(() => { carregar(); }, []);

    const resetForm = () => { setNome(''); setEditandoId(null); setFormAberto(false); setErro(''); };

    const abrirEdicao = (depto: Departamento) => {
        setNome(depto.nome);
        setEditandoId(depto.id);
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
                body: JSON.stringify({ nome })
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
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{lista.length} departamento(s) cadastrado(s)</span>
                <button className="btn btn-primary btn-sm px-3" onClick={() => { resetForm(); setFormAberto(true); }}>
                    <i className="bi bi-plus-lg me-1"></i> Adicionar
                </button>
            </div>

            {formAberto && (
                <div className="card border-0 mb-3" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary) !important' }}>
                    <div className="card-body p-3">
                        <h6 className="mb-3" style={{ fontWeight: 600, fontSize: 14 }}>
                            {editandoId ? 'Editar Departamento' : 'Novo Departamento'}
                        </h6>
                        <div className="d-flex gap-2 align-items-start">
                            <div className="flex-grow-1">
                                <input
                                    type="text" className="form-control" placeholder="Nome do departamento"
                                    value={nome} onChange={e => setNome(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && salvar()}
                                />
                                {erro && <div className="text-danger mt-1" style={{ fontSize: 12 }}>{erro}</div>}
                            </div>
                            <button className="btn btn-primary btn-sm px-3" onClick={salvar}>Salvar</button>
                            <button className="btn btn-outline-secondary btn-sm px-3" onClick={resetForm}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="card border-0">
                <table className="table-crm">
                    <thead>
                        <tr>
                            <th style={{ width: 60 }}>ID</th>
                            <th>Nome</th>
                            <th style={{ width: 100 }}>Status</th>
                            <th style={{ width: 120 }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lista.map(d => (
                            <tr key={d.id} style={{ opacity: d.ativo ? 1 : 0.5 }}>
                                <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{d.id}</td>
                                <td>{d.nome}</td>
                                <td>
                                    <span className={`status-badge ${d.ativo ? 'status-resolvido' : 'status-fechado'}`}>
                                        {d.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td>
                                    <div className="d-flex gap-1">
                                        <button className="btn-icon" title="Editar" onClick={() => abrirEdicao(d)} style={{ width: 32, height: 32, fontSize: 14 }}>
                                            <i className="bi bi-pencil"></i>
                                        </button>
                                        <button className="btn-icon" title={d.ativo ? 'Desativar' : 'Ativar'} onClick={() => alternarAtivo(d.id)} style={{ width: 32, height: 32, fontSize: 14 }}>
                                            <i className={`bi ${d.ativo ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
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
