// Arquivo: backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { abrirBanco } from './database/connection';
import { executarSeed } from './database/seed';

// Rotas
import rotasAdmin from './routes/admin.routes';

// Rotas públicas (para os selects do wizard)
import { DepartamentoController } from './controllers/DepartamentoController';
import { TipoDemandaController } from './controllers/TipoDemandaController';
import { PrioridadeController } from './controllers/PrioridadeController';
import { FuncionarioController } from './controllers/FuncionarioController';
import { DemandaController } from './controllers/DemandaController';
import { SolicitacaoRecursoController } from './controllers/SolicitacaoRecursoController';
import { ChatController } from './controllers/ChatController';

const app = express();

app.use(cors());
app.use(express.json());

// ── Rotas Admin (CRUD completo) ──
app.use('/admin', rotasAdmin);

// ── Rotas Públicas (somente leitura, para selectors) ──
app.get('/departamentos', DepartamentoController.listarAtivos);
app.get('/tipos-demanda', TipoDemandaController.listarAtivos);
app.get('/prioridades', PrioridadeController.listar);
app.get('/funcionarios/departamento/:departamento_id', FuncionarioController.listarPorDepartamento);

// ── Rotas de Demandas ──
app.post('/demandas', DemandaController.criar);
app.get('/demandas', DemandaController.listar);

// ── Rotas de Solicitações de Recurso (públicas) ──
app.post('/solicitacoes-recurso', SolicitacaoRecursoController.criar);
app.get('/solicitacoes-recurso', SolicitacaoRecursoController.listar);
app.get('/solicitacoes-recurso/:id', SolicitacaoRecursoController.detalhe);

// ── Rotas de Chat (públicas) ──
app.post('/chat/sessoes', ChatController.criarSessao);
app.get('/chat/sessoes', ChatController.listarSessoes);
app.get('/chat/sessoes/:id/mensagens', ChatController.listarMensagens);
app.post('/chat/sessoes/:id/mensagens', ChatController.enviarMensagem);
app.patch('/chat/sessoes/:id/encerrar', ChatController.encerrar);

const PORT = 3000;

app.listen(PORT, async () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);

    try {
        await abrirBanco();
        console.log('📦 Banco de dados inicializado com sucesso!');

        await executarSeed();
    } catch (erro) {
        console.error('❌ Erro ao inicializar:', erro);
    }
});