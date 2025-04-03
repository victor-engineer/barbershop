const { Client } = require('pg');

console.log('Iniciando conexão com o banco de dados...');
const client = new Client({
    connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway',
    ssl: { rejectUnauthorized: false }
});

client.connect()
    .then(() => console.log('Conectado ao banco de dados com sucesso!'))
    .catch(err => console.error('Erro ao conectar ao banco de dados:', err));

async function getScheduledAppointments() {
    console.log('Buscando agendamentos no banco de dados...');
    const query = `SELECT date, time, client_name, whatsapp, service FROM appointments`;
    const res = await client.query(query);
    return res.rows;
}

async function createAppointment(clientName, date, time, whatsapp, service) {
    console.log('Verificando disponibilidade do horário...');
    const queryCheck = 'SELECT 1 FROM appointments WHERE date = $1 AND time::text LIKE $2';
    
    try {
        const checkResult = await client.query(queryCheck, [date, time + '%']);
        if (checkResult.rows.length > 0) {
            return { success: false, error: 'O horário já está reservado!' };
        }

        const formattedTime = time.length === 5 ? time + ':00' : time;
        console.log('Inserindo novo agendamento...');
        const query = 'INSERT INTO appointments (client_name, date, time, whatsapp, service) VALUES ($1, $2, $3, $4, $5) RETURNING id';
        const result = await client.query(query, [clientName, date, formattedTime, whatsapp, service]);

        if (result.rowCount > 0) {
            return { success: true, message: 'Reserva realizada com sucesso!', clientName, date, time: formattedTime, whatsapp, service };
        } else {
            return { success: false, error: 'Erro ao salvar a reserva.' };
        }
    } catch (error) {
        return { success: false, error: 'Erro ao processar a reserva.', details: error.message };
    }
}

async function deleteAppointment(clientName, date, time) {
    console.log(`Excluindo agendamento para ${clientName} no dia ${date} às ${time}`);
    const queryDelete = 'DELETE FROM appointments WHERE client_name = $1 AND date = $2 AND time = $3 RETURNING id';
    
    try {
        const result = await client.query(queryDelete, [clientName, date, time]);
        if (result.rowCount > 0) {
            return { success: true, message: 'Agendamento excluído com sucesso.' };
        } else {
            return { success: false, error: 'Nenhum agendamento encontrado para excluir.' };
        }
    } catch (error) {
        return { success: false, error: 'Erro ao excluir o agendamento.', details: error.message };
    }
}

exports.handler = async (event) => {
    console.log('Requisição recebida:', event);

    const allowedOrigins = ['http://localhost:5501', 'https://franciscobarbearia.netlify.app', 'http://localhost:8888'];
    const origin = event.headers.origin;
    const headers = {
        'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'null',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }

    if (event.httpMethod === 'GET') {
        try {
            const appointments = await getScheduledAppointments();
            return { statusCode: 200, headers, body: JSON.stringify(appointments) };
        } catch (error) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erro ao obter agendamentos.', details: error.message }) };
        }
    }

    if (event.httpMethod === 'POST' && event.headers['content-type']?.includes('application/json')) {
        try {
            const data = JSON.parse(event.body);

            const formattedData = {
                client_name: data.client_name?.trim() || '',
                date: data.date?.trim() || '',
                time: data.time?.trim() || '',
                whatsapp: data.whatsapp?.trim() || '',
                service: data.service?.trim() || ''
            };

            const requiredFields = ['client_name', 'date', 'time', 'whatsapp', 'service'];
            for (const field of requiredFields) {
                if (!formattedData[field]) {
                    return { 
                        statusCode: 400, 
                        headers, 
                        body: JSON.stringify({ 
                            error: `Campo inválido ou ausente: ${field}`, 
                            receivedValue: data[field] 
                        }) 
                    };
                }
            }

            const queryCheckClient = 'SELECT * FROM appointments WHERE client_name = $1 AND date = $2';
            const existingAppointments = await client.query(queryCheckClient, [formattedData.client_name, formattedData.date]);

            if (existingAppointments.rows.length > 0) {
                for (const appointment of existingAppointments.rows) {
                    await deleteAppointment(appointment.client_name, appointment.date, appointment.time);
                }
            }

            const result = await createAppointment(
                formattedData.client_name,
                formattedData.date,
                formattedData.time,
                formattedData.whatsapp,
                formattedData.service
            );

            return { statusCode: result.success ? 200 : 400, headers, body: JSON.stringify(result) };
        } catch (error) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erro ao processar a reserva.', details: error.message }) };
        }
    }

    if (event.httpMethod === 'DELETE') {
        try {
            const { client_name, date, time } = event.queryStringParameters || {};
            
            if (!client_name || !date || !time) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Parâmetros ausentes para cancelamento.' })
                };
            }

            const result = await deleteAppointment(client_name, date, time);

            return {
                statusCode: result.success ? 200 : 400,
                headers,
                body: JSON.stringify(result)
            };
        } catch (error) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erro ao processar o cancelamento.' }) };
        }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido!' }) };
};
