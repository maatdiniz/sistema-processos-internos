// Arquivo: backend/src/controllers/SolicitacaoController.ts
import { Request, Response } from 'express';
import { abrirBanco } from '../database/connection';
import { z } from 'zod'; // Importando o Zod para validação

// 1. Criamos a "barreira" de validação com Zod
const solicitacaoSchema = z.object({
    tipo: z.string().min(3, "O tipo deve ter no mínimo 3 caracteres."),
    assunto: z.string().min(5, "O assunto deve ter no mínimo 5 caracteres."),
    texto_descricao: z.string().optional(), // Pode ser vazio
    departamento_id: z.number().int().positive("ID de departamento inválido.")
});

export const SolicitacaoController = {
    async criar(req: Request, res: Response): Promise<any> {
        try {
            // 2. O Zod tenta validar o corpo da requisição. Se falhar, cai no catch.
            const dadosValidados = solicitacaoSchema.parse(req.body);

            const db = await abrirBanco();

            // 3. O SQL seguro usando parâmetros (?) contra injeção de código
            const resultado = await db.run(
                `INSERT INTO solicitacoes (tipo, assunto, texto_descricao, departamento_id, status) 
         VALUES (?, ?, ?, ?, 'Aberto')`,
                [
                    dadosValidados.tipo,
                    dadosValidados.assunto,
                    dadosValidados.texto_descricao || '',
                    dadosValidados.departamento_id
                ]
            );

            return res.status(201).json({
                mensagem: 'Demanda registrada com sucesso!',
                id_protocolo: resultado.lastID
            });

        } catch (erro) {
            // Se o erro for do Zod (validação), devolvemos as mensagens claras para o Front-end
            if (erro instanceof z.ZodError) {
                return res.status(400).json({
                    erro: 'Dados inválidos.',
                    detalhes: erro.errors.map(e => e.message)
                });
            }

            console.error('Erro interno:', erro);
            return res.status(500).json({ erro: 'Erro interno ao registrar a demanda.' });
        }
    },

    async listar(req: Request, res: Response): Promise<any> {
        try {
            const db = await abrirBanco();
            const solicitacoes = await db.all('SELECT * FROM solicitacoes');
            return res.status(200).json(solicitacoes);
        } catch (erro) {
            return res.status(500).json({ erro: 'Erro ao buscar as demandas.' });
        }
    }
};