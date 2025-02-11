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
        try {
            const res = await client.query(query);
            console.log(`Agendamentos recuperados (${res.rows.length} registros):`, res.rows);
            return res.rows;
        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error);
            return [];
        }
    }
    
    async function createAppointment(clientName, date, time, whatsapp, service) {
        console.log(`Iniciando criação de agendamento para ${clientName} em ${date} às ${time}...`);
        
        const formattedTime = time.length === 5 ? `${time}:00` : time; // Garante formato HH:MM:SS
        console.log(`Horário formatado para inserção: ${formattedTime}`);
    
        const queryCheck = 'SELECT date, time FROM appointments WHERE date = $1 AND time = $2';
        
        try {
            console.log(`Verificando disponibilidade do horário: ${date} ${formattedTime}`);
            const checkResult = await client.query(queryCheck, [date, formattedTime]);
            console.log(`Resultado da verificação: ${checkResult.rows.length} registros encontrados`);
    
            if (checkResult.rows.length > 0) {
                console.warn(`⚠️ Horário já reservado: ${date} ${formattedTime}`);
                return { success: false, error: 'O horário já está reservado!' };
            }
    
            console.log('Horário disponível! Inserindo no banco de dados...');
            const queryInsert = `
                INSERT INTO appointments (client_name, date, time, whatsapp, service) 
                VALUES ($1, $2, $3, $4, $5) RETURNING id
            `;
            const result = await client.query(queryInsert, [clientName, date, formattedTime, whatsapp, service]);
    
            console.log('Resultado da inserção:', result.rowCount > 0 ? '✅ Sucesso!' : '❌ Falha na inserção.');
    
            if (result.rowCount > 0) {
                return {
                    success: true,
                    message: 'Reserva realizada com sucesso!',
                    clientName,
                    date,
                    time: formattedTime,
                    whatsapp,
                    service
                };
            } else {
                return { success: false, error: 'Erro ao salvar a reserva no banco.' };
            }
        } catch (error) {
            console.error('❌ Erro durante a verificação ou inserção no banco:', error);
            return { success: false, error: 'Erro ao processar a reserva.', details: error.message };
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
                whatsapp: data.whatsapp || '', // Aceita qualquer valor
                service: data.service || '' // Aceita qualquer valor
            };

            console.log('Dados normalizados para criação de reserva:', formattedData);

            const requiredFields = ['client_name', 'date', 'time'];
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
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erro ao processar a reserva.', details: error.message }) };
        }
    }

    console.log('Método não permitido:', event.httpMethod);
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido!' }) };
};

