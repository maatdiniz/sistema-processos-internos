// Arquivo: backend/src/controllers/FuncionarioController.ts
import { Request, Response } from 'express';
import { abrirBanco } from '../database/connection';
import { z } from 'zod';
import crypto from 'crypto';

function hashSenha(senha: string): string {
    return crypto.createHash('sha256').update(senha).digest('hex');
}

const funcionarioSchema = z.object({
    matricula: z.string().min(1, 'A matrícula é obrigatória.').max(50),
    nome: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres.').max(150),
    email: z.string().email('E-mail inválido.').optional().or(z.literal('')),
    senha: z.string().min(4, 'A senha deve ter no mínimo 4 caracteres.').optional(),
    perfil: z.enum(['admin', 'usuario'], { message: 'Perfil deve ser "admin" ou "usuario".' }).default('usuario'),
    departamento_id: z.number().int().positive('Departamento inválido.')
});

export const FuncionarioController = {

    async listar(_req: Request, res: Response): Promise<any> {
        try {
            const db = await abrirBanco();
            const funcionarios = await db.all(`
                SELECT f.id, f.matricula, f.nome, f.email, f.perfil, f.departamento_id, f.ativo, f.created_at,
                       d.nome as departamento_nome
                FROM funcionarios f
                LEFT JOIN departamentos d ON f.departamento_id = d.id
                ORDER BY f.nome
            `);
            return res.json(funcionarios);
        } catch (erro) {
            console.error('Erro ao listar funcionários:', erro);
            return res.status(500).json({ erro: 'Erro interno ao buscar funcionários.' });
        }
    },

    async listarPorDepartamento(req: Request, res: Response): Promise<any> {
        try {
            const { departamento_id } = req.params;
            const db = await abrirBanco();
            const funcionarios = await db.all(
                'SELECT id, nome, matricula FROM funcionarios WHERE departamento_id = ? AND ativo = 1 ORDER BY nome',
                [departamento_id]
            );
            return res.json(funcionarios);
        } catch (erro) {
            console.error('Erro ao listar funcionários por departamento:', erro);
            return res.status(500).json({ erro: 'Erro interno ao buscar funcionários.' });
        }
    },

    async criar(req: Request, res: Response): Promise<any> {
        try {
            const dados = funcionarioSchema.parse(req.body);
            const db = await abrirBanco();

            // Verificar matrícula duplicada
            const existente = await db.get('SELECT id FROM funcionarios WHERE matricula = ?', [dados.matricula]);
            if (existente) {
                return res.status(409).json({ erro: 'Já existe um funcionário com esta matrícula.' });
            }

            // Verificar se o departamento existe
            const depto = await db.get('SELECT id FROM departamentos WHERE id = ?', [dados.departamento_id]);
            if (!depto) {
                return res.status(400).json({ erro: 'Departamento informado não existe.' });
            }

            // Gerar senha aleatória de 6 caracteres (letras e números) se não for informada
            let senhaGerada = dados.senha;
            if (!senhaGerada) {
                senhaGerada = Math.random().toString(36).substring(2, 8);
            }
            const senhaHash = hashSenha(senhaGerada);

            const resultado = await db.run(
                'INSERT INTO funcionarios (matricula, nome, email, senha_hash, perfil, departamento_id) VALUES (?, ?, ?, ?, ?, ?)',
                [dados.matricula, dados.nome, dados.email || null, senhaHash, dados.perfil, dados.departamento_id]
            );

            return res.status(201).json({
                mensagem: 'Funcionário cadastrado com sucesso!',
                funcionario: { id: resultado.lastID, matricula: dados.matricula, nome: dados.nome },
                senha_gerada: dados.senha ? undefined : senhaGerada // Retorna apenas se foi gerada pelo sistema
            });
        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro ao criar funcionário:', erro);
            return res.status(500).json({ erro: 'Erro interno ao cadastrar funcionário.' });
        }
    },

    async atualizar(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const dados = funcionarioSchema.parse(req.body);
            const db = await abrirBanco();

            const existente = await db.get('SELECT id FROM funcionarios WHERE id = ?', [id]);
            if (!existente) {
                return res.status(404).json({ erro: 'Funcionário não encontrado.' });
            }

            // Verificar matrícula duplicada (excluindo o próprio)
            const duplicado = await db.get('SELECT id FROM funcionarios WHERE matricula = ? AND id != ?', [dados.matricula, id]);
            if (duplicado) {
                return res.status(409).json({ erro: 'Já existe outro funcionário com esta matrícula.' });
            }

            // Se senha foi enviada, atualiza. Senão, mantém a atual.
            if (dados.senha) {
                const senhaHash = hashSenha(dados.senha);
                await db.run(
                    'UPDATE funcionarios SET matricula = ?, nome = ?, email = ?, senha_hash = ?, perfil = ?, departamento_id = ? WHERE id = ?',
                    [dados.matricula, dados.nome, dados.email || null, senhaHash, dados.perfil, dados.departamento_id, id]
                );
            } else {
                await db.run(
                    'UPDATE funcionarios SET matricula = ?, nome = ?, email = ?, perfil = ?, departamento_id = ? WHERE id = ?',
                    [dados.matricula, dados.nome, dados.email || null, dados.perfil, dados.departamento_id, id]
                );
            }

            return res.json({ mensagem: 'Funcionário atualizado com sucesso!' });
        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro ao atualizar funcionário:', erro);
            return res.status(500).json({ erro: 'Erro interno ao atualizar funcionário.' });
        }
    },

    async alternarAtivo(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const db = await abrirBanco();

            const func = await db.get('SELECT id, ativo FROM funcionarios WHERE id = ?', [id]);
            if (!func) {
                return res.status(404).json({ erro: 'Funcionário não encontrado.' });
            }

            const novoStatus = func.ativo === 1 ? 0 : 1;
            await db.run('UPDATE funcionarios SET ativo = ? WHERE id = ?', [novoStatus, id]);
            return res.json({ mensagem: `Funcionário ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`, ativo: novoStatus });
        } catch (erro) {
            console.error('Erro ao alternar status:', erro);
            return res.status(500).json({ erro: 'Erro interno ao alterar status.' });
        }
    }
};
