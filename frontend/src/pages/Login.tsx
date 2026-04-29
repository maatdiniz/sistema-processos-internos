import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:3000';

export function Login() {
    const [matricula, setMatricula] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');
        setCarregando(true);

        try {
            const res = await fetch(`${API}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matricula, senha })
            });

            const data = await res.json();

            if (res.ok) {
                login(data.token, data.usuario);
                navigate('/');
            } else {
                setErro(data.erro || 'Erro ao fazer login.');
            }
        } catch (err) {
            setErro('Erro de conexão com o servidor.');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.logoArea}>
                    <i className="bi bi-boxes" style={styles.logoIcon}></i>
                    <h2 style={styles.logoText}>CEAD</h2>
                    <p style={styles.logoSub}>Processos Internos</p>
                </div>
                
                <form onSubmit={handleLogin} style={styles.form}>
                    {erro && <div className="alert alert-danger" style={{ fontSize: 13, padding: '8px 12px' }}>{erro}</div>}
                    
                    <div className="mb-3">
                        <label className="form-label" style={styles.label}>Matrícula ou Email</label>
                        <input
                            type="text"
                            className="form-control"
                            value={matricula}
                            onChange={e => setMatricula(e.target.value)}
                            placeholder="Ex: admin"
                            required
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label className="form-label" style={styles.label}>Senha</label>
                        <input
                            type="password"
                            className="form-control"
                            value={senha}
                            onChange={e => setSenha(e.target.value)}
                            placeholder="Sua senha"
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="btn btn-primary w-100" 
                        disabled={carregando}
                        style={{ padding: '10px', fontWeight: 500 }}
                    >
                        {carregando ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-color)',
        padding: '20px'
    },
    card: {
        backgroundColor: 'var(--surface-color)',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        width: '100%',
        maxWidth: '400px'
    },
    logoArea: {
        textAlign: 'center' as const,
        marginBottom: '30px'
    },
    logoIcon: {
        fontSize: '48px',
        color: 'var(--primary-color)'
    },
    logoText: {
        margin: '10px 0 0',
        fontWeight: 700,
        color: 'var(--text-color)'
    },
    logoSub: {
        margin: '0',
        color: 'var(--text-muted)',
        fontSize: '14px'
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const
    },
    label: {
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--text-color)'
    }
};
