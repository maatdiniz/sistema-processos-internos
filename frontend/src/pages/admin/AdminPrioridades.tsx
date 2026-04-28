// Arquivo: frontend/src/pages/admin/AdminPrioridades.tsx
import { useState, useEffect } from 'react';

const API = 'http://localhost:3000/admin/prioridades';

interface Prioridade { id: number; nome: string; descricao: string; ordem: number; cor: string; }

export function AdminPrioridades() {
    const [lista, setLista] = useState<Prioridade[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [formAberto, setFormAberto] = useState(false);
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [ordem, setOrdem] = useState(1);
    const [cor, setCor] = useState('#3B82F6');
    const [erro, setErro] = useState('');

    const carregar = async () => {
        try { const r = await fetch(API); if (r.ok) setLista(await r.json()); } catch {} finally { setCarregando(false); }
    };
    useEffect(() => { carregar(); }, []);
    const resetForm = () => { setNome(''); setDescricao(''); setOrdem(1); setCor('#3B82F6'); setEditandoId(null); setFormAberto(false); setErro(''); };
    const abrirEdicao = (p: Prioridade) => { setNome(p.nome); setDescricao(p.descricao); setOrdem(p.ordem); setCor(p.cor); setEditandoId(p.id); setFormAberto(true); setErro(''); };

    const salvar = async () => {
        setErro('');
        try {
            const url = editandoId ? `${API}/${editandoId}` : API;
            const res = await fetch(url, { method: editandoId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, descricao, ordem, cor }) });
            const data = await res.json();
            if (!res.ok) { setErro(data.erro || data.detalhes?.join(', ') || 'Erro'); return; }
            resetForm(); carregar();
        } catch { setErro('Erro de conexão.'); }
    };

    if (carregando) return <div className="loading-spinner"><i className="bi bi-arrow-repeat"></i> Carregando...</div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{lista.length} prioridade(s)</span>
                <button className="btn btn-primary btn-sm px-3" onClick={() => { resetForm(); setFormAberto(true); }}><i className="bi bi-plus-lg me-1"></i> Adicionar</button>
            </div>
            {formAberto && (
                <div className="card border-0 mb-3" style={{ background: 'var(--primary-light)' }}>
                    <div className="card-body p-3">
                        <h6 className="mb-3" style={{ fontWeight: 600, fontSize: 14 }}>{editandoId ? 'Editar' : 'Nova'} Prioridade</h6>
                        <div className="row g-2 mb-2">
                            <div className="col-md-3"><input type="text" className="form-control" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} /></div>
                            <div className="col-md-1"><input type="number" className="form-control" min={1} max={10} value={ordem} onChange={e => setOrdem(Number(e.target.value))} /></div>
                            <div className="col-md-1"><input type="color" className="form-control form-control-color" value={cor} onChange={e => setCor(e.target.value)} style={{ height: 38 }} /></div>
                            <div className="col-md-5"><input type="text" className="form-control" placeholder="Descrição didática" value={descricao} onChange={e => setDescricao(e.target.value)} /></div>
                            <div className="col-md-2 d-flex gap-1 align-items-end">
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
                    <thead><tr><th style={{ width: 60 }}>Ordem</th><th style={{ width: 50 }}>Cor</th><th>Nome</th><th>Descrição</th><th style={{ width: 80 }}>Ações</th></tr></thead>
                    <tbody>
                        {lista.map(p => (
                            <tr key={p.id}>
                                <td style={{ fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>{p.ordem}</td>
                                <td><div style={{ width: 24, height: 24, borderRadius: '50%', background: p.cor, margin: '0 auto' }}></div></td>
                                <td><span style={{ fontWeight: 600, color: p.cor }}>{p.nome}</span></td>
                                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{p.descricao}</td>
                                <td><button className="btn-icon" title="Editar" onClick={() => abrirEdicao(p)} style={{ width: 32, height: 32, fontSize: 14 }}><i className="bi bi-pencil"></i></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
