// Arquivo: backend/src/controllers/SolicitacaoRecursoController.ts
import { Request, Response } from 'express';
import { abrirBanco } from '../database/connection';
import { z } from 'zod';

// ── Schemas de validação ──
const criarSchema = z.object({
    nome_sugerido: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres.').max(150),
    descricao_sugerida: z.string().optional().or(z.literal(''))
});

const aprovarSchema = z.object({
    nome_aprovado: z.string().min(3, 'O nome aprovado deve ter no mínimo 3 caracteres.').max(150),
    descricao_aprovada: z.string().optional().or(z.literal(''))
});

const recusarSchema = z.object({
    justificativa_admin: z.string().min(5, 'A justificativa deve ter no mínimo 5 caracteres.')
});

// Gera protocolo REC-1, REC-2, REC-3...
async function gerarProtocoloRecurso(): Promise<string> {
    const db = await abrirBanco();
    const ultima = await db.get('SELECT MAX(id) as maxId FROM solicitacoes_recurso');
    const proximo = (ultima?.maxId || 0) + 1;
    return `REC-${proximo}`;
}

// Helper para registrar log
async function registrarLog(
    solicitacao_recurso_id: number,
    funcionario_id: number | null,
    acao: string,
    descricao: string,
    dados_anteriores?: any,
    dados_novos?: any
) {
    const db = await abrirBanco();
    await db.run(
        `INSERT INTO log_solicitacoes_recurso 
         (solicitacao_recurso_id, funcionario_id, acao, descricao, dados_anteriores, dados_novos) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            solicitacao_recurso_id,
            funcionario_id,
            acao,
            descricao,
            dados_anteriores ? JSON.stringify(dados_anteriores) : null,
            dados_novos ? JSON.stringify(dados_novos) : null
        ]
    );
}

export const SolicitacaoRecursoController = {

    // ── Criar solicitação (qualquer usuário) ──
    async criar(req: Request, res: Response): Promise<any> {
        try {
            const dados = criarSchema.parse(req.body);
            const db = await abrirBanco();

            // Verificar se já existe tipo de demanda com este nome
            const existente = await db.get(
                'SELECT id FROM tipos_demanda WHERE LOWER(nome) = LOWER(?)',
                [dados.nome_sugerido]
            );
            if (existente) {
                return res.status(409).json({
                    erro: 'Já existe um tipo de demanda com este nome. Verifique as categorias disponíveis.'
                });
            }

            // Verificar se já existe solicitação pendente com este nome
            const pendente = await db.get(
                `SELECT id FROM solicitacoes_recurso 
                 WHERE LOWER(nome_sugerido) = LOWER(?) AND status IN ('Pendente', 'Em Tratamento')`,
                [dados.nome_sugerido]
            );
            if (pendente) {
                return res.status(409).json({
                    erro: 'Já existe uma solicitação pendente com este nome sugerido.'
                });
            }

            const protocolo = await gerarProtocoloRecurso();

            const resultado = await db.run(
                `INSERT INTO solicitacoes_recurso (protocolo, nome_sugerido, descricao_sugerida, status) 
                 VALUES (?, ?, ?, 'Pendente')`,
                [protocolo, dados.nome_sugerido, dados.descricao_sugerida || '']
            );

            // Registrar log
            await registrarLog(
                resultado.lastID!,
                null,
                'criou',
                `Solicitação ${protocolo} criada. Nome sugerido: "${dados.nome_sugerido}".`,
                null,
                { nome_sugerido: dados.nome_sugerido, descricao_sugerida: dados.descricao_sugerida }
            );

            return res.status(201).json({
                mensagem: 'Solicitação de recurso registrada com sucesso!',
                protocolo,
                id: resultado.lastID
            });
        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro ao criar solicitação de recurso:', erro);
            return res.status(500).json({ erro: 'Erro interno ao registrar a solicitação.' });
        }
    },

    // ── Listar todas as solicitações ──
    async listar(_req: Request, res: Response): Promise<any> {
        try {
            const db = await abrirBanco();
            const solicitacoes = await db.all(`
                SELECT sr.*,
                    fs.nome as solicitante_nome,
                    fa.nome as admin_nome,
                    td.nome as tipo_demanda_nome
                FROM solicitacoes_recurso sr
                LEFT JOIN funcionarios fs ON sr.funcionario_solicitante_id = fs.id
                LEFT JOIN funcionarios fa ON sr.funcionario_admin_id = fa.id
                LEFT JOIN tipos_demanda td ON sr.tipo_demanda_criado_id = td.id
                ORDER BY sr.created_at DESC
            `);
            return res.json(solicitacoes);
        } catch (erro) {
            console.error('Erro ao listar solicitações de recurso:', erro);
            return res.status(500).json({ erro: 'Erro ao buscar solicitações de recurso.' });
        }
    },

    // ── Detalhe de uma solicitação ──
    async detalhe(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const db = await abrirBanco();
            const solicitacao = await db.get(`
                SELECT sr.*,
                    fs.nome as solicitante_nome,
                    fa.nome as admin_nome,
                    td.nome as tipo_demanda_nome
                FROM solicitacoes_recurso sr
                LEFT JOIN funcionarios fs ON sr.funcionario_solicitante_id = fs.id
                LEFT JOIN funcionarios fa ON sr.funcionario_admin_id = fa.id
                LEFT JOIN tipos_demanda td ON sr.tipo_demanda_criado_id = td.id
                WHERE sr.id = ?
            `, [id]);

            if (!solicitacao) {
                return res.status(404).json({ erro: 'Solicitação não encontrada.' });
            }
            return res.json(solicitacao);
        } catch (erro) {
            console.error('Erro ao buscar detalhe:', erro);
            return res.status(500).json({ erro: 'Erro interno.' });
        }
    },

    // ── Admin: Marcar como "Em Tratamento" ──
    async analisar(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const db = await abrirBanco();

            const solicitacao = await db.get('SELECT * FROM solicitacoes_recurso WHERE id = ?', [id]);
            if (!solicitacao) {
                return res.status(404).json({ erro: 'Solicitação não encontrada.' });
            }
            if (solicitacao.status !== 'Pendente') {
                return res.status(400).json({ erro: `Não é possível analisar uma solicitação com status "${solicitacao.status}".` });
            }

            const dadosAnteriores = { status: solicitacao.status };
            await db.run(
                `UPDATE solicitacoes_recurso SET status = 'Em Tratamento', updated_at = datetime('now', 'localtime') WHERE id = ?`,
                [id]
            );

            await registrarLog(
                Number(id), null, 'iniciou_analise',
                `Solicitação ${solicitacao.protocolo} entrou em análise.`,
                dadosAnteriores, { status: 'Em Tratamento' }
            );

            return res.json({ mensagem: 'Solicitação marcada como "Em Tratamento".' });
        } catch (erro) {
            console.error('Erro ao iniciar análise:', erro);
            return res.status(500).json({ erro: 'Erro interno.' });
        }
    },

    // ── Admin: Aprovar (editar + inserir tipo de demanda) ──
    async aprovar(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const dados = aprovarSchema.parse(req.body);
            const db = await abrirBanco();

            const solicitacao = await db.get('SELECT * FROM solicitacoes_recurso WHERE id = ?', [id]);
            if (!solicitacao) {
                return res.status(404).json({ erro: 'Solicitação não encontrada.' });
            }
            if (solicitacao.status === 'Aprovado' || solicitacao.status === 'Recusado') {
                return res.status(400).json({ erro: `Esta solicitação já foi ${solicitacao.status.toLowerCase()}.` });
            }

            // Verificar se já existe tipo com o nome aprovado
            const duplicado = await db.get('SELECT id FROM tipos_demanda WHERE LOWER(nome) = LOWER(?)', [dados.nome_aprovado]);
            if (duplicado) {
                return res.status(409).json({ erro: 'Já existe um tipo de demanda com este nome.' });
            }

            // 1. Inserir novo tipo de demanda
            const novoTipo = await db.run(
                'INSERT INTO tipos_demanda (nome, descricao) VALUES (?, ?)',
                [dados.nome_aprovado, dados.descricao_aprovada || null]
            );

            // 2. Atualizar solicitação
            const dadosAnteriores = {
                status: solicitacao.status,
                nome_sugerido: solicitacao.nome_sugerido,
                descricao_sugerida: solicitacao.descricao_sugerida
            };

            await db.run(
                `UPDATE solicitacoes_recurso 
                 SET status = 'Aprovado', nome_aprovado = ?, descricao_aprovada = ?, 
                     tipo_demanda_criado_id = ?, updated_at = datetime('now', 'localtime')
                 WHERE id = ?`,
                [dados.nome_aprovado, dados.descricao_aprovada || '', novoTipo.lastID, id]
            );

            // 3. Log
            await registrarLog(
                Number(id), null, 'aprovou',
                `Solicitação ${solicitacao.protocolo} aprovada. Tipo de demanda "${dados.nome_aprovado}" criado (ID: ${novoTipo.lastID}).`,
                dadosAnteriores,
                { status: 'Aprovado', nome_aprovado: dados.nome_aprovado, tipo_demanda_id: novoTipo.lastID }
            );

            return res.json({
                mensagem: 'Solicitação aprovada! Novo tipo de demanda criado.',
                tipo_demanda: { id: novoTipo.lastID, nome: dados.nome_aprovado }
            });
        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro ao aprovar solicitação:', erro);
            return res.status(500).json({ erro: 'Erro interno ao aprovar.' });
        }
    },

    // ── Admin: Recusar com justificativa ──
    async recusar(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const dados = recusarSchema.parse(req.body);
            const db = await abrirBanco();

            const solicitacao = await db.get('SELECT * FROM solicitacoes_recurso WHERE id = ?', [id]);
            if (!solicitacao) {
                return res.status(404).json({ erro: 'Solicitação não encontrada.' });
            }
            if (solicitacao.status === 'Aprovado' || solicitacao.status === 'Recusado') {
                return res.status(400).json({ erro: `Esta solicitação já foi ${solicitacao.status.toLowerCase()}.` });
            }

            const dadosAnteriores = { status: solicitacao.status };

            await db.run(
                `UPDATE solicitacoes_recurso 
                 SET status = 'Recusado', justificativa_admin = ?, updated_at = datetime('now', 'localtime')
                 WHERE id = ?`,
                [dados.justificativa_admin, id]
            );

            await registrarLog(
                Number(id), null, 'recusou',
                `Solicitação ${solicitacao.protocolo} recusada. Justificativa: "${dados.justificativa_admin}".`,
                dadosAnteriores,
                { status: 'Recusado', justificativa_admin: dados.justificativa_admin }
            );

            return res.json({ mensagem: 'Solicitação recusada.' });
        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro ao recusar solicitação:', erro);
            return res.status(500).json({ erro: 'Erro interno ao recusar.' });
        }
    },

    // ── Admin: Consultar log de uma solicitação ──
    async consultarLog(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const db = await abrirBanco();

            const logs = await db.all(`
                SELECT l.*, f.nome as funcionario_nome
                FROM log_solicitacoes_recurso l
                LEFT JOIN funcionarios f ON l.funcionario_id = f.id
                WHERE l.solicitacao_recurso_id = ?
                ORDER BY l.created_at ASC
            `, [id]);

            return res.json(logs);
        } catch (erro) {
            console.error('Erro ao consultar log:', erro);
            return res.status(500).json({ erro: 'Erro ao buscar log.' });
        }
    }
};
