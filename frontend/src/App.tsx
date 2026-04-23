// Arquivo: frontend/src/App.tsx
import { useState } from 'react';
import { AbaCriacao } from './pages/AbaCriacao';
import './App.css'; // Garantindo que o nosso CSS limpo seja carregado

export default function App() {
  const [moduloAtivo, setModuloAtivo] = useState('chamados');
  const [abaAtiva, setAbaAtiva] = useState('abrir');
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);

  const cores = {
    lateral: '#1c1c1c',
    subAbas: '#ffffff',
    fundo: '#ffffff',
    texto: '#1d1d1f',
    textoSecundario: '#86868b',
    borda: '#d2d2d7',
    destaque: '#0066cc'
  };

  const menuButtonStyle = (ativo: boolean) => ({
    width: '100%',
    padding: '12px 15px',
    textAlign: 'left' as const,
    backgroundColor: ativo ? '#323232' : 'transparent',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: ativo ? '600' : '400',
    borderLeft: ativo ? `4px solid ${cores.destaque}` : '4px solid transparent',
    transition: '0.2s'
  });

  const subAbaStyle = (ativa: boolean) => ({
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: ativa ? cores.destaque : cores.textoSecundario,
    border: 'none',
    borderBottom: ativa ? `2px solid ${cores.destaque}` : '2px solid transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: '0.2s'
  });

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>

      {/* 1. MÓDULOS (ESQUERDA) */}
      <nav style={{
        width: '200px',
        minWidth: '200px', /* Impede que o menu esprema em telas menores */
        backgroundColor: cores.lateral,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '20px', fontSize: '15px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          SISTEMA CRM
        </div>

        <div style={{ flex: 1 }}>
          <button onClick={() => setModuloAtivo('inicio')} style={menuButtonStyle(moduloAtivo === 'inicio')}>
            Dashboard
          </button>
          <button onClick={() => setModuloAtivo('chamados')} style={menuButtonStyle(moduloAtivo === 'chamados')}>
            Gestão de Chamados
          </button>
          <button onClick={() => setModuloAtivo('usuarios')} style={menuButtonStyle(moduloAtivo === 'usuarios')}>
            Governança / Usuários
          </button>
        </div>
      </nav>

      {/* 2. ÁREA DE CONTEÚDO (CENTRO) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: cores.fundo,
        minWidth: '0' /* Macete de flexbox para permitir que a área interna encolha corretamente sem gerar scroll horizontal */
      }}>

        {/* SUB-ABAS (TOPO) */}
        <header style={{
          minHeight: '45px',
          backgroundColor: cores.subAbas,
          borderBottom: `1px solid ${cores.borda}`,
          display: 'flex',
          alignItems: 'flex-end',
          paddingLeft: '20px',
          overflowX: 'auto' /* Permite rolagem das abas se a tela for muito pequena */
        }}>
          <button onClick={() => setAbaAtiva('visao')} style={subAbaStyle(abaAtiva === 'visao')}>Visão Geral</button>
          <button onClick={() => setAbaAtiva('abrir')} style={subAbaStyle(abaAtiva === 'abrir')}>Abrir Novo</button>
          <button onClick={() => setAbaAtiva('meus')} style={subAbaStyle(abaAtiva === 'meus')}>Meus Atendimentos</button>
        </header>

        {/* ÁREA DE TRABALHO */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: abaAtiva === 'abrir' ? 'block' : 'none' }}>
            <AbaCriacao />
          </div>

          <div style={{ display: abaAtiva === 'visao' ? 'block' : 'none', padding: '60px 40px', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '20px' }}>Visão Geral</h2>
            <p style={{ color: cores.textoSecundario, fontSize: '15px' }}>Bem-vindo ao painel de controle estratégico.</p>
          </div>

          <div style={{ display: abaAtiva === 'meus' ? 'block' : 'none', padding: '60px 40px', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '20px' }}>Meus Protocolos</h2>
            <p style={{ color: cores.textoSecundario, fontSize: '15px' }}>Gerencie aqui suas demandas em andamento.</p>
          </div>
        </main>
      </div>

      {/* 3. NOTIFICAÇÕES (DIREITA) */}
      <div style={{ display: 'flex', height: '100%' }}>
        {/* BOTÃO TRIGGER */}
        <button
          onClick={() => setNotificacoesAbertas(!notificacoesAbertas)}
          style={{
            width: '40px', /* Levemente mais largo para comportar o ícone perfeitamente */
            height: '100%',
            backgroundColor: '#f2f2f7',
            border: 'none',
            borderLeft: `1px solid ${cores.borda}`,
            cursor: 'pointer',
            fontSize: '16px',
            color: cores.textoSecundario,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: '0.2s'
          }}
          title="Alternar Notificações"
        >
          {/* Seta condicional: Aponta para a esquerda quando fechado, para a direita quando aberto */}
          {notificacoesAbertas ? '❯' : '❮'}
        </button>

        {/* PAINEL LATERAL */}
        <aside style={{
          width: notificacoesAbertas ? '300px' : '0px',
          backgroundColor: '#fff',
          borderLeft: notificacoesAbertas ? `1px solid ${cores.borda}` : 'none',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px', width: '300px' }}>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: cores.textoSecundario }}>Notificações</h3>
            <hr style={{ border: 'none', borderTop: `1px solid ${cores.borda}`, margin: '15px 0' }} />
            <p style={{ color: cores.textoSecundario, fontSize: '12px' }}>Sem novas atividades no momento.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}