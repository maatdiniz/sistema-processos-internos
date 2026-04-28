// Arquivo: backend/src/controllers/TipoDemandaController.ts
import { Request, Response } from 'express';
import { abrirBanco } from '../database/connection';
import { z } from 'zod';

const tipoDemandaSchema = z.object({
    nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres.').max(150),
    descricao: z.string().optional().or(z.literal(''))
});

export const TipoDemandaController = {

    async listar(_req: Request, res: Response): Promise<any> {
        try {
            const db = await abrirBanco();
            const tipos = await db.all('SELECT * FROM tipos_demanda ORDER BY nome');
            return res.json(tipos);
        } catch (erro) {
            console.error('Erro ao listar tipos de demanda:', erro);
            return res.status(500).json({ erro: 'Erro interno ao buscar tipos de demanda.' });
        }
    },

    async listarAtivos(_req: Request, res: Response): Promise<any> {
        try {
            const db = await abrirBanco();
            const tipos = await db.all('SELECT * FROM tipos_demanda WHERE ativo = 1 ORDER BY nome');
            return res.json(tipos);
        } catch (erro) {
            console.error('Erro ao listar tipos ativos:', erro);
            return res.status(500).json({ erro: 'Erro interno ao buscar tipos de demanda.' });
        }
    },

    async criar(req: Request, res: Response): Promise<any> {
        try {
            const dados = tipoDemandaSchema.parse(req.body);
            const db = await abrirBanco();

            const existente = await db.get('SELECT id FROM tipos_demanda WHERE nome = ?', [dados.nome]);
            if (existente) {
                return res.status(409).json({ erro: 'Já existe um tipo de demanda com este nome.' });
            }

            const resultado = await db.run(
                'INSERT INTO tipos_demanda (nome, descricao) VALUES (?, ?)',
                [dados.nome, dados.descricao || null]
            );
            return res.status(201).json({
                mensagem: 'Tipo de demanda criado com sucesso!',
                tipo: { id: resultado.lastID, nome: dados.nome, ativo: 1 }
            });
        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro ao criar tipo de demanda:', erro);
            return res.status(500).json({ erro: 'Erro interno ao criar tipo de demanda.' });
        }
    },

    async atualizar(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const dados = tipoDemandaSchema.parse(req.body);
            const db = await abrirBanco();

            const existente = await db.get('SELECT id FROM tipos_demanda WHERE id = ?', [id]);
            if (!existente) {
                return res.status(404).json({ erro: 'Tipo de demanda não encontrado.' });
            }

            const duplicado = await db.get('SELECT id FROM tipos_demanda WHERE nome = ? AND id != ?', [dados.nome, id]);
            if (duplicado) {
                return res.status(409).json({ erro: 'Já existe outro tipo de demanda com este nome.' });
            }

            await db.run('UPDATE tipos_demanda SET nome = ?, descricao = ? WHERE id = ?', [dados.nome, dados.descricao || null, id]);
            return res.json({ mensagem: 'Tipo de demanda atualizado com sucesso!' });
        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro ao atualizar tipo de demanda:', erro);
            return res.status(500).json({ erro: 'Erro interno ao atualizar tipo de demanda.' });
        }
    },

    async alternarAtivo(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const db = await abrirBanco();

            const tipo = await db.get('SELECT id, ativo FROM tipos_demanda WHERE id = ?', [id]);
            if (!tipo) {
                return res.status(404).json({ erro: 'Tipo de demanda não encontrado.' });
            }

            const novoStatus = tipo.ativo === 1 ? 0 : 1;
            await db.run('UPDATE tipos_demanda SET ativo = ? WHERE id = ?', [novoStatus, id]);
            return res.json({ mensagem: `Tipo de demanda ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`, ativo: novoStatus });
        } catch (erro) {
            console.error('Erro ao alternar status:', erro);
            return res.status(500).json({ erro: 'Erro interno ao alterar status.' });
        }
    }
};
