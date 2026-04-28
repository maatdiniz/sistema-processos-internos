// Arquivo: frontend/src/pages/admin/AdminPanel.tsx
import { useState } from 'react';
import { AdminDepartamentos } from './AdminDepartamentos';
import { AdminTiposDemanda } from './AdminTiposDemanda';
import { AdminPrioridades } from './AdminPrioridades';
import { AdminFuncionarios } from './AdminFuncionarios';

const abas = [
    { id: 'departamentos', label: 'Departamentos', icon: 'bi-building' },
    { id: 'tipos', label: 'Tipos de Demanda', icon: 'bi-tag' },
    { id: 'prioridades', label: 'Prioridades', icon: 'bi-flag' },
    { id: 'funcionarios', label: 'Funcionários', icon: 'bi-people' },
];

export function AdminPanel() {
    const [abaAdmin, setAbaAdmin] = useState('departamentos');

    return (
        <div className="page-section fade-in">
            <div className="section-header" style={{ marginBottom: 24 }}>
                <div className="section-header-left">
                    <div className="section-icon">
                        <i className="bi bi-gear"></i>
                    </div>
                    <div>
                        <h2 className="section-title">Painel Administrativo</h2>
                        <p className="section-subtitle">Gerencie departamentos, tipos de demanda, prioridades e funcionários</p>
                    </div>
                </div>
            </div>

            {/* Sub-navegação */}
            <div className="admin-tabs">
                {abas.map(aba => (
                    <button
                        key={aba.id}
                        className={`admin-tab ${abaAdmin === aba.id ? 'active' : ''}`}
                        onClick={() => setAbaAdmin(aba.id)}
                    >
                        <i className={`bi ${aba.icon}`}></i>
                        {aba.label}
                    </button>
                ))}
            </div>

            {/* Conteúdo */}
            <div key={abaAdmin} className="fade-in" style={{ marginTop: 20 }}>
                {abaAdmin === 'departamentos' && <AdminDepartamentos />}
                {abaAdmin === 'tipos' && <AdminTiposDemanda />}
                {abaAdmin === 'prioridades' && <AdminPrioridades />}
                {abaAdmin === 'funcionarios' && <AdminFuncionarios />}
            </div>
        </div>
    );
}
