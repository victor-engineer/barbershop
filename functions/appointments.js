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
    const queryCheck = 'SELECT 1 FROM appointments WHERE date = $1 AND time::text LIKE $2';
    try {
        const checkResult = await client.query(queryCheck, [date, time + '%']);
        console.log('Resultado da verificação de disponibilidade:', checkResult.rows);

        if (checkResult.rows.length > 0) {
            console.log('Horário já reservado!');
            return { success: false, error: 'O horário já está reservado!' };
        }

        const formattedTime = time.length === 5 ? time + ':00' : time; // Adiciona segundos se não houver
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
    } catch (error) {
        console.error('Erro durante a verificação ou inserção no banco:', error);
        return { success: false, error: 'Erro ao processar a reserva.', details: error.message };
    }
}

// Função para excluir agendamento existente
async function deleteAppointment(clientName, date, time) {
    console.log(`Tentando excluir agendamento para ${clientName} no horário ${time} no dia ${date}`);
    const queryDelete = 'DELETE FROM appointments WHERE client_name = $1 AND date = $2 AND time = $3 RETURNING id';
    try {
        const result = await client.query(queryDelete, [clientName, date, time]);

        if (result.rowCount > 0) {
            console.log('Agendamento excluído com sucesso.');
            return { success: true, message: 'Agendamento excluído com sucesso.' };
        } else {
            console.log('Nenhum agendamento encontrado para excluir.');
            return { success: false, error: 'Nenhum agendamento encontrado para excluir.' };
        }
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
        return { success: false, error: 'Erro ao excluir o agendamento.', details: error.message };
    }
}

// Função handler que processa as requisições
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
                whatsapp: data.whatsapp?.trim() || '', // Adicionando o campo whatsapp
                service: data.service?.trim() || '' // Adicionando o campo serviço
            };

            console.log('Dados normalizados para criação de reserva:', formattedData);

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

            // Verifica se o cliente já tem um agendamento
            const queryCheckClient = 'SELECT * FROM appointments WHERE client_name = $1 AND date = $2 AND time = $3';
            const existingAppointment = await client.query(queryCheckClient, [formattedData.client_name, formattedData.date, formattedData.time]);

            // Se já tiver agendamento, exclui o agendamento anterior
            if (existingAppointment.rows.length > 0) {
                const deleteResult = await deleteAppointment(formattedData.client_name, formattedData.date, formattedData.time);
                if (!deleteResult.success) {
                    return { statusCode: 400, headers, body: JSON.stringify(deleteResult) };
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
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erro ao processar a reserva.', details: error.message }) };
        }
    }

    console.log('Método não permitido:', event.httpMethod);
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido!' }) };
};
