// Arquivo: backend/src/database/connection.ts
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Função responsável por abrir a conexão com o banco
export async function abrirBanco() {
    const db = await open({
        filename: './processos.sqlite', // O arquivo físico que será criado
        driver: sqlite3.Database
    });

    // Criar as tabelas caso elas ainda não existam no arquivo
    await db.exec(`
    CREATE TABLE IF NOT EXISTS departamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS solicitacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      assunto TEXT NOT NULL,
      texto_descricao TEXT NOT NULL,
      departamento_id INTEGER,
      usuario_id INTEGER,
      caminho_anexo TEXT,
      status TEXT DEFAULT 'Aberto',
      FOREIGN KEY (departamento_id) REFERENCES departamentos (id)
    );
  `);

    return db;
}