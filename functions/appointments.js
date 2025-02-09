const { Client } = require('pg'); // Importa o cliente PostgreSQL
const cors = require('cors'); // Para lidar com CORS (Cross-Origin Resource Sharing)

const client = new Client({
    connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway', 
    ssl: {
        rejectUnauthorized: false, 
    }
});

client.connect();

async function getScheduledAppointments() {
    const query = `
        SELECT 
            a.date, 
            a.time, 
            a.client_name, 
            a.whatsapp, 
            a.service 
        FROM appointments a
    `;
    const res = await client.query(query);
    console.log('Agendamentos recuperados:', res.rows); // Log para verificar os agendamentos
    return res.rows;
}

async function createAppointment(clientName, date, time, whatsapp, services) {
    const queryCheck = 'SELECT 1 FROM appointments WHERE date = $1 AND time = $2';
    const checkResult = await client.query(queryCheck, [date, time]);

    console.log('Resultado da verificação do agendamento:', checkResult.rows); // Log da verificação

    if (checkResult.rows.length > 0) {
        return {
            success: false,
            error: 'O horário já está reservado!',
        };
    }

    const formattedTime = time + ':00'; // Adiciona segundos ao horário
    const query = 'INSERT INTO appointments (client_name, date, time, whatsapp, service) VALUES ($1, $2, $3, $4, $5) RETURNING id';
    const result = await client.query(query, [clientName, date, formattedTime, whatsapp, services]);

    console.log('Resultado da inserção no banco de dados:', result); // Log da inserção

    if (result.rowCount > 0) {
        return {
            success: true,
            message: 'Reserva realizada com sucesso!',
            client_name: clientName,
            date: date,
            time: formattedTime,
            whatsapp: whatsapp,
            service: services,
        };
    } else {
        return {
            success: false,
            error: 'Erro ao salvar a reserva no banco de dados.',
        };
    }
}

exports.handler = async (event) => {
    const allowedOrigins = ['http://localhost:5501', 'https://franciscobarbearia.netlify.app', 'http://localhost:8888'];
    const origin = event.headers.origin;

    const headers = {
        'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'null',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers,
        };
    }

    if (event.httpMethod === 'GET') {
        try {
            const appointments = await getScheduledAppointments();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(appointments),
            };
        } catch (error) {
            console.error('Erro ao obter agendamentos:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Erro ao obter agendamentos.',
                    details: error.message
                }),
            };
        }
    }

    if (event.httpMethod === 'POST' && event.headers['content-type'] === 'application/json') {
        try {
            const data = JSON.parse(event.body);
            console.log('Dados recebidos no POST:', data); // Log dos dados recebidos

            if (!data.client_name || !data.date || !data.time || !data.whatsapp || !data.services) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Dados inválidos ou incompletos!' }),
                };
            }

            const { client_name, date, time, whatsapp, services } = data;
            const result = await createAppointment(client_name, date, time, whatsapp, services);

            return {
                statusCode: result.success ? 200 : 400,
                headers,
                body: JSON.stringify(result),
            };
        } catch (error) {
            console.error('Erro ao processar a reserva:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Erro ao processar a reserva.' }),
            };
        }
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método não permitido!' }),
    };
};
