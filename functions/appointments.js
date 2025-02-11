const { Client } = require('pg'); // Importa o cliente PostgreSQL

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
    const query = `
        SELECT date, time, client_name, whatsapp, service FROM appointments
    `;
    const res = await client.query(query);
    console.log('Agendamentos recuperados:', res.rows);
    return res.rows;
}

async function createAppointment(clientName, date, time, whatsapp, service) {
    console.log('Verificando disponibilidade do horário...');
    const queryCheck = 'SELECT 1 FROM appointments WHERE date = $1 AND time = $2';
    const checkResult = await client.query(queryCheck, [date, time]);

    if (checkResult.rows.length > 0) {
        console.log('Horário já reservado!');
        return { success: false, error: 'O horário já está reservado!' };
    }

    const formattedTime = time + ':00';
    console.log('Inserindo novo agendamento no banco de dados...');
    const query = 'INSERT INTO appointments (client_name, date, time, whatsapp, service) VALUES ($1, $2, $3, $4, $5) RETURNING id';
    const result = await client.query(query, [clientName, date, formattedTime, whatsapp, service]);

    console.log('Resultado da inserção:', result);

    if (result.rowCount > 0) {
        console.log('Reserva realizada com sucesso!');
        return { success: true, message: 'Reserva realizada com sucesso!', clientName, date, time: formattedTime, whatsapp, service };
    } else {
        console.log('Erro ao salvar a reserva.');
        return { success: false, error: 'Erro ao salvar a reserva no banco.' };
    }
}

exports.handler = async (event) => {
    console.log('Requisição recebida:', event);

    const allowedOrigins = ['http://localhost:5501', 'https://franciscobarbearia.netlify.app', 'http://localhost:8888'];
    const origin = event.headers.origin;
    const headers = {
        'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'null',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        console.log('Respondendo a uma solicitação OPTIONS');
        return { statusCode: 204, headers };
    }

    if (event.httpMethod === 'GET') {
        try {
            console.log('Obtendo agendamentos...');
            const appointments = await getScheduledAppointments();
            return { statusCode: 200, headers, body: JSON.stringify(appointments) };
        } catch (error) {
            console.error('Erro ao obter agendamentos:', error);
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erro ao obter agendamentos.', details: error.message }) };
        }
    }

    if (event.httpMethod === 'POST' && event.headers['content-type']?.includes('application/json')) {
        try {
            console.log('Requisição POST recebida. Processando reserva...');
            console.log('Corpo da requisição recebido:', event.body);

            const data = JSON.parse(event.body);
            console.log('Campos existentes no objeto recebido:', Object.keys(data));

            // Normaliza os campos esperados
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
                    console.log(`Campo inválido ou ausente: ${field}, Valor recebido: ${JSON.stringify(data[field])}`);
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

            const result = await createAppointment(
                formattedData.client_name,
                formattedData.date,
                formattedData.time,
                formattedData.whatsapp,
                formattedData.service
            );

            console.log('Resultado da criação:', result);
            return { statusCode: result.success ? 200 : 400, headers, body: JSON.stringify(result) };
        } catch (error) {
            console.error('Erro ao processar a reserva:', error);
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erro ao processar a reserva.' }) };
        }
    }

    console.log('Método não permitido:', event.httpMethod);
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido!' }) };
};
