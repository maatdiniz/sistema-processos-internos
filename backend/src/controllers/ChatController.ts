// Arquivo: backend/src/controllers/ChatController.ts
import { Request, Response } from 'express';
import { abrirBanco } from '../database/connection';
import { z } from 'zod';

const criarSessaoSchema = z.object({
    assunto: z.string().min(3, 'O assunto deve ter no mínimo 3 caracteres.').max(200)
});

const mensagemSchema = z.object({
    mensagem: z.string().min(1, 'A mensagem não pode estar vazia.').max(2000)
});

async function gerarProtocoloChat(): Promise<string> {
    const db = await abrirBanco();
    const ultima = await db.get('SELECT MAX(id) as maxId FROM chat_sessoes');
    const proximo = (ultima?.maxId || 0) + 1;
    return `CHAT-${proximo}`;
}

async function registrarLogChat(
    chat_sessao_id: number,
    funcionario_id: number | null,
    acao: string,
    descricao: string
) {
    const db = await abrirBanco();
    await db.run(
        'INSERT INTO log_chat (chat_sessao_id, funcionario_id, acao, descricao) VALUES (?, ?, ?, ?)',
        [chat_sessao_id, funcionario_id, acao, descricao]
    );
}

export const ChatController = {

    // ── Abrir nova sessão de chat ──
    async criarSessao(req: Request, res: Response): Promise<any> {
        try {
            const dados = criarSessaoSchema.parse(req.body);
            const db = await abrirBanco();
            const protocolo = await gerarProtocoloChat();

            const resultado = await db.run(
                `INSERT INTO chat_sessoes (protocolo, assunto, status) VALUES (?, ?, 'Aguardando')`,
                [protocolo, dados.assunto]
            );

            // Mensagem automática do sistema
            await db.run(
                `INSERT INTO chat_mensagens (chat_sessao_id, mensagem, tipo) VALUES (?, ?, 'sistema')`,
                [resultado.lastID, `Chat ${protocolo} aberto. Assunto: "${dados.assunto}". Aguardando atendente...`]
            );

            await registrarLogChat(resultado.lastID!, null, 'abriu', `Chat ${protocolo} aberto.`);

            return res.status(201).json({
                mensagem: 'Chat aberto com sucesso!',
                protocolo,
                id: resultado.lastID
            });
        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro ao criar sessão de chat:', erro);
            return res.status(500).json({ erro: 'Erro interno ao abrir chat.' });
        }
    },

    // ── Listar sessões (todas) ──
    async listarSessoes(_req: Request, res: Response): Promise<any> {
        try {
            const db = await abrirBanco();
            const sessoes = await db.all(`
                SELECT cs.*,
                    fu.nome as usuario_nome,
                    fa.nome as admin_nome
                FROM chat_sessoes cs
                LEFT JOIN funcionarios fu ON cs.funcionario_usuario_id = fu.id
                LEFT JOIN funcionarios fa ON cs.funcionario_admin_id = fa.id
                ORDER BY cs.created_at DESC
            `);
            return res.json(sessoes);
        } catch (erro) {
            console.error('Erro ao listar sessões:', erro);
            return res.status(500).json({ erro: 'Erro ao buscar sessões.' });
        }
    },

    // ── Buscar mensagens de uma sessão (polling) ──
    async listarMensagens(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const after = req.query.after as string | undefined;
            const db = await abrirBanco();

            let mensagens;
            if (after) {
                mensagens = await db.all(
                    `SELECT cm.*, f.nome as autor_nome 
                     FROM chat_mensagens cm
                     LEFT JOIN funcionarios f ON cm.funcionario_id = f.id
                     WHERE cm.chat_sessao_id = ? AND cm.id > ?
                     ORDER BY cm.created_at ASC`,
                    [id, after]
                );
            } else {
                mensagens = await db.all(
                    `SELECT cm.*, f.nome as autor_nome 
                     FROM chat_mensagens cm
                     LEFT JOIN funcionarios f ON cm.funcionario_id = f.id
                     WHERE cm.chat_sessao_id = ?
                     ORDER BY cm.created_at ASC`,
                    [id]
                );
            }

            // Buscar status atual da sessão
            const sessao = await db.get('SELECT status, funcionario_admin_id FROM chat_sessoes WHERE id = ?', [id]);

            return res.json({ mensagens, status: sessao?.status, admin_id: sessao?.funcionario_admin_id });
        } catch (erro) {
            console.error('Erro ao listar mensagens:', erro);
            return res.status(500).json({ erro: 'Erro ao buscar mensagens.' });
        }
    },

    // ── Enviar mensagem ──
    async enviarMensagem(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const dados = mensagemSchema.parse(req.body);
            const db = await abrirBanco();

            const sessao = await db.get('SELECT * FROM chat_sessoes WHERE id = ?', [id]);
            if (!sessao) return res.status(404).json({ erro: 'Sessão não encontrada.' });
            if (sessao.status === 'Encerrado') return res.status(400).json({ erro: 'Este chat já foi encerrado.' });

            const resultado = await db.run(
                `INSERT INTO chat_mensagens (chat_sessao_id, mensagem, tipo) VALUES (?, ?, 'texto')`,
                [id, dados.mensagem]
            );

            await registrarLogChat(Number(id), null, 'enviou_mensagem', `Mensagem enviada no chat ${sessao.protocolo}.`);

            return res.status(201).json({
                id: resultado.lastID,
                mensagem: dados.mensagem,
                tipo: 'texto',
                created_at: new Date().toISOString()
            });
        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro ao enviar mensagem:', erro);
            return res.status(500).json({ erro: 'Erro interno.' });
        }
    },

    // ── Admin: aceitar chat ──
    async aceitar(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const db = await abrirBanco();

            const sessao = await db.get('SELECT * FROM chat_sessoes WHERE id = ?', [id]);
            if (!sessao) return res.status(404).json({ erro: 'Sessão não encontrada.' });
            if (sessao.status !== 'Aguardando') return res.status(400).json({ erro: `Não é possível aceitar um chat com status "${sessao.status}".` });

            await db.run(
                `UPDATE chat_sessoes SET status = 'Ativo' WHERE id = ?`,
                [id]
            );

            // Mensagem do sistema
            await db.run(
                `INSERT INTO chat_mensagens (chat_sessao_id, mensagem, tipo) VALUES (?, ?, 'sistema')`,
                [id, 'Um atendente entrou no chat. Como posso ajudar?']
            );

            await registrarLogChat(Number(id), null, 'aceitou', `Chat ${sessao.protocolo} aceito por um atendente.`);

            return res.json({ mensagem: 'Chat aceito com sucesso!' });
        } catch (erro) {
            console.error('Erro ao aceitar chat:', erro);
            return res.status(500).json({ erro: 'Erro interno.' });
        }
    },

    // ── Encerrar chat ──
    async encerrar(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const db = await abrirBanco();

            const sessao = await db.get('SELECT * FROM chat_sessoes WHERE id = ?', [id]);
            if (!sessao) return res.status(404).json({ erro: 'Sessão não encontrada.' });
            if (sessao.status === 'Encerrado') return res.status(400).json({ erro: 'Chat já está encerrado.' });

            await db.run(
                `UPDATE chat_sessoes SET status = 'Encerrado', encerrado_at = datetime('now', 'localtime') WHERE id = ?`,
                [id]
            );

            await db.run(
                `INSERT INTO chat_mensagens (chat_sessao_id, mensagem, tipo) VALUES (?, ?, 'sistema')`,
                [id, 'Chat encerrado.']
            );

            await registrarLogChat(Number(id), null, 'encerrou', `Chat ${sessao.protocolo} encerrado.`);

            return res.json({ mensagem: 'Chat encerrado.' });
        } catch (erro) {
            console.error('Erro ao encerrar chat:', erro);
            return res.status(500).json({ erro: 'Erro interno.' });
        }
    },

    // ── Admin: listar todas sessões ──
    async listarSessoesAdmin(_req: Request, res: Response): Promise<any> {
        try {
            const db = await abrirBanco();
            const sessoes = await db.all(`
                SELECT cs.*,
                    fu.nome as usuario_nome,
                    fa.nome as admin_nome,
                    (SELECT COUNT(*) FROM chat_mensagens WHERE chat_sessao_id = cs.id AND tipo = 'texto') as total_mensagens
                FROM chat_sessoes cs
                LEFT JOIN funcionarios fu ON cs.funcionario_usuario_id = fu.id
                LEFT JOIN funcionarios fa ON cs.funcionario_admin_id = fa.id
                ORDER BY 
                    CASE cs.status WHEN 'Aguardando' THEN 0 WHEN 'Ativo' THEN 1 ELSE 2 END,
                    cs.created_at DESC
            `);
            return res.json(sessoes);
        } catch (erro) {
            console.error('Erro ao listar sessões admin:', erro);
            return res.status(500).json({ erro: 'Erro ao buscar sessões.' });
        }
    },

    // ── Admin: log de uma sessão ──
    async consultarLog(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const db = await abrirBanco();
            const logs = await db.all(
                `SELECT l.*, f.nome as funcionario_nome
                 FROM log_chat l
                 LEFT JOIN funcionarios f ON l.funcionario_id = f.id
                 WHERE l.chat_sessao_id = ?
                 ORDER BY l.created_at ASC`,
                [id]
            );
            return res.json(logs);
        } catch (erro) {
            console.error('Erro ao consultar log:', erro);
            return res.status(500).json({ erro: 'Erro ao buscar log.' });
        }
    }
};
