const { Pool } = require('pg');

// Criando a pool de conexões
const pool = new Pool({
    connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway',
    ssl: {
        rejectUnauthorized: false,
    },
});

// Função para excluir o agendamento
exports.handler = async (event) => {
    const client = await pool.connect(); // Obtém uma conexão da pool

    try {
        // Verifica se o método é DELETE
        if (event.httpMethod === 'DELETE') {
            // Converte o corpo da requisição
            const data = JSON.parse(event.body);
            const { clientName, date, time } = data;

            if (!clientName || !date || !time) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Nome do cliente, data ou hora não fornecidos.' }),
                };
            }

            // Consulta SQL para excluir o agendamento
            const deleteQuery = `
                DELETE FROM appointments
                WHERE client_name = $1
                AND date = $2
                AND time = $3
                RETURNING *`;
                
            const res = await client.query(deleteQuery, [clientName, date, time]);

            if (res.rows.length === 0) {
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
                    deletedAppointment: res.rows[0],
                }),
            };
        }

        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método não permitido.' }),
        };
    } catch (error) {
        // Caso haja erro na conexão ou na execução da consulta
        console.error('Erro ao conectar ou consultar o banco de dados:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao conectar ou consultar o banco de dados', message: error.message, stack: error.stack }),
        };
    } finally {
        // Libera a conexão de volta para a pool
        client.release();
    }
};
