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
        setCarregando(true);
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

    /** Retorna a classe CSS correta do badge conforme o status */
    const getStatusClass = (status: string): string => {
        const s = (status || 'Aberto').toLowerCase().replace(/\s+/g, '-');
        if (s.includes('andamento')) return 'status-em-andamento';
        if (s.includes('resolv'))    return 'status-resolvido';
        if (s.includes('fechad'))    return 'status-fechado';
        return 'status-aberto';
    };

    return (
        <div className="page-section fade-in">

            {/* Cabeçalho da seção */}
            <div className="section-header">
                <div className="section-header-left">
                    <div className="section-icon">
                        <i className="bi bi-stack"></i>
                    </div>
                    <div>
                        <h2 className="section-title">Meus Protocolos</h2>
                        <p className="section-subtitle">Acompanhe o status das suas solicitações ativas</p>
                    </div>
                </div>
                <button className="btn-ghost" onClick={buscarChamados}>
                    <i className="bi bi-arrow-clockwise"></i>
                    Atualizar
                </button>
            </div>

            {/* Conteúdo */}
            {carregando ? (
                <div className="loading-spinner">
                    <i className="bi bi-arrow-repeat"></i>
                    Carregando chamados...
                </div>
            ) : chamados.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <i className="bi bi-inbox"></i>
                    </div>
                    <p>Nenhum chamado encontrado. Crie um novo chamado para começar.</p>
                </div>
            ) : (
                <div className="card border-0">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table-crm">
                            <thead>
                                <tr>
                                    <th>Protocolo</th>
                                    <th>Assunto</th>
                                    <th>Classificação</th>
                                    <th>Setor</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chamados.map((chamado) => (
                                    <tr key={chamado.id}>
                                        <td><span className="protocol-id">#{chamado.id}</span></td>
                                        <td>{chamado.assunto}</td>
                                        <td>{chamado.tipo}</td>
                                        <td>{chamado.departamento_id}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusClass(chamado.status)}`}>
                                                {chamado.status || 'Aberto'}
                                            </span>
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