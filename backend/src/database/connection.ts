// Arquivo: backend/src/database/connection.ts
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let dbInstance: Database | null = null;

// Retorna uma instância única do banco (singleton)
export async function abrirBanco(): Promise<Database> {
    if (dbInstance) return dbInstance;

    dbInstance = await open({
        filename: './processos.sqlite',
        driver: sqlite3.Database
    });

    // Habilitar foreign keys no SQLite
    await dbInstance.run('PRAGMA foreign_keys = ON');

    // Criar todas as tabelas
    await dbInstance.exec(`

        -- Departamentos / Setores da CEAD
        CREATE TABLE IF NOT EXISTS departamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            ativo INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        );

        -- Funcionários com matrícula e perfil
        CREATE TABLE IF NOT EXISTS funcionarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            matricula TEXT NOT NULL UNIQUE,
            nome TEXT NOT NULL,
            email TEXT,
            senha_hash TEXT NOT NULL,
            perfil TEXT NOT NULL DEFAULT 'usuario',
            departamento_id INTEGER,
            ativo INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
        );

        -- Tipos de demanda cadastráveis pelo admin
        CREATE TABLE IF NOT EXISTS tipos_demanda (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            descricao TEXT,
            ativo INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        );

        -- Níveis de prioridade com descrição didática
        CREATE TABLE IF NOT EXISTS prioridades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            descricao TEXT NOT NULL,
            ordem INTEGER NOT NULL,
            cor TEXT NOT NULL
        );

        -- Demandas (substituindo solicitacoes)
        CREATE TABLE IF NOT EXISTS demandas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            protocolo TEXT NOT NULL UNIQUE,
            assunto TEXT NOT NULL,
            descricao TEXT,
            tipo_demanda_id INTEGER NOT NULL,
            prioridade_id INTEGER,
            departamento_origem_id INTEGER,
            departamento_destino_id INTEGER NOT NULL,
            funcionario_solicitante_id INTEGER,
            funcionario_responsavel_id INTEGER,
            status TEXT NOT NULL DEFAULT 'Aberto',
            prazo_desejado TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (tipo_demanda_id) REFERENCES tipos_demanda(id),
            FOREIGN KEY (prioridade_id) REFERENCES prioridades(id),
            FOREIGN KEY (departamento_origem_id) REFERENCES departamentos(id),
            FOREIGN KEY (departamento_destino_id) REFERENCES departamentos(id),
            FOREIGN KEY (funcionario_solicitante_id) REFERENCES funcionarios(id),
            FOREIGN KEY (funcionario_responsavel_id) REFERENCES funcionarios(id)
        );

        -- Log de todas as ações sobre demandas
        CREATE TABLE IF NOT EXISTS log_atividades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            demanda_id INTEGER NOT NULL,
            funcionario_id INTEGER,
            acao TEXT NOT NULL,
            descricao TEXT,
            dados_anteriores TEXT,
            dados_novos TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (demanda_id) REFERENCES demandas(id),
            FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id)
        );
    `);

    return dbInstance;
}