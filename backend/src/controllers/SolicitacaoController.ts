import { Request, Response } from 'express';
import { abrirBanco } from '../database/connection';

export const SolicitacaoController = {
    // 1. Criar nova demanda
    async criar(req: Request, res: Response) {
        try {
            const { tipo, assunto, texto_descricao, departamento_id, usuario_id } = req.body;

            // Validação: garante que os campos cruciais não venham em branco
            if (!tipo || !assunto || !departamento_id) {
                return res.status(400).json({ erro: 'Tipo, assunto e departamento são obrigatórios.' });
            }

            const db = await abrirBanco();

            // Insere os dados na tabela. O 'status' já entra como 'Aberto' por padrão do SQLite
            const resultado = await db.run(
                `INSERT INTO solicitacoes (tipo, assunto, texto_descricao, departamento_id, usuario_id) 
         VALUES (?, ?, ?, ?, ?)`,
                [tipo, assunto, texto_descricao, departamento_id, usuario_id || 1]
            );

            return res.status(201).json({
                mensagem: 'Demanda registrada com sucesso!',
                id_protocolo: resultado.lastID
            });
        } catch (erro) {
            console.error('Erro ao criar solicitação:', erro);
            return res.status(500).json({ erro: 'Erro interno ao registrar a demanda.' });
        }
    },

    // 2. Listar demandas
    async listar(req: Request, res: Response) {
        try {
            const db = await abrirBanco();
            const solicitacoes = await db.all('SELECT * FROM solicitacoes');
            return res.status(200).json(solicitacoes);
        } catch (erro) {
            return res.status(500).json({ erro: 'Erro ao buscar as demandas.' });
        }
    }
};