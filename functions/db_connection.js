const { Client } = require('pg');

// Configuração da conexão com o banco de dados PostgreSQL no Railway
const client = new Client({
    connectionString: 'postgresql://postgres:UMCdlnDVxeJwdWCIDwLbBQLihuXAwILY@shortline.proxy.rlwy.net:18696/railway', // URL de conexão fornecida pelo Railway
    ssl: {
        rejectUnauthorized: false,  // Necessário para conexões SSL
    }
});

exports.handler = async (event) => {
    try {
        // Conecta ao banco de dados
        await client.connect();

        // Exemplo de consulta: selecionando todos os agendamentos
        const res = await client.query('SELECT * FROM appointments');

        // Fecha a conexão
        await client.end();

        // Retorna os dados no formato JSON
        return {
            statusCode: 200,
            body: JSON.stringify(res.rows),
        };
    } catch (error) {
        // Caso haja erro na conexão ou na execução da consulta
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao conectar ou consultar o banco de dados', message: error.message }),
        };
    }
};
