import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import App from './App.tsx'

// Interceptador global de fetch para adicionar o token JWT
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem('@CEAD:token');
  if (token) {
    init = init || {};
    init.headers = {
      ...init.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  const response = await originalFetch(input, init);
  
  // Se o token expirou ou é inválido (e não estamos na tela de login), forçar logout
  if (response.status === 401 && !window.location.pathname.includes('/login')) {
    localStorage.removeItem('@CEAD:token');
    localStorage.removeItem('@CEAD:usuario');
    window.location.href = '/login';
  }
  
  return response;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
