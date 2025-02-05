const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'seu_host',
    database: 'barbershop',
    password: 'postgres',
    port: 5432,
});

client.connect();

exports.handler = async (event) => {
    if (event.httpMethod === 'GET') {
        const { id } = event.queryStringParameters;
        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'ID não fornecido' }),
            };
        }
        
        try {
            const res = await client.query('SELECT * FROM appointments WHERE id = $1', [id]);
            const appointment = res.rows[0];
            
            return {
                statusCode: 200,
                body: JSON.stringify(appointment),
            };
        } catch (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Erro ao consultar o banco de dados' }),
            };
        }
    }

    if (event.httpMethod === 'POST') {
        const data = JSON.parse(event.body);
        const { id, client_name, date, time } = data;

        try {
            const updateQuery = 'UPDATE appointments SET client_name = $1, date = $2, time = $3 WHERE id = $4';
            await client.query(updateQuery, [client_name, date, time, id]);
            
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Agendamento atualizado com sucesso!' }),
            };
        } catch (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Erro ao atualizar o agendamento' }),
            };
        }
    }

    return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método não permitido' }),
    };
};
