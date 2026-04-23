// Arquivo: backend/src/controllers/DepartamentoController.ts
import { Request, Response } from 'express';
import { abrirBanco } from '../database/connection';

export const DepartamentoController = {
    // 1. Função para criar um novo departamento
    async criar(req: Request, res: Response) {
        try {
            // Pega o "nome" que vai chegar do Front-end (ou do nosso teste)
            const { nome } = req.body;

            // Validação básica de segurança
            if (!nome) {
                return res.status(400).json({ erro: 'O nome do departamento é obrigatório.' });
            }

            // Abre o banco e executa o comando de INSERIR
            const db = await abrirBanco();
            const resultado = await db.run(
                'INSERT INTO departamentos (nome) VALUES (?)',
                [nome]
            );

            // Devolve uma resposta de Sucesso (201 - Created) com o ID gerado
            return res.status(201).json({
                mensagem: 'Departamento criado com sucesso!',
                departamento: {
                    id: resultado.lastID, // O SQLite retorna o ID que ele acabou de criar
                    nome: nome
                }
            });

        } catch (erro) {
            console.error('Erro ao criar departamento:', erro);
            return res.status(500).json({ erro: 'Erro interno no servidor ao criar o departamento.' });
        }
    },

    // 2. Função de Listar Departamento
    async listar(req: Request, res: Response) {
        try {
            const db = await abrirBanco();
            const departamentos = await db.all('SELECT * FROM departamentos');
            return res.status(200).json(departamentos);
        } catch (erro) {
            return res.status(500).json({ erro: 'Erro ao buscar os departamentos.' });
        }
    }
};
