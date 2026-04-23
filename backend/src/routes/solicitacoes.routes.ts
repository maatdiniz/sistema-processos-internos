// Arquivo: backend/src/routes/solicitacoes.routes.ts
import { Router } from 'express';
import { SolicitacaoController } from '../controllers/SolicitacaoController';

const rotasSolicitacoes = Router();

rotasSolicitacoes.post('/', SolicitacaoController.criar);
rotasSolicitacoes.get('/', SolicitacaoController.listar);

export default rotasSolicitacoes;