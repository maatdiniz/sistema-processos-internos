import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cead_secret_key_2026';

export interface AuthRequest extends Request {
    usuario?: {
        id: number;
        matricula: string;
        perfil: string;
    };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): any {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ erro: 'Token não fornecido.' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ erro: 'Token mal formatado.' });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.usuario = decoded;
        return next();
    } catch (err) {
        return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
}

export function authAdmin(req: AuthRequest, res: Response, next: NextFunction): any {
    if (!req.usuario || req.usuario.perfil !== 'admin') {
        return res.status(403).json({ erro: 'Acesso negado. Requer privilégios de administrador.' });
    }
    return next();
}
