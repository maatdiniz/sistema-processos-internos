// Arquivo: backend/src/routes/admin.routes.ts
import { Router } from 'express';
import { DepartamentoController } from '../controllers/DepartamentoController';
import { FuncionarioController } from '../controllers/FuncionarioController';
import { TipoDemandaController } from '../controllers/TipoDemandaController';
import { PrioridadeController } from '../controllers/PrioridadeController';
import { SolicitacaoRecursoController } from '../controllers/SolicitacaoRecursoController';
import { ChatController } from '../controllers/ChatController';

const rotasAdmin = Router();

// ── Departamentos ──
rotasAdmin.get('/departamentos', DepartamentoController.listar);
rotasAdmin.post('/departamentos', DepartamentoController.criar);
rotasAdmin.put('/departamentos/:id', DepartamentoController.atualizar);
rotasAdmin.patch('/departamentos/:id/toggle', DepartamentoController.alternarAtivo);

// ── Funcionários ──
rotasAdmin.get('/funcionarios', FuncionarioController.listar);
rotasAdmin.post('/funcionarios', FuncionarioController.criar);
rotasAdmin.put('/funcionarios/:id', FuncionarioController.atualizar);
rotasAdmin.patch('/funcionarios/:id/toggle', FuncionarioController.alternarAtivo);

// ── Tipos de Demanda ──
rotasAdmin.get('/tipos-demanda', TipoDemandaController.listar);
rotasAdmin.post('/tipos-demanda', TipoDemandaController.criar);
rotasAdmin.put('/tipos-demanda/:id', TipoDemandaController.atualizar);
rotasAdmin.patch('/tipos-demanda/:id/toggle', TipoDemandaController.alternarAtivo);

// ── Prioridades ──
rotasAdmin.get('/prioridades', PrioridadeController.listar);
rotasAdmin.post('/prioridades', PrioridadeController.criar);
rotasAdmin.put('/prioridades/:id', PrioridadeController.atualizar);

// ── Solicitações de Recurso (ações admin) ──
rotasAdmin.patch('/solicitacoes-recurso/:id/analisar', SolicitacaoRecursoController.analisar);
rotasAdmin.put('/solicitacoes-recurso/:id/aprovar', SolicitacaoRecursoController.aprovar);
rotasAdmin.put('/solicitacoes-recurso/:id/recusar', SolicitacaoRecursoController.recusar);
rotasAdmin.get('/solicitacoes-recurso/log/:id', SolicitacaoRecursoController.consultarLog);

// ── Chat Service Desk (ações admin) ──
rotasAdmin.get('/chat/sessoes', ChatController.listarSessoesAdmin);
rotasAdmin.post('/chat/sessoes', ChatController.criarSessaoAdmin);
rotasAdmin.patch('/chat/sessoes/:id/aceitar', ChatController.aceitar);
rotasAdmin.get('/chat/sessoes/:id/log', ChatController.consultarLog);

export default rotasAdmin;
