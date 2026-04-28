// Arquivo: backend/src/controllers/PrioridadeController.ts
import { Request, Response } from 'express';
import { abrirBanco } from '../database/connection';
import { z } from 'zod';

const prioridadeSchema = z.object({
    nome: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres.').max(50),
    descricao: z.string().min(5, 'A descrição é obrigatória e deve ser clara.'),
    ordem: z.number().int().min(1).max(10),
    cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'A cor deve estar no formato hexadecimal (#RRGGBB).')
});

export const PrioridadeController = {

    async listar(_req: Request, res: Response): Promise<any> {
        try {
            const db = await abrirBanco();
            const prioridades = await db.all('SELECT * FROM prioridades ORDER BY ordem');
            return res.json(prioridades);
        } catch (erro) {
            console.error('Erro ao listar prioridades:', erro);
            return res.status(500).json({ erro: 'Erro interno ao buscar prioridades.' });
        }
    },

    async criar(req: Request, res: Response): Promise<any> {
        try {
            const dados = prioridadeSchema.parse(req.body);
            const db = await abrirBanco();

            const existente = await db.get('SELECT id FROM prioridades WHERE nome = ?', [dados.nome]);
            if (existente) {
                return res.status(409).json({ erro: 'Já existe uma prioridade com este nome.' });
            }

            const resultado = await db.run(
                'INSERT INTO prioridades (nome, descricao, ordem, cor) VALUES (?, ?, ?, ?)',
                [dados.nome, dados.descricao, dados.ordem, dados.cor]
            );
            return res.status(201).json({
                mensagem: 'Prioridade criada com sucesso!',
                prioridade: { id: resultado.lastID, ...dados }
            });
        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro ao criar prioridade:', erro);
            return res.status(500).json({ erro: 'Erro interno ao criar prioridade.' });
        }
    },

    async atualizar(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const dados = prioridadeSchema.parse(req.body);
            const db = await abrirBanco();

            const existente = await db.get('SELECT id FROM prioridades WHERE id = ?', [id]);
            if (!existente) {
                return res.status(404).json({ erro: 'Prioridade não encontrada.' });
            }

            await db.run(
                'UPDATE prioridades SET nome = ?, descricao = ?, ordem = ?, cor = ? WHERE id = ?',
                [dados.nome, dados.descricao, dados.ordem, dados.cor, id]
            );
            return res.json({ mensagem: 'Prioridade atualizada com sucesso!' });
        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro ao atualizar prioridade:', erro);
            return res.status(500).json({ erro: 'Erro interno ao atualizar prioridade.' });
        }
    }
};
