const { Client } = require('pg');

// Configuração da URL do banco
const connectionString = 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway';

exports.handler = async (event) => {
    // Criando um novo cliente para cada requisição
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false },
    });

    try {
        await client.connect(); // Conectando ao banco

        if (event.httpMethod === 'DELETE') {
            const data = JSON.parse(event.body);
            const { clientName, appointmentDate, appointmentTime } = data;

            if (!clientName || !appointmentDate || !appointmentTime) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Nome do cliente, data ou hora não fornecidos.' }),
                };
            }

            // Consulta SQL para excluir o agendamento
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
        console.error('Erro ao conectar ou consultar o banco de dados:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao conectar ou consultar o banco de dados', message: error.message }),
        };
    } finally {
        await client.end(); // Fecha a conexão corretamente
    }
};
