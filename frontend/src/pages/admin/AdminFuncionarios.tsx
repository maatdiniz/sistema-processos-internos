// Arquivo: frontend/src/pages/admin/AdminFuncionarios.tsx
import { useState, useEffect } from 'react';

const API = 'http://localhost:3000/admin/funcionarios';
const API_DEPTOS = 'http://localhost:3000/admin/departamentos';

interface Funcionario { id: number; matricula: string; nome: string; email: string | null; perfil: string; departamento_id: number; departamento_nome: string; ativo: number; }
interface Depto { id: number; nome: string; ativo: number; }

export function AdminFuncionarios() {
    const [lista, setLista] = useState<Funcionario[]>([]);
    const [deptos, setDeptos] = useState<Depto[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [formAberto, setFormAberto] = useState(false);
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [matricula, setMatricula] = useState('');
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [perfil, setPerfil] = useState('usuario');
    const [deptoId, setDeptoId] = useState(1);
    const [erro, setErro] = useState('');

    const carregar = async () => {
        try {
            const [r1, r2] = await Promise.all([fetch(API), fetch(API_DEPTOS)]);
            if (r1.ok) setLista(await r1.json());
            if (r2.ok) setDeptos(await r2.json());
        } catch {} finally { setCarregando(false); }
    };
    useEffect(() => { carregar(); }, []);

    const resetForm = () => { setMatricula(''); setNome(''); setEmail(''); setSenha(''); setPerfil('usuario'); setDeptoId(deptos[0]?.id || 1); setEditandoId(null); setFormAberto(false); setErro(''); };

    const abrirEdicao = (f: Funcionario) => {
        setMatricula(f.matricula); setNome(f.nome); setEmail(f.email || ''); setSenha('');
        setPerfil(f.perfil); setDeptoId(f.departamento_id); setEditandoId(f.id); setFormAberto(true); setErro('');
    };

    const salvar = async () => {
        setErro('');
        try {
            const url = editandoId ? `${API}/${editandoId}` : API;
            const body: any = { matricula, nome, email, perfil, departamento_id: deptoId };
            if (senha) body.senha = senha;
            const res = await fetch(url, { method: editandoId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) { setErro(data.erro || data.detalhes?.join(', ') || 'Erro'); return; }
            resetForm(); carregar();
        } catch { setErro('Erro de conexão.'); }
    };

    const alternarAtivo = async (id: number) => {
        try { await fetch(`${API}/${id}/toggle`, { method: 'PATCH' }); carregar(); } catch {}
    };

    if (carregando) return <div className="loading-spinner"><i className="bi bi-arrow-repeat"></i> Carregando...</div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{lista.length} funcionário(s)</span>
                <button className="btn btn-primary btn-sm px-3" onClick={() => { resetForm(); setFormAberto(true); }}><i className="bi bi-plus-lg me-1"></i> Adicionar</button>
            </div>
            {formAberto && (
                <div className="card border-0 mb-3" style={{ background: 'var(--primary-light)' }}>
                    <div className="card-body p-3">
                        <h6 className="mb-3" style={{ fontWeight: 600, fontSize: 14 }}>{editandoId ? 'Editar' : 'Novo'} Funcionário</h6>
                        <div className="row g-2 mb-2">
                            <div className="col-md-2"><input type="text" className="form-control" placeholder="Matrícula" value={matricula} onChange={e => setMatricula(e.target.value)} /></div>
                            <div className="col-md-3"><input type="text" className="form-control" placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)} /></div>
                            <div className="col-md-2"><input type="email" className="form-control" placeholder="E-mail (opcional)" value={email} onChange={e => setEmail(e.target.value)} /></div>
                            <div className="col-md-2"><input type="password" className="form-control" placeholder={editandoId ? 'Nova senha (vazio = manter)' : 'Senha'} value={senha} onChange={e => setSenha(e.target.value)} /></div>
                            <div className="col-md-3 d-flex gap-1">
                                <select className="form-select" value={perfil} onChange={e => setPerfil(e.target.value)} style={{ maxWidth: 120 }}>
                                    <option value="usuario">Usuário</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <select className="form-select" value={deptoId} onChange={e => setDeptoId(Number(e.target.value))}>
                                    {deptos.filter(d => d.ativo).map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="d-flex gap-1 mt-2">
                            <button className="btn btn-primary btn-sm px-3" onClick={salvar}>Salvar</button>
                            <button className="btn btn-outline-secondary btn-sm px-3" onClick={resetForm}>Cancelar</button>
                        </div>
                        {erro && <div className="text-danger mt-1" style={{ fontSize: 12 }}>{erro}</div>}
                    </div>
                </div>
            )}
            <div className="card border-0">
                <div style={{ overflowX: 'auto' }}>
                    <table className="table-crm">
                        <thead><tr><th style={{ width: 60 }}>ID</th><th>Matrícula</th><th>Nome</th><th>Departamento</th><th>Perfil</th><th style={{ width: 90 }}>Status</th><th style={{ width: 100 }}>Ações</th></tr></thead>
                        <tbody>
                            {lista.map(f => (
                                <tr key={f.id} style={{ opacity: f.ativo ? 1 : 0.5 }}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{f.id}</td>
                                    <td style={{ fontWeight: 500 }}>{f.matricula}</td>
                                    <td>{f.nome}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{f.departamento_nome}</td>
                                    <td><span className={`status-badge ${f.perfil === 'admin' ? 'status-em-andamento' : 'status-aberto'}`}>{f.perfil}</span></td>
                                    <td><span className={`status-badge ${f.ativo ? 'status-resolvido' : 'status-fechado'}`}>{f.ativo ? 'Ativo' : 'Inativo'}</span></td>
                                    <td>
                                        <div className="d-flex gap-1">
                                            <button className="btn-icon" title="Editar" onClick={() => abrirEdicao(f)} style={{ width: 32, height: 32, fontSize: 14 }}><i className="bi bi-pencil"></i></button>
                                            <button className="btn-icon" title={f.ativo ? 'Desativar' : 'Ativar'} onClick={() => alternarAtivo(f.id)} style={{ width: 32, height: 32, fontSize: 14 }}><i className={`bi ${f.ativo ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
