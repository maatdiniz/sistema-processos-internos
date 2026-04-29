// Arquivo: backend/src/database/seed.ts
import crypto from 'crypto';
import { abrirBanco } from './connection';

// Hash simples com SHA-256 (será substituído por bcrypt na Fase 3)
function hashSenha(senha: string): string {
    return crypto.createHash('sha256').update(senha).digest('hex');
}

export async function executarSeed() {
    const db = await abrirBanco();

    // ── Departamentos da CEAD ──
    const deptos = await db.get('SELECT COUNT(*) as total FROM departamentos');
    if (deptos.total === 0) {
        const departamentos = [
            'Coordenação Geral',
            'Coordenação Pedagógica',
            'Secretaria',
            'TI',
            'Financeiro',
            'Coordenadores de Curso',
            'Professores',
            'Tutores',
            'Recepção / Atendimento'
        ];

        for (const nome of departamentos) {
            await db.run('INSERT INTO departamentos (nome) VALUES (?)', [nome]);
        }
        console.log(`   ✓ ${departamentos.length} departamentos inseridos`);
    }

    // ── Prioridades com descrição didática ──
    const prios = await db.get('SELECT COUNT(*) as total FROM prioridades');
    if (prios.total === 0) {
        const prioridades = [
            {
                nome: 'Baixa',
                descricao: 'Demandas informativas ou de rotina sem urgência. O prazo é flexível e pode ser atendido conforme a disponibilidade da equipe.',
                ordem: 1,
                cor: '#64748B'
            },
            {
                nome: 'Normal',
                descricao: 'Operações do dia a dia que seguem o fluxo padrão de trabalho. Atendimento dentro do prazo regular.',
                ordem: 2,
                cor: '#3B82F6'
            },
            {
                nome: 'Alta',
                descricao: 'Impacta atividades em andamento ou compromete prazos próximos. Precisa de atenção prioritária nos próximos dias.',
                ordem: 3,
                cor: '#F59E0B'
            },
            {
                nome: 'Urgente',
                descricao: 'Bloqueia processos ou impede pessoas de trabalhar. Requer ação imediata. Use com responsabilidade — uma operação simples NÃO é urgente.',
                ordem: 4,
                cor: '#EF4444'
            },
            {
                nome: 'Crítica',
                descricao: 'Impacto institucional grave. Paralisa operação da CEAD ou afeta alunos em massa. Escalar para a Coordenação Geral imediatamente.',
                ordem: 5,
                cor: '#991B1B'
            }
        ];

        for (const p of prioridades) {
            await db.run(
                'INSERT INTO prioridades (nome, descricao, ordem, cor) VALUES (?, ?, ?, ?)',
                [p.nome, p.descricao, p.ordem, p.cor]
            );
        }
        console.log(`   ✓ ${prioridades.length} prioridades inseridas`);
    }

    // ── Tipos de Demanda ──
    const tipos = await db.get('SELECT COUNT(*) as total FROM tipos_demanda');
    if (tipos.total === 0) {
        const tiposDemanda = [
            { nome: 'Criação de Disciplinas', descricao: 'Solicitação para criação de novas disciplinas no ambiente virtual.' },
            { nome: 'Inserir Avaliações no Avalia', descricao: 'Inserção de avaliações no sistema Avalia.' },
            { nome: 'Envio do Termo de Concessão de Bolsa (PROUNI)', descricao: 'Ingressantes PROUNI solicitando o envio do Termo de Concessão de Bolsa.' },
            { nome: 'Atualização da Planilha de Ingressantes', descricao: 'Atualização dos dados na planilha de controle de ingressantes.' },
            { nome: 'Envio de Mala Direta', descricao: 'Solicitação de envio de comunicação em massa para alunos ou colaboradores.' },
            { nome: 'Correção de Dado Cadastral', descricao: 'Correção de informações cadastrais de alunos ou colaboradores.' },
            { nome: 'Criação de Exames', descricao: 'Solicitação para criação de exames e provas no sistema.' },
            { nome: 'Inserção de Alunos no Teams', descricao: 'Inserção de alunos em turmas e canais do Microsoft Teams.' },
            { nome: 'Ajuste Financeiro', descricao: 'Solicitação de ajuste em valores, boletos ou situação financeira de alunos.' },
            { nome: 'Abertura de SAC', descricao: 'Registro de atendimento ao aluno via SAC.' }
        ];

        for (const t of tiposDemanda) {
            await db.run(
                'INSERT INTO tipos_demanda (nome, descricao) VALUES (?, ?)',
                [t.nome, t.descricao]
            );
        }
        console.log(`   ✓ ${tiposDemanda.length} tipos de demanda inseridos`);
    }

    // ── Usuário Administrador padrão ──
    const admins = await db.get('SELECT COUNT(*) as total FROM funcionarios');
    if (admins.total === 0) {
        await db.run(
            'INSERT INTO funcionarios (matricula, nome, email, senha_hash, perfil, departamento_id) VALUES (?, ?, ?, ?, ?, ?)',
            ['admin', 'Administrador', 'admin@cead.edu.br', hashSenha('admin123'), 'admin', 1]
        );
        console.log('   ✓ Usuário administrador padrão criado (matrícula: admin, senha: admin123)');
    }

    console.log('🌱 Seed concluído!');
}
