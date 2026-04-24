// Arquivo: frontend/src/pages/AbaCriacao.tsx
import { useState, useEffect } from 'react';

// Definimos o formato do departamento para o TypeScript
interface Departamento {
  id: number;
  nome: string;
}

export function AbaCriacao() {
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [departamentosLista, setDepartamentosLista] = useState<Departamento[]>([]);
  const [dadosFormulario, setDadosFormulario] = useState({
    tipo: 'Requisição de Serviço',
    assunto: '',
    texto_descricao: '',
    departamento_id: 1
  });

  // Busca os departamentos no Back-end assim que a aba carrega
  useEffect(() => {
    const buscarDepartamentos = async () => {
      try {
        const resposta = await fetch('http://localhost:3000/departamentos');
        if (resposta.ok) {
          const dados = await resposta.json();
          setDepartamentosLista(dados);
          
          // Se encontrou departamentos, já seleciona o primeiro por padrão
          if (dados.length > 0) {
            atualizarDados('departamento_id', dados[0].id);
          }
        }
      } catch (erro) {
        console.error("Erro ao buscar departamentos:", erro);
      }
    };

    buscarDepartamentos();
  }, []);

  const atualizarDados = (campo: string, valor: string | number) => {
    setDadosFormulario({ ...dadosFormulario, [campo]: valor });
  };

  const enviarFormulario = async () => {
    try {
      const resposta = await fetch('http://localhost:3000/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosFormulario)
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        alert(`Chamado gerado: PROTOCOLO #${dados.id_protocolo}`);
        
        // Limpa o formulário após o sucesso
        setDadosFormulario({ 
          tipo: 'Requisição de Serviço', 
          assunto: '', 
          texto_descricao: '', 
          departamento_id: departamentosLista.length > 0 ? departamentosLista[0].id : 1 
        });
        setEtapaAtual(1);
      }
    } catch (erro) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d2d2d7',
    borderRadius: '6px',
    fontSize: '13px',
    boxSizing: 'border-box' as const,
    marginTop: '6px',
    backgroundColor: '#ffffff'
  };

  const labelStyle = {
    fontWeight: '600' as const,
    fontSize: '13px',
    color: '#1d1d1f'
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 20px' }}>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        
        <header style={{ marginBottom: '25px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 15px 0', color: '#1d1d1f' }}>
            Abertura de Chamado
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ 
                height: '4px', flex: 1, backgroundColor: etapaAtual >= i ? '#0066cc' : '#d2d2d7', borderRadius: '2px', transition: 'background-color 0.3s'
              }} />
            ))}
          </div>
          <p style={{ fontSize: '13px', color: '#86868b', marginTop: '10px' }}>
            Etapa {etapaAtual} de 3 — {etapaAtual === 1 ? 'Classificação' : etapaAtual === 2 ? 'Detalhamento' : 'Revisão'}
          </p>
        </header>

        <div>
          {etapaAtual === 1 && (
            <section>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Resumo do Problema (Assunto)</label>
                <input 
                  style={inputStyle}
                  placeholder="Ex: Erro ao acessar o sistema de notas"
                  value={dadosFormulario.assunto}
                  onChange={(e) => atualizarDados('assunto', e.target.value)}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Tipo de Atendimento</label>
                <select 
                  style={inputStyle}
                  value={dadosFormulario.tipo}
                  onChange={(e) => atualizarDados('tipo', e.target.value)}
                >
                  <option value="Requisição de Serviço">Requisição de Serviço</option>
                  <option value="Incidente">Incidente Técnico</option>
                  <option value="Ajuste de Processo">Ajuste de Processo</option>
                </select>
              </div>
            </section>
          )}

          {etapaAtual === 2 && (
            <section>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Setor Responsável</label>
                <select 
                  style={inputStyle}
                  value={dadosFormulario.departamento_id}
                  onChange={(e) => atualizarDados('departamento_id', Number(e.target.value))}
                >
                  {/* A mágica acontece aqui: geramos as opções dinamicamente baseadas no banco */}
                  {departamentosLista.length === 0 ? (
                    <option value={0}>Carregando setores...</option>
                  ) : (
                    departamentosLista.map((dep) => (
                      <option key={dep.id} value={dep.id}>
                        {dep.nome}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Descrição Detalhada</label>
                <textarea 
                  style={{ ...inputStyle, height: '110px', resize: 'none' }}
                  placeholder="Forneça detalhes técnicos ou passos para reproduzir o erro."
                  value={dadosFormulario.texto_descricao}
                  onChange={(e) => atualizarDados('texto_descricao', e.target.value)}
                />
              </div>
            </section>
          )}

          {etapaAtual === 3 && (
            <section style={{ backgroundColor: '#f5f5f7', padding: '20px', borderRadius: '12px', border: '1px solid #d2d2d7', lineHeight: '1.6' }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '15px' }}>Confirme os dados antes do envio</h3>
              <p><strong>Classificação:</strong> {dadosFormulario.tipo}</p>
              <p><strong>Assunto:</strong> {dadosFormulario.assunto}</p>
              {/* Opcional: Mostrar o nome do departamento selecionado buscando na lista */}
              <p><strong>Setor (ID):</strong> {dadosFormulario.departamento_id}</p>
              <p style={{ whiteSpace: 'pre-wrap' }}><strong>Descrição:</strong> {dadosFormulario.texto_descricao}</p>
            </section>
          )}
        </div>

        <footer style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #d2d2d7', paddingTop: '20px' }}>
          <div>
            {etapaAtual > 1 && (
              <button onClick={() => setEtapaAtual(etapaAtual - 1)} style={{ padding: '10px 25px', borderRadius: '8px', border: '1px solid #d2d2d7', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px' }}>
                Voltar
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {etapaAtual < 3 ? (
              <button onClick={() => setEtapaAtual(etapaAtual + 1)} style={{ padding: '10px 30px', borderRadius: '8px', border: 'none', backgroundColor: '#0066cc', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                Próxima Etapa
              </button>
            ) : (
              <button onClick={enviarFormulario} style={{ padding: '10px 30px', borderRadius: '8px', border: 'none', backgroundColor: '#34c759', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                Gerar Protocolo
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}