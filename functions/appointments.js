const { Client } = require('pg'); // Cliente do PostgreSQL
const cors = require('cors'); // Para lidar com CORS (Cross-Origin Resource Sharing)

// Configuração do banco de dados (Railway)
const client = new Client({
    connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway', // Substitua pela sua conexão do Railway
    ssl: { rejectUnauthorized: false } // Necessário para Railway
});

client.connect().catch(err => console.error('Erro ao conectar ao banco:', err)); // Conecta ao banco

// Função para obter os agendamentos
async function getScheduledAppointments() {
    try {
        const res = await client.query('SELECT date, time, client_name FROM appointments');
        return res.rows;
    } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        throw new Error('Erro ao buscar agendamentos');
    }
}

// Função para inserir um novo agendamento
async function createAppointment(clientName, date, time) {
    try {
        const queryCheck = 'SELECT 1 FROM appointments WHERE date = $1 AND time = $2';
        const checkResult = await client.query(queryCheck, [date, time]);

        if (checkResult.rows.length > 0) {
            return { success: false, error: 'O horário já está reservado!' };
        }

        const formattedTime = time + ':00'; // Formata o horário
        const query = 'INSERT INTO appointments (client_name, date, time) VALUES ($1, $2, $3)';
        const result = await client.query(query, [clientName, date, formattedTime]);

        if (result.rowCount > 0) {
            return { success: true, message: 'Reserva realizada com sucesso!', client_name: clientName, date, time: formattedTime };
        }
        return { success: false, error: 'Erro ao salvar a reserva no banco de dados.' };
    } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        throw new Error('Erro ao criar agendamento');
    }
}

// Função handler da Netlify
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
        return { statusCode: 204, headers };
    }

    try {
        if (event.httpMethod === 'GET') {
            const appointments = await getScheduledAppointments();
            return { statusCode: 200, headers, body: JSON.stringify(appointments) };
        }

        if (event.httpMethod === 'POST' && event.headers['content-type'] === 'application/json') {
            const data = JSON.parse(event.body);

            if (!data.client_name || !data.date || !data.time) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Dados inválidos ou incompletos!' }) };
            }

            const result = await createAppointment(data.client_name, data.date, data.time);
            return { statusCode: result.success ? 200 : 400, headers, body: JSON.stringify(result) };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido!' }) };
    } catch (error) {
        console.error('Erro no handler:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erro interno do servidor.' }) };
    }
};
