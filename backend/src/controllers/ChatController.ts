// Arquivo: backend/src/controllers/ChatController.ts
import { Request, Response } from 'express';
import { abrirBanco } from '../database/connection';
import { z } from 'zod';
import { getIO } from '../socket';

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

    // ── Histórico Contínuo (Blip style) ──
    async historicoContinuo(req: Request, res: Response): Promise<any> {
        try {
            const usuario_id = (req as any).usuario?.id;
            if (!usuario_id) return res.status(401).json({ erro: 'Não autorizado.' });

            const db = await abrirBanco();
            
            // Buscar todas as sessões do usuário
            const sessoes = await db.all(
                'SELECT * FROM chat_sessoes WHERE funcionario_usuario_id = ? ORDER BY created_at ASC',
                [usuario_id]
            );

            // Buscar todas as mensagens do usuário (de todas as suas sessões)
            const mensagens = await db.all(
                `SELECT cm.*, f.nome as autor_nome 
                 FROM chat_mensagens cm
                 JOIN chat_sessoes cs ON cm.chat_sessao_id = cs.id
                 LEFT JOIN funcionarios f ON cm.funcionario_id = f.id
                 WHERE cs.funcionario_usuario_id = ?
                 ORDER BY cm.created_at ASC`,
                [usuario_id]
            );

            return res.json({ sessoes, mensagens });
        } catch (erro) {
            console.error('Erro ao buscar histórico:', erro);
            return res.status(500).json({ erro: 'Erro interno ao buscar histórico.' });
        }
    },

    // ── Abrir nova sessão de chat ──
    async criarSessao(req: Request, res: Response): Promise<any> {
        try {
            const dados = criarSessaoSchema.parse(req.body);
            const db = await abrirBanco();
            const protocolo = await gerarProtocoloChat();
            
            const usuario = (req as any).usuario;
            if (!usuario) return res.status(401).json({ erro: 'Usuário não autenticado.' });

            const resultado = await db.run(
                `INSERT INTO chat_sessoes (protocolo, assunto, funcionario_usuario_id, status) VALUES (?, ?, ?, 'Aguardando')`,
                [protocolo, dados.assunto, usuario.id]
            );

            const novaSessao = await db.get('SELECT * FROM chat_sessoes WHERE id = ?', [resultado.lastID]);

            // Mensagem automática do sistema
            await db.run(
                `INSERT INTO chat_mensagens (chat_sessao_id, mensagem, tipo) VALUES (?, ?, 'sistema')`,
                [resultado.lastID, `Chat ${protocolo} aberto. Assunto: "${dados.assunto}". Aguardando atendente...`]
            );

            await registrarLogChat(resultado.lastID!, null, 'abriu', `Chat ${protocolo} aberto por ${usuario.nome}.`);

            // Notificar admins via WebSocket
            const io = getIO();
            io.to('admin_room').emit('nova_sessao', novaSessao);

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

    // ── Buscar mensagens de uma sessão ──
    async listarMensagens(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const db = await abrirBanco();

            const mensagens = await db.all(
                `SELECT cm.*, f.nome as autor_nome 
                 FROM chat_mensagens cm
                 LEFT JOIN funcionarios f ON cm.funcionario_id = f.id
                 WHERE cm.chat_sessao_id = ?
                 ORDER BY cm.created_at ASC`,
                [id]
            );

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
            const usuario = (req as any).usuario;
            const db = await abrirBanco();

            const sessao = await db.get('SELECT * FROM chat_sessoes WHERE id = ?', [id]);
            if (!sessao) return res.status(404).json({ erro: 'Sessão não encontrada.' });
            if (sessao.status === 'Encerrado') return res.status(400).json({ erro: 'Este chat já foi encerrado.' });

            // Regra de exclusividade do admin: se tiver admin e não for este, negar
            if (usuario.perfil === 'admin' && sessao.funcionario_admin_id && sessao.funcionario_admin_id !== usuario.id) {
                 return res.status(403).json({ erro: 'Este chat já foi assumido por outro atendente.' });
            }

            const resultado = await db.run(
                `INSERT INTO chat_mensagens (chat_sessao_id, funcionario_id, mensagem, tipo) VALUES (?, ?, ?, 'texto')`,
                [id, usuario.id, dados.mensagem]
            );

            await registrarLogChat(Number(id), usuario.id, 'enviou_mensagem', `Mensagem enviada.`);

            const msgResult = await db.get(`
                SELECT cm.*, f.nome as autor_nome 
                FROM chat_mensagens cm
                LEFT JOIN funcionarios f ON cm.funcionario_id = f.id
                WHERE cm.id = ?`, [resultado.lastID]);

            // Emitir via WebSocket para a sala do chat e sala do usuário
            const io = getIO();
            io.to(`chat_${id}`).emit('nova_mensagem', msgResult);
            io.to(`user_${sessao.funcionario_usuario_id}`).emit('nova_mensagem', msgResult);

            return res.status(201).json(msgResult);
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
            const usuario = (req as any).usuario;
            const db = await abrirBanco();

            const sessao = await db.get('SELECT * FROM chat_sessoes WHERE id = ?', [id]);
            if (!sessao) return res.status(404).json({ erro: 'Sessão não encontrada.' });
            
            // Só pode aceitar se estiver aguardando ou sem admin
            if (sessao.status !== 'Aguardando' && sessao.funcionario_admin_id && sessao.funcionario_admin_id !== usuario.id) {
                return res.status(400).json({ erro: `Chat já aceito por outro atendente.` });
            }

            await db.run(
                `UPDATE chat_sessoes SET status = 'Ativo', funcionario_admin_id = ? WHERE id = ?`,
                [usuario.id, id]
            );

            // Mensagem do sistema
            const msgId = await db.run(
                `INSERT INTO chat_mensagens (chat_sessao_id, mensagem, tipo) VALUES (?, ?, 'sistema')`,
                [id, 'Um atendente entrou no chat.']
            );

            await registrarLogChat(Number(id), usuario.id, 'aceitou', `Chat aceito por ${usuario.nome}.`);

            const msgResult = await db.get(`SELECT * FROM chat_mensagens WHERE id = ?`, [msgId.lastID]);
            
            // Avisar participantes
            const io = getIO();
            io.to(`chat_${id}`).emit('sessao_atualizada', { id: Number(id), status: 'Ativo', funcionario_admin_id: usuario.id });
            io.to(`chat_${id}`).emit('nova_mensagem', msgResult);
            io.to(`user_${sessao.funcionario_usuario_id}`).emit('nova_mensagem', msgResult);
            io.to('admin_room').emit('sessao_atualizada', { id: Number(id), status: 'Ativo', funcionario_admin_id: usuario.id });

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
            const usuario = (req as any).usuario;
            const db = await abrirBanco();

            const sessao = await db.get('SELECT * FROM chat_sessoes WHERE id = ?', [id]);
            if (!sessao) return res.status(404).json({ erro: 'Sessão não encontrada.' });
            if (sessao.status === 'Encerrado') return res.status(400).json({ erro: 'Chat já está encerrado.' });

            await db.run(
                `UPDATE chat_sessoes SET status = 'Encerrado', encerrado_at = datetime('now', 'localtime') WHERE id = ?`,
                [id]
            );

            const msgId = await db.run(
                `INSERT INTO chat_mensagens (chat_sessao_id, mensagem, tipo) VALUES (?, ?, 'sistema')`,
                [id, 'Chat encerrado.']
            );

            await registrarLogChat(Number(id), usuario.id, 'encerrou', `Chat encerrado.`);

            const msgResult = await db.get(`SELECT * FROM chat_mensagens WHERE id = ?`, [msgId.lastID]);
            
            const io = getIO();
            io.to(`chat_${id}`).emit('sessao_atualizada', { id: Number(id), status: 'Encerrado' });
            io.to(`chat_${id}`).emit('nova_mensagem', msgResult);
            io.to(`user_${sessao.funcionario_usuario_id}`).emit('nova_mensagem', msgResult);
            io.to(`user_${sessao.funcionario_usuario_id}`).emit('sessao_atualizada', { id: Number(id), status: 'Encerrado' });
            io.to('admin_room').emit('sessao_atualizada', { id: Number(id), status: 'Encerrado' });

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
    },

    // ── Admin: Criar sessão com usuário alvo ──
    async criarSessaoAdmin(req: Request, res: Response): Promise<any> {
        try {
            const schema = z.object({
                funcionario_usuario_id: z.number().int().positive(),
                assunto: z.string().min(1),
                mensagem_inicial: z.string().min(1)
            });
            const dados = schema.parse(req.body);
            const admin = (req as any).usuario;
            if (admin.perfil !== 'admin') return res.status(403).json({ erro: 'Acesso negado.' });

            const db = await abrirBanco();
            
            // Verificar se o usuário existe
            const usuarioAlvo = await db.get('SELECT nome FROM funcionarios WHERE id = ?', [dados.funcionario_usuario_id]);
            if (!usuarioAlvo) return res.status(404).json({ erro: 'Usuário não encontrado.' });

            const protocolo = await gerarProtocoloChat();

            const resultado = await db.run(
                `INSERT INTO chat_sessoes (protocolo, assunto, funcionario_usuario_id, funcionario_admin_id, status) VALUES (?, ?, ?, ?, 'Ativo')`,
                [protocolo, dados.assunto, dados.funcionario_usuario_id, admin.id]
            );

            const novaSessaoId = resultado.lastID;

            // Inserir mensagem inicial
            const msgResult = await db.run(
                `INSERT INTO chat_mensagens (chat_sessao_id, funcionario_id, mensagem, tipo) VALUES (?, ?, ?, 'texto')`,
                [novaSessaoId, admin.id, dados.mensagem_inicial]
            );

            await registrarLogChat(novaSessaoId!, admin.id, 'abriu_admin', `Chat ${protocolo} iniciado pelo admin ${admin.nome}.`);

            const msgData = await db.get(`
                SELECT cm.*, f.nome as autor_nome 
                FROM chat_mensagens cm
                LEFT JOIN funcionarios f ON cm.funcionario_id = f.id
                WHERE cm.id = ?`, [msgResult.lastID]);

            const novaSessao = await db.get('SELECT * FROM chat_sessoes WHERE id = ?', [novaSessaoId]);

            const io = getIO();
            // Emitir para a sala do admin (para atualizar a lista)
            io.to('admin_room').emit('nova_sessao', novaSessao);
            // Emitir a primeira mensagem para o usuário
            io.to(`user_${dados.funcionario_usuario_id}`).emit('nova_mensagem', msgData);

            return res.status(201).json({
                mensagem: 'Chat iniciado com sucesso.',
                sessao: novaSessao
            });
        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro ao criar sessão admin:', erro);
            return res.status(500).json({ erro: 'Erro interno.' });
        }
    }
};
