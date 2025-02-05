const { Client } = require('pg'); // Importa o cliente PostgreSQL
const cors = require('cors'); // Para lidar com CORS (Cross-Origin Resource Sharing)

// Configuração da URL de conexão no Railway
const client = new Client({
    connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway',  // URL de conexão do Railway
    ssl: {
        rejectUnauthorized: false, // Necessário para a conexão segura com o Railway
    }
});

client.connect(); // Conecta ao banco de dados

// Função para obter os agendamentos
async function getScheduledAppointments() {
    const res = await client.query('SELECT date, time, client_name FROM appointments');
    return res.rows; // Retorna os agendamentos
}

// Função para inserir um novo agendamento
async function createAppointment(clientName, date, time) {
    const queryCheck = 'SELECT 1 FROM appointments WHERE date = $1 AND time = $2';
    const checkResult = await client.query(queryCheck, [date, time]);

    if (checkResult.rows.length > 0) {
        return {
            success: false,
            error: 'O horário já está reservado!',
        };
    }

    const formattedTime = time + ':00'; // Adiciona segundos ao horário
    const query = 'INSERT INTO appointments (client_name, date, time) VALUES ($1, $2, $3)';
    const result = await client.query(query, [clientName, date, formattedTime]);

    if (result.rowCount > 0) {
        return {
            success: true,
            message: 'Reserva realizada com sucesso!',
            client_name: clientName,
            date: date,
            time: formattedTime,
        };
    } else {
        return {
            success: false,
            error: 'Erro ao salvar a reserva no banco de dados.',
        };
    }
}

exports.handler = async (event) => {
    // Habilita o CORS para permitir requisições de diferentes origens
    const allowedOrigins = ['http://localhost:5501', 'https://franciscobarbearia.netlify.app', 'http://localhost:8888'];
    const origin = event.headers.origin;

    // Verifica se a origem está na lista de permitidas
    const headers = {
        'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'null', // Permite apenas as origens permitidas
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Permite os métodos
        'Access-Control-Allow-Headers': 'Content-Type', // Permite o cabeçalho Content-Type
        'Content-Type': 'application/json', // Define o tipo de conteúdo
    };

    // Se for uma requisição OPTIONS (preflight), apenas retorne os cabeçalhos
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers,
        };
    }

    if (event.httpMethod === 'GET') {
        // Se for GET, retorna todos os agendamentos
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
        // Se for POST, processa a inserção de um novo agendamento
        try {
            const data = JSON.parse(event.body);

            if (!data.client_name || !data.date || !data.time) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Dados inválidos ou incompletos!' }),
                };
            }

            const { client_name, date, time } = data;
            const result = await createAppointment(client_name, date, time);

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
