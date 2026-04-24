// Arquivo: frontend/src/pages/AbaMinhasDemandas.tsx
import { useState, useEffect } from 'react';

// Definindo o formato dos dados que vêm do banco para o TypeScript não reclamar
interface Solicitacao {
    id: number;
    tipo: string;
    assunto: string;
    departamento_id: number;
    status: string;
}

export function AbaMinhasDemandas() {
    const [chamados, setChamados] = useState<Solicitacao[]>([]);
    const [carregando, setCarregando] = useState(true);

    // Função que busca os dados no back-end
    const buscarChamados = async () => {
        try {
            const resposta = await fetch('http://localhost:3000/solicitacoes');
            if (resposta.ok) {
                const dados = await resposta.json();
                setChamados(dados);
            } else {
                console.error('Erro ao buscar as solicitações');
            }
        } catch (erro) {
            console.error('Erro de conexão com o servidor', erro);
        } finally {
            setCarregando(false);
        }
    };

    // Dispara a busca automaticamente quando a aba é aberta
    useEffect(() => {
        buscarChamados();
    }, []);

    const thStyle = {
        padding: '12px 15px',
        textAlign: 'left' as const,
        borderBottom: '2px solid #d2d2d7',
        color: '#86868b',
        fontWeight: '600',
        fontSize: '12px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px'
    };

    const tdStyle = {
        padding: '12px 15px',
        borderBottom: '1px solid #e5e5ea',
        color: '#1d1d1f',
        fontSize: '13px'
    };

    return (
        <div style={{ padding: '30px 40px', maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 5px 0' }}>Meus Protocolos</h2>
                    <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>Acompanhe o status das suas solicitações ativas.</p>
                </div>
                <button
                    onClick={buscarChamados}
                    style={{ padding: '8px 16px', backgroundColor: '#f5f5f7', border: '1px solid #d2d2d7', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#1d1d1f' }}
                >
                    ↻ Atualizar
                </button>
            </header>

            {carregando ? (
                <p style={{ color: '#86868b' }}>Carregando chamados...</p>
            ) : chamados.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f5f5f7', borderRadius: '8px', border: '1px dashed #d2d2d7' }}>
                    <p style={{ color: '#86868b', margin: 0 }}>Nenhum chamado encontrado.</p>
                </div>
            ) : (
                <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d2d2d7', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f9f9fb' }}>
                            <tr>
                                <th style={thStyle}>Protocolo</th>
                                <th style={thStyle}>Assunto</th>
                                <th style={thStyle}>Classificação</th>
                                <th style={thStyle}>Setor (ID)</th>
                                <th style={thStyle}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chamados.map((chamado) => (
                                <tr key={chamado.id} style={{ transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f7'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <td style={{ ...tdStyle, fontWeight: '600', color: '#0066cc' }}>#{chamado.id}</td>
                                    <td style={tdStyle}>{chamado.assunto}</td>
                                    <td style={tdStyle}>{chamado.tipo}</td>
                                    <td style={tdStyle}>{chamado.departamento_id}</td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            backgroundColor: chamado.status === 'Aberto' ? '#e5f0ff' : '#e5ffec',
                                            color: chamado.status === 'Aberto' ? '#0066cc' : '#00875a',
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase'
                                        }}>
                                            {chamado.status || 'Aberto'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}