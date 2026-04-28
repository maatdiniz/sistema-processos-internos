// Arquivo: backend/src/controllers/DemandaController.ts
import { Request, Response } from 'express';
import { abrirBanco } from '../database/connection';
import { z } from 'zod';

const demandaSchema = z.object({
    assunto: z.string().min(5, 'O assunto deve ter no mínimo 5 caracteres.'),
    descricao: z.string().optional().or(z.literal('')),
    tipo_demanda_id: z.number().int().positive('Tipo de demanda inválido.'),
    prioridade_id: z.number().int().positive('Prioridade inválida.'),
    departamento_destino_id: z.number().int().positive('Departamento de destino inválido.'),
    funcionario_responsavel_id: z.number().int().positive().optional().nullable(),
    prazo_desejado: z.string().optional().or(z.literal(''))
});

// Gera protocolo estilo Jira: DEM-1, DEM-2, DEM-3...
async function gerarProtocolo(): Promise<string> {
    const db = await abrirBanco();
    const ultima = await db.get('SELECT MAX(id) as maxId FROM demandas');
    const proximo = (ultima?.maxId || 0) + 1;
    return `CEAD-${proximo}`;
}

export const DemandaController = {

    async criar(req: Request, res: Response): Promise<any> {
        try {
            const dados = demandaSchema.parse(req.body);
            const db = await abrirBanco();

            // Validar FK: tipo de demanda existe
            const tipo = await db.get('SELECT id FROM tipos_demanda WHERE id = ? AND ativo = 1', [dados.tipo_demanda_id]);
            if (!tipo) return res.status(400).json({ erro: 'Tipo de demanda inválido ou inativo.' });

            // Validar FK: departamento destino existe
            const depto = await db.get('SELECT id FROM departamentos WHERE id = ? AND ativo = 1', [dados.departamento_destino_id]);
            if (!depto) return res.status(400).json({ erro: 'Departamento de destino inválido ou inativo.' });

            // Validar FK: prioridade existe
            const prio = await db.get('SELECT id FROM prioridades WHERE id = ?', [dados.prioridade_id]);
            if (!prio) return res.status(400).json({ erro: 'Prioridade inválida.' });

            // Validar FK: funcionário responsável (se informado)
            if (dados.funcionario_responsavel_id) {
                const func = await db.get('SELECT id FROM funcionarios WHERE id = ? AND ativo = 1', [dados.funcionario_responsavel_id]);
                if (!func) return res.status(400).json({ erro: 'Funcionário responsável inválido ou inativo.' });
            }

            const protocolo = await gerarProtocolo();

            const resultado = await db.run(
                `INSERT INTO demandas (protocolo, assunto, descricao, tipo_demanda_id, prioridade_id,
                    departamento_destino_id, funcionario_responsavel_id, status, prazo_desejado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Aberto', ?)`,
                [
                    protocolo,
                    dados.assunto,
                    dados.descricao || '',
                    dados.tipo_demanda_id,
                    dados.prioridade_id,
                    dados.departamento_destino_id,
                    dados.funcionario_responsavel_id || null,
                    dados.prazo_desejado || null
                ]
            );

            // Registrar no log
            await db.run(
                `INSERT INTO log_atividades (demanda_id, acao, descricao) VALUES (?, 'criou', ?)`,
                [resultado.lastID, `Demanda ${protocolo} criada.`]
            );

            return res.status(201).json({
                mensagem: 'Demanda registrada com sucesso!',
                protocolo,
                id: resultado.lastID
            });
        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro ao criar demanda:', erro);
            return res.status(500).json({ erro: 'Erro interno ao registrar a demanda.' });
        }
    },

    async listar(_req: Request, res: Response): Promise<any> {
        try {
            const db = await abrirBanco();
            const demandas = await db.all(`
                SELECT d.*, 
                    td.nome as tipo_nome,
                    p.nome as prioridade_nome, p.cor as prioridade_cor,
                    dd.nome as departamento_destino_nome,
                    fr.nome as responsavel_nome
                FROM demandas d
                LEFT JOIN tipos_demanda td ON d.tipo_demanda_id = td.id
                LEFT JOIN prioridades p ON d.prioridade_id = p.id
                LEFT JOIN departamentos dd ON d.departamento_destino_id = dd.id
                LEFT JOIN funcionarios fr ON d.funcionario_responsavel_id = fr.id
                ORDER BY d.created_at DESC
            `);
            return res.json(demandas);
        } catch (erro) {
            console.error('Erro ao listar demandas:', erro);
            return res.status(500).json({ erro: 'Erro ao buscar demandas.' });
        }
    }
};
