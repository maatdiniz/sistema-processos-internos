import express from 'express';
import cors from 'cors';
import { abrirBanco } from './database/connection';
import rotasDepartamentos from './routes/departamentos.routes'; // <-- IMPORTAMOS A ROTA AQUI
import rotasSolicitacoes from './routes/solicitacoes.routes';

const app = express();

app.use(cors()); // Liberar o CORS antes de tudo
app.use(express.json()); // Permite que o servidor entenda informações enviadas no formato JSON

// <-- AVISAMOS O SERVIDOR PARA USAR A ROTA AQUI
// Qualquer requisição que comece com /departamentos vai para aquele arquivo
app.use('/departamentos', rotasDepartamentos);
app.use('/solicitacoes', rotasSolicitacoes);

const PORT = 3000;

// Inicia o servidor na porta definida
app.listen(PORT, async () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);

    try {
        await abrirBanco(); // Chama a função que criamos no Passo 2
        console.log('📦 Banco de dados SQLite inicializado com sucesso!');
    } catch (erro) {
        console.error('❌ Erro ao inicializar o banco:', erro);
    }
});