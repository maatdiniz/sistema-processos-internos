import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { abrirBanco } from './database/connection';

const JWT_SECRET = process.env.JWT_SECRET || 'cead_secret_key_2026';

let io: SocketIOServer;

interface AuthSocket extends Socket {
    usuario?: {
        id: number;
        matricula: string;
        perfil: string;
    };
}

export function initSocket(server: HttpServer) {
    io = new SocketIOServer(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    // Middleware de autenticação
    io.use((socket: AuthSocket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Autenticação necessária'));
        }
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            socket.usuario = decoded;
            next();
        } catch (err) {
            next(new Error('Token inválido'));
        }
    });

    io.on('connection', (socket: AuthSocket) => {
        console.log(`[Socket] Usuário conectado: ${socket.usuario?.matricula}`);

        // O usuário se junta a uma sala pessoal (para histórico e sessões contínuas)
        if (socket.usuario?.id) {
            socket.join(`user_${socket.usuario.id}`);
            
            // Se for admin, junta na sala de admins para notificações globais de chat
            if (socket.usuario.perfil === 'admin') {
                socket.join('admin_room');
            }
        }

        socket.on('join_chat', (sessaoId: number) => {
            socket.join(`chat_${sessaoId}`);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Usuário desconectado: ${socket.usuario?.matricula}`);
        });
    });
}

export function getIO(): SocketIOServer {
    if (!io) throw new Error('Socket.io não foi inicializado');
    return io;
}
