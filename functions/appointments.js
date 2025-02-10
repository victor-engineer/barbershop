const { Client } = require('pg'); // Importa o cliente PostgreSQL

console.log('Iniciando conexão com o banco de dados...');
const client = new Client({
    connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway', 
    ssl: {
        rejectUnauthorized: false, 
    }
});

client.connect()
    .then(() => console.log('Conectado ao banco de dados com sucesso!'))
    .catch(err => console.error('Erro ao conectar ao banco de dados:', err));

async function getScheduledAppointments() {
    console.log('Buscando agendamentos no banco de dados...');
    const query = `
        SELECT 
            a.date, 
            a.time, 
            a.client_name, 
            a.whatsapp,
            a.service  -- Incluindo o campo 'service'
        FROM appointments a
    `;
    const res = await client.query(query);
    console.log('Agendamentos recuperados:', res.rows); // Log para verificar os agendamentos
    return res.rows;
}

async function createAppointment(clientName, date, time, whatsapp, service) {
    console.log('Verificando disponibilidade do horário...');
    const queryCheck = 'SELECT 1 FROM appointments WHERE date = $1 AND time = $2';
    const checkResult = await client.query(queryCheck, [date, time]);
    console.log('Resultado da verificação do agendamento:', checkResult.rows); // Log da verificação

    if (checkResult.rows.length > 0) {
        console.log('Horário já está reservado!');
        return {
            success: false,
            error: 'O horário já está reservado!',
        };
    }

    const formattedTime = time + ':00'; // Adiciona segundos ao horário
    console.log('Inserindo novo agendamento no banco de dados...');
    const query = 'INSERT INTO appointments (client_name, date, time, whatsapp, service) VALUES ($1, $2, $3, $4, $5) RETURNING id';  // Atualizado
    const result = await client.query(query, [clientName, date, formattedTime, whatsapp, service]);  // Atualizado

    console.log('Resultado da inserção no banco de dados:', result); // Log da inserção

    if (result.rowCount > 0) {
        console.log('Reserva realizada com sucesso!');
        return {
            success: true,
            message: 'Reserva realizada com sucesso!',
            client_name: clientName,
            date: date,
            time: formattedTime,
            whatsapp: whatsapp,
            service: service,  // Incluindo o 'service' no retorno
        };
    } else {
        console.log('Erro ao salvar a reserva no banco de dados.');
        return {
            success: false,
            error: 'Erro ao salvar a reserva no banco de dados.',
        };
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
        return {
            statusCode: 204,
            headers,
        };
    }

    if (event.httpMethod === 'GET') {
        try {
            console.log('Requisição GET recebida. Obtendo agendamentos...');
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
            console.log('Requisição POST recebida. Processando reserva...');
            const data = JSON.parse(event.body);
            console.log('Dados recebidos no POST:', data); // Log dos dados recebidos

            // Log para verificar os tipos de dados esperados
            console.log('Tipo de dados esperado:');
            console.log('client_name:', typeof data.client_name);
            console.log('date:', typeof data.date);
            console.log('time:', typeof data.time);
            console.log('whatsapp:', typeof data.whatsapp);
            console.log('service:', typeof data.service);

            // Validação dos dados recebidos
            if (typeof data.client_name !== 'string' || !data.client_name.trim() ||
            typeof data.date !== 'string' || !data.date.trim() ||
            typeof data.time !== 'string' || !data.time.trim() ||
            typeof data.whatsapp !== 'string' || !data.whatsapp.trim() ||
            typeof data.service !== 'string' || !data.service.trim()) {
            console.log('Dados inválidos ou incompletos!');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Dados inválidos ou incompletos!' }),
            };
        }
            const { client_name, date, time, whatsapp, service } = data;  // Incluindo 'service'
            const result = await createAppointment(client_name, date, time, whatsapp, service);  // Passando 'service'
            console.log('Resultado da criação do agendamento:', result);

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

    console.log('Método não permitido:', event.httpMethod);
    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método não permitido!' }),
    };
};
