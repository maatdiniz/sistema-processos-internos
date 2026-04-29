import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AbaCriacao } from './pages/AbaCriacao';
import { AtribuidasAMim } from './pages/AtribuidasAMim';
import { Solicitacoes } from './pages/Solicitacoes';
import { TodasDemandas } from './pages/TodasDemandas';
import { AdminPanel } from './pages/admin/AdminPanel';
import { SolicitarRecursos } from './pages/SolicitarRecursos';
import { ChatWidget } from './components/ChatWidget';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';
import './App.css';

function MainLayout() {
  const [abaAtiva, setAbaAtiva] = useState('visao');
  const { usuario, logout } = useAuth();

  const menuPrincipal = [
    { id: 'visao',       icon: 'bi-grid-1x2',          label: 'Dashboard',          titulo: 'Visão Geral' },
    { id: 'abrir',       icon: 'bi-plus-circle',        label: 'Nova Demanda',       titulo: 'Abertura de Demanda' },
    { id: 'atribuidas',  icon: 'bi-person-check',       label: 'Atribuições',        titulo: 'Atribuições' },
    { id: 'solicitacoes',icon: 'bi-send',               label: 'Solicitações',       titulo: 'Minhas Solicitações' },
    { id: 'todas',       icon: 'bi-archive',            label: 'Todas as Demandas',  titulo: 'Todas as Demandas' },
  ];

  const menuSistema = [
    { id: 'recursos', icon: 'bi-lightbulb', label: 'Solicitar Recursos', titulo: 'Solicitar Recursos' },
    ...(usuario?.perfil === 'admin' ? [{ id: 'admin', icon: 'bi-gear', label: 'Administração', titulo: 'Painel Administrativo' }] : [])
  ];

  const todosItens = [...menuPrincipal, ...menuSistema];
  const tituloAtual = todosItens.find(i => i.id === abaAtiva)?.titulo || '';

  const getIniciais = (nome: string) => {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><i className="bi bi-boxes"></i></div>
          <div>
            <div className="sidebar-brand-text">CEAD</div>
            <div className="sidebar-brand-sub">Processos Internos</div>
          </div>
        </div>

        <div className="sidebar-label">Menu principal</div>
        <ul className="sidebar-nav">
          {menuPrincipal.map(item => (
            <li key={item.id}>
              <button className={`nav-link ${abaAtiva === item.id ? 'active' : ''}`} onClick={() => setAbaAtiva(item.id)}>
                <i className={`bi ${item.icon}`}></i>{item.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-label">Sistema</div>
        <ul className="sidebar-nav" style={{ flex: 'none', marginBottom: 8 }}>
          {menuSistema.map(item => (
            <li key={item.id}>
              <button className={`nav-link ${abaAtiva === item.id ? 'active' : ''}`} onClick={() => setAbaAtiva(item.id)}>
                <i className={`bi ${item.icon}`}></i>{item.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{usuario ? getIniciais(usuario.nome) : ''}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{usuario?.nome}</div>
              <div className="sidebar-user-role">{usuario?.perfil === 'admin' ? 'Administrador' : 'Usuário'}</div>
            </div>
            <button className="btn-icon ms-auto text-danger" onClick={handleLogout} title="Sair">
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </aside>

      <div className="content-area">
        <header className="top-navbar">
          <h1>{tituloAtual}</h1>
          <div className="header-actions">
            <button className="btn-icon" title="Pesquisar"><i className="bi bi-search"></i></button>
            <button className="btn-icon" title="Notificações"><i className="bi bi-bell"></i><span className="notification-dot"></span></button>
          </div>
        </header>

        <main className="main-content" key={abaAtiva}>
          {abaAtiva === 'visao' && <Dashboard />}
          {abaAtiva === 'abrir' && <AbaCriacao />}
          {abaAtiva === 'atribuidas' && <AtribuidasAMim />}
          {abaAtiva === 'solicitacoes' && <Solicitacoes />}
          {abaAtiva === 'todas' && <TodasDemandas />}
          {abaAtiva === 'recursos' && <SolicitarRecursos />}
          {abaAtiva === 'admin' && usuario?.perfil === 'admin' && <AdminPanel />}
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}

export default function App() {
  const { usuario } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={usuario ? <MainLayout /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}