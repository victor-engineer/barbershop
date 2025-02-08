const { Client } = require('pg');

// Configuração da conexão com o banco de dados PostgreSQL
const client = new Client({
    connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway',
    ssl: {
        rejectUnauthorized: false,  // Necessário para conexões SSL
    }
});

exports.handler = async (event) => {
    try {
        // Conectar ao banco de dados
        await client.connect();

        console.log("Recebendo evento:", event); // Log para ver o conteúdo do evento

        // Verifica se o método é DELETE
        if (event.httpMethod === 'DELETE') {
            const data = JSON.parse(event.body); // Converte o corpo da requisição
            const { clientName, date, time } = data;  // Obtém os dados

            console.log("Dados recebidos:", data);  // Log para ver os dados recebidos

            if (!clientName || !date || !time) {
                console.warn("Faltando dados:", { clientName, date, time });
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
                
            const res = await client.query(deleteQuery, [clientName, date, time]);

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
            body: JSON.stringify({ error: 'Erro ao conectar ou consultar o banco de dados', message: error.message, stack: error.stack }),
        };
    } finally {
        // Fecha a conexão
        await client.end();
    }
};
