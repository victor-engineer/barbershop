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
            // Aqui estamos utilizando o corpo da requisição para pegar os dados do agendamento
            const data = JSON.parse(event.body);  // Converte o corpo da requisição em JSON
            const { clientName, appointmentDate, appointmentTime } = data;  // Obtém os dados do corpo

            if (!clientName || !appointmentDate || !appointmentTime) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Nome do cliente, data ou hora não fornecidos.' }),
                };
            }

            // Consulta SQL para excluir o agendamento com base no cliente, data e hora
            const deleteQuery = `
                DELETE FROM appointments 
                WHERE client_name = $1 
                AND appointment_date = $2 
                AND appointment_time = $3 
                RETURNING *`;
                
            const res = await client.query(deleteQuery, [clientName, appointmentDate, appointmentTime]);

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
        // Fecha a conexão
        await client.end();
    }
};
