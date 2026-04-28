import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const buscarDepartamentos = async () => {
      try {
        const resposta = await fetch('http://localhost:3000/departamentos');
        if (resposta.ok) {
          const dados = await resposta.json();
          setDepartamentosLista(dados);
          if (dados.length > 0) atualizarDados('departamento_id', dados[0].id);
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
        alert(`Chamado gerado com sucesso! Protocolo: #${dados.id_protocolo}`);
        setDadosFormulario({ tipo: 'Requisição de Serviço', assunto: '', texto_descricao: '', departamento_id: departamentosLista.length > 0 ? departamentosLista[0].id : 1 });
        setEtapaAtual(1);
      } else {
        alert('Erro ao enviar dados. Verifique os campos.');
      }
    } catch (erro) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  const etapas = [
    { num: 1, label: 'Identificação' },
    { num: 2, label: 'Detalhamento' },
    { num: 3, label: 'Confirmação' },
  ];

  return (
    <div className="page-section fade-in">

      <div className="card border-0">
        <div className="card-body p-4 p-lg-5">

          {/* Header do wizard */}
          <div className="section-header-left mb-4">
            <div className="section-icon">
              <i className="bi bi-headset"></i>
            </div>
            <div style={{ marginLeft: 14 }}>
              <h2 className="section-title">Novo Atendimento</h2>
              <p className="section-subtitle">Preencha as informações para abrir um chamado</p>
            </div>
          </div>

          {/* Stepper visual */}
          <div className="wizard-stepper">
            {etapas.map((etapa) => (
              <div
                key={etapa.num}
                className={`wizard-step ${etapaAtual === etapa.num ? 'active' : ''} ${etapaAtual > etapa.num ? 'completed' : ''}`}
              >
                <div className="step-circle">
                  {etapaAtual > etapa.num ? <i className="bi bi-check2" style={{ fontSize: 16 }}></i> : etapa.num}
                </div>
                <span className="step-label">{etapa.label}</span>
              </div>
            ))}
          </div>

          {/* Conteúdo das etapas */}
          <form>
            {etapaAtual === 1 && (
              <div className="row g-4 fade-in">
                <div className="col-12 col-md-8">
                  <label className="form-label">Resumo do Problema (Assunto)</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Ex: Falha no acesso ao ERP"
                    value={dadosFormulario.assunto}
                    onChange={(e) => atualizarDados('assunto', e.target.value)}
                    style={{ fontSize: '14px' }}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label">Classificação</label>
                  <select
                    className="form-select form-select-lg"
                    value={dadosFormulario.tipo}
                    onChange={(e) => atualizarDados('tipo', e.target.value)}
                    style={{ fontSize: '14px' }}
                  >
                    <option value="Requisição de Serviço">Requisição de Serviço</option>
                    <option value="Incidente">Incidente Técnico</option>
                    <option value="Ajuste de Processo">Melhoria de Processo</option>
                  </select>
                </div>
              </div>
            )}

            {etapaAtual === 2 && (
              <div className="row g-4 fade-in">
                <div className="col-12 col-md-4">
                  <label className="form-label">Setor Responsável</label>
                  <select
                    className="form-select form-select-lg"
                    value={dadosFormulario.departamento_id}
                    onChange={(e) => atualizarDados('departamento_id', Number(e.target.value))}
                    style={{ fontSize: '14px' }}
                  >
                    {departamentosLista.length === 0 ? (
                      <option value={0}>Carregando setores...</option>
                    ) : (
                      departamentosLista.map((dep) => (
                        <option key={dep.id} value={dep.id}>{dep.nome}</option>
                      ))
                    )}
                  </select>
                </div>
                <div className="col-12 col-md-8">
                  <label className="form-label">Descrição Detalhada</label>
                  <textarea
                    className="form-control"
                    rows={6}
                    placeholder="Forneça detalhes técnicos ou justificativa..."
                    value={dadosFormulario.texto_descricao}
                    onChange={(e) => atualizarDados('texto_descricao', e.target.value)}
                  />
                </div>
              </div>
            )}

            {etapaAtual === 3 && (
              <div className="fade-in">
                <div className="confirmation-card">
                  <h6><i className="bi bi-clipboard-check"></i> Confirmação dos Dados</h6>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Classificação</span>
                    <span className="confirmation-value">{dadosFormulario.tipo}</span>
                  </div>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Assunto</span>
                    <span className="confirmation-value">{dadosFormulario.assunto || '—'}</span>
                  </div>
                  <div className="confirmation-row" style={{ alignItems: 'flex-start' }}>
                    <span className="confirmation-label">Descrição</span>
                    <span className="confirmation-value" style={{ whiteSpace: 'pre-wrap' }}>
                      {dadosFormulario.texto_descricao || 'Nenhuma descrição fornecida.'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Separador e botões */}
            <div style={{ borderTop: `1px solid var(--border-light)`, marginTop: 32, paddingTop: 24 }}>
              <div className="d-flex justify-content-between">
                <div>
                  {etapaAtual > 1 && (
                    <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setEtapaAtual(etapaAtual - 1)}>
                      <i className="bi bi-arrow-left me-2"></i>Voltar
                    </button>
                  )}
                </div>
                <div>
                  {etapaAtual < 3 ? (
                    <button type="button" className="btn btn-primary px-4" onClick={() => setEtapaAtual(etapaAtual + 1)}>
                      Próxima Etapa <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                  ) : (
                    <button type="button" className="btn btn-success px-4" onClick={enviarFormulario}>
                      <i className="bi bi-check-circle me-2"></i> Confirmar e Gerar Protocolo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}