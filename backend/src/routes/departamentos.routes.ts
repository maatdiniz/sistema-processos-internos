// Arquivo: backend/src/routes/departamentos.routes.ts
import { Router } from 'express';
import { DepartamentoController } from '../controllers/DepartamentoController';

const rotasDepartamentos = Router();

// Quando baterem na porta principal com o método POST, chama o Controller
rotasDepartamentos.post('/', DepartamentoController.criar);
rotasDepartamentos.get('/', DepartamentoController.listar);

export default rotasDepartamentos;