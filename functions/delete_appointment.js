const { Client } = require('pg');

// Configuração da conexão com o banco de dados PostgreSQL no Railway
const client = new Client({
    connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway', // Usando a variável de ambiente para a URL do banco
    ssl: {
        rejectUnauthorized: false,  // Necessário para conexões SSL
    }
});

exports.handler = async (event) => {
    try {
        // Conecta ao banco de dados
        await client.connect();

        // Verifica se o método é DELETE
        if (event.httpMethod === 'DELETE') {
            // Aqui estamos utilizando o query string para pegar o ID
            const id = event.queryStringParameters?.id; // Usando optional chaining para prevenir erro se não houver id

            if (!id) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'ID do agendamento não fornecido.' }),
                };
            }

            // Consulta SQL para excluir o agendamento
            const deleteQuery = 'DELETE FROM appointments WHERE id = $1 RETURNING *';
            const res = await client.query(deleteQuery, [id]);

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
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao conectar ou consultar o banco de dados', message: error.message }),
        };
    } finally {
        // Fecha a conexão
        await client.end();
    }
};
