const { Pool } = require('pg');

// Criando a pool de conexões
const pool = new Pool({
    connectionString: 'postgresql://postgres:UMCdlnDVxeJwdWCIDwLbBQLihuXAwILY@shortline.proxy.rlwy.net:18696/railway',
    ssl: { rejectUnauthorized: false },
});

// Função para excluir o agendamento
exports.handler = async (event) => {
    const client = await pool.connect(); // Obtém uma conexão da pool

    try {
        // Verifica se o método é DELETE
        if (event.httpMethod !== 'DELETE') {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Método não permitido.' }),
            };
        }

        // Verifica se o corpo da requisição está presente
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Nenhum dado fornecido.' }),
            };
        }

        // Tenta fazer o parse do JSON
        let data;
        try {
            data = JSON.parse(event.body);
        } catch (error) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Formato JSON inválido.' }),
            };
        }

        const { clientName, date, time, whatsapp, service } = data;

        // Verifica se os campos obrigatórios estão presentes
        if (!clientName || !date || !time) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Nome do cliente, data e hora são obrigatórios.' }),
            };
        }

        // Construindo a query de exclusão dinamicamente
        let deleteQuery = `DELETE FROM appointments WHERE client_name = $1 AND date = $2 AND time = $3`;
        const queryParams = [clientName, date, time];

        if (whatsapp) {
            deleteQuery += ` AND whatsapp = $4`;
            queryParams.push(whatsapp);
        }

        if (service) {
            deleteQuery += ` AND service = $5`;
            queryParams.push(service);
        }

        // Executa a consulta de exclusão
        const res = await client.query(deleteQuery, queryParams);

        // Verifica se o agendamento foi encontrado e excluído
        if (res.rowCount === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Agendamento não encontrado.' }),
            };
        }

        // Retorna a resposta de sucesso
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Agendamento excluído com sucesso!',
            }),
        };

    } catch (error) {
        // Caso haja erro na conexão ou na execução da consulta
        console.error('Erro ao conectar ou consultar o banco de dados:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao conectar ou consultar o banco de dados', message: error.message }),
        };
    } finally {
        // Libera a conexão de volta para a pool
        client.release();
    }
};
