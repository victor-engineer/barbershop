const { Client } = require('pg'); // Importa o cliente PostgreSQL

console.log('Iniciando conexão com o banco de dados...');
const client = new Client({
    connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway', 
    ssl: { rejectUnauthorized: false }
});

client.connect()
    .then(() => console.log('Conectado ao banco de dados com sucesso!'))
    .catch(err => console.error('Erro ao conectar ao banco de dados:', err));

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
        const { id, client_name, date, time, whatsapp, service } = data;

        try {
            const updateQuery = 'UPDATE appointments SET client_name = $1, date = $2, time = $3, whatsapp = $4, service = $5 WHERE id = $6';
            await client.query(updateQuery, [client_name, date, time, whatsapp, service, id]);
            
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
