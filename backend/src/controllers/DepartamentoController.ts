// Arquivo: backend/src/controllers/DepartamentoController.ts
import { Request, Response } from 'express';
import { abrirBanco } from '../database/connection';
import { z } from 'zod';

const departamentoSchema = z.object({
    nome: z.string().min(2, 'O nome do departamento deve ter no mínimo 2 caracteres.').max(100)
});

export const DepartamentoController = {

    async listar(_req: Request, res: Response): Promise<any> {
        try {
            const db = await abrirBanco();
            const departamentos = await db.all('SELECT * FROM departamentos ORDER BY nome');
            return res.json(departamentos);
        } catch (erro) {
            console.error('Erro ao listar departamentos:', erro);
            return res.status(500).json({ erro: 'Erro interno ao buscar departamentos.' });
        }
    },

    async listarAtivos(_req: Request, res: Response): Promise<any> {
        try {
            const db = await abrirBanco();
            const departamentos = await db.all('SELECT * FROM departamentos WHERE ativo = 1 ORDER BY nome');
            return res.json(departamentos);
        } catch (erro) {
            console.error('Erro ao listar departamentos ativos:', erro);
            return res.status(500).json({ erro: 'Erro interno ao buscar departamentos.' });
        }
    },

    async criar(req: Request, res: Response): Promise<any> {
        try {
            const dados = departamentoSchema.parse(req.body);
            const db = await abrirBanco();

            // Verificar duplicidade
            const existente = await db.get('SELECT id FROM departamentos WHERE nome = ?', [dados.nome]);
            if (existente) {
                return res.status(409).json({ erro: 'Já existe um departamento com este nome.' });
            }

            const resultado = await db.run('INSERT INTO departamentos (nome) VALUES (?)', [dados.nome]);
            return res.status(201).json({
                mensagem: 'Departamento criado com sucesso!',
                departamento: { id: resultado.lastID, nome: dados.nome, ativo: 1 }
            });
        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro ao criar departamento:', erro);
            return res.status(500).json({ erro: 'Erro interno ao criar departamento.' });
        }
    },

    async atualizar(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const dados = departamentoSchema.parse(req.body);
            const db = await abrirBanco();

            const existente = await db.get('SELECT id FROM departamentos WHERE id = ?', [id]);
            if (!existente) {
                return res.status(404).json({ erro: 'Departamento não encontrado.' });
            }

            // Verificar duplicidade de nome (excluindo o próprio registro)
            const duplicado = await db.get('SELECT id FROM departamentos WHERE nome = ? AND id != ?', [dados.nome, id]);
            if (duplicado) {
                return res.status(409).json({ erro: 'Já existe outro departamento com este nome.' });
            }

            await db.run('UPDATE departamentos SET nome = ? WHERE id = ?', [dados.nome, id]);
            return res.json({ mensagem: 'Departamento atualizado com sucesso!' });
        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro ao atualizar departamento:', erro);
            return res.status(500).json({ erro: 'Erro interno ao atualizar departamento.' });
        }
    },

    async alternarAtivo(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const db = await abrirBanco();

            const depto = await db.get('SELECT id, ativo FROM departamentos WHERE id = ?', [id]);
            if (!depto) {
                return res.status(404).json({ erro: 'Departamento não encontrado.' });
            }

            const novoStatus = depto.ativo === 1 ? 0 : 1;
            await db.run('UPDATE departamentos SET ativo = ? WHERE id = ?', [novoStatus, id]);
            return res.json({ mensagem: `Departamento ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`, ativo: novoStatus });
        } catch (erro) {
            console.error('Erro ao alternar status:', erro);
            return res.status(500).json({ erro: 'Erro interno ao alterar status.' });
        }
    }
};
