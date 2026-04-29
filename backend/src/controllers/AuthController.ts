import { Request, Response } from 'express';
import { abrirBanco } from '../database/connection';
import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cead_secret_key_2026';

function hashSenha(senha: string): string {
    return crypto.createHash('sha256').update(senha).digest('hex');
}

const loginSchema = z.object({
    matricula: z.string().min(1, 'Matrícula é obrigatória.'),
    senha: z.string().min(1, 'Senha é obrigatória.')
});

export const AuthController = {
    async login(req: Request, res: Response): Promise<any> {
        try {
            const { matricula, senha } = loginSchema.parse(req.body);
            const db = await abrirBanco();

            const funcionario = await db.get(
                'SELECT id, matricula, nome, email, perfil, ativo, departamento_id, senha_hash FROM funcionarios WHERE matricula = ?',
                [matricula]
            );

            if (!funcionario) {
                return res.status(401).json({ erro: 'Credenciais inválidas.' });
            }

            if (funcionario.ativo === 0) {
                return res.status(403).json({ erro: 'Usuário inativo. Procure a administração.' });
            }

            const hashEnviada = hashSenha(senha);
            if (funcionario.senha_hash !== hashEnviada) {
                return res.status(401).json({ erro: 'Credenciais inválidas.' });
            }

            // Gerar token
            const token = jwt.sign(
                { id: funcionario.id, matricula: funcionario.matricula, perfil: funcionario.perfil },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Remover o hash da senha antes de retornar os dados
            delete funcionario.senha_hash;

            return res.json({
                mensagem: 'Login realizado com sucesso.',
                token,
                usuario: funcionario
            });

        } catch (erro) {
            if (erro instanceof z.ZodError) {
                return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erro.errors.map(e => e.message) });
            }
            console.error('Erro no login:', erro);
            return res.status(500).json({ erro: 'Erro interno ao realizar login.' });
        }
    }
};
