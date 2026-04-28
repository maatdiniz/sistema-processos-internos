// Arquivo: frontend/src/App.tsx
import { useState } from 'react';
import { AbaCriacao } from './pages/AbaCriacao';
import { AbaMinhasDemandas } from './pages/AbaMinhasDemandas';

// Importando o Bootstrap 5 direto do pacote npm
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';
import './App.css';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('abrir');

  const menuItems = [
    { id: 'visao',  icon: 'bi-grid-1x2',    label: 'Dashboard',       titulo: 'Visão Geral' },
    { id: 'abrir',  icon: 'bi-plus-circle',  label: 'Novo Chamado',    titulo: 'Abertura de Solicitação' },
    { id: 'meus',   icon: 'bi-stack',        label: 'Meus Protocolos', titulo: 'Gestão de Demandas' },
  ];

  const tituloAtual = menuItems.find(item => item.id === abaAtiva)?.titulo || '';

  return (
    <div className="admin-layout">

      {/* ══ SIDEBAR ══ */}
      <aside className="sidebar">

        {/* Branding */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <i className="bi bi-boxes"></i>
          </div>
          <div>
            <div className="sidebar-brand-text">Service Desk</div>
            <div className="sidebar-brand-sub">Processos Internos</div>
          </div>
        </div>

        {/* Menu label */}
        <div className="sidebar-label">Menu principal</div>

        {/* Navegação */}
        <ul className="sidebar-nav">
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                className={`nav-link ${abaAtiva === item.id ? 'active' : ''}`}
                onClick={() => setAbaAtiva(item.id)}
              >
                <i className={`bi ${item.icon}`}></i>
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Rodapé com perfil */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">MD</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Matheus Diniz</div>
              <div className="sidebar-user-role">Administrador</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ══ ÁREA CENTRAL ══ */}
      <div className="content-area">

        {/* Barra superior */}
        <header className="top-navbar">
          <h1>{tituloAtual}</h1>
          <div className="header-actions">
            <button className="btn-icon" title="Pesquisar">
              <i className="bi bi-search"></i>
            </button>
            <button className="btn-icon" title="Notificações">
              <i className="bi bi-bell"></i>
              <span className="notification-dot"></span>
            </button>
          </div>
        </header>

        {/* Conteúdo das abas */}
        <main className="main-content" key={abaAtiva}>

          {abaAtiva === 'visao' && (
            <div className="dashboard-empty fade-in">
              <div className="card border-0">
                <div className="card-body p-5 text-center">
                  <div className="dashboard-empty-icon">
                    <i className="bi bi-bar-chart-line"></i>
                  </div>
                  <h4 style={{ fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Métricas da Governança</h4>
                  <p className="mb-0" style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
                    Acompanhamento estratégico de SLAs, volume de chamados e performance das equipes aparecerá aqui.
                  </p>
                </div>
              </div>
            </div>
          )}

          {abaAtiva === 'abrir' && <AbaCriacao />}

          {abaAtiva === 'meus' && <AbaMinhasDemandas />}

        </main>
      </div>
    </div>
  );
}