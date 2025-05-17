const { Client } = require('pg');

// Função que retorna um novo cliente do PostgreSQL
function createClient() {
  return new Client({
    connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway',
    ssl: { rejectUnauthorized: false }
  });
}

// --- Funções auxiliares (sem alteração significativa) ---
async function getScheduledAppointments(client) {
  const query = `SELECT date, time, client_name, whatsapp, service FROM appointments`;
  const res = await client.query(query);
  return res.rows;
}

async function createAppointment(client, clientName, date, time, whatsapp, service) {
  const queryCheck = 'SELECT 1 FROM appointments WHERE date = $1 AND time::text LIKE $2';
  const checkResult = await client.query(queryCheck, [date, time + '%']);

  if (checkResult.rows.length > 0) {
    return { success: false, error: 'O horário já está reservado!' };
  }

  const formattedTime = time.length === 5 ? time + ':00' : time;
  const query = 'INSERT INTO appointments (client_name, date, time, whatsapp, service) VALUES ($1, $2, $3, $4, $5) RETURNING id';
  const result = await client.query(query, [clientName, date, formattedTime, whatsapp, service]);

  return result.rowCount > 0
    ? { success: true, message: 'Reserva realizada com sucesso!', clientName, date, time: formattedTime, whatsapp, service }
    : { success: false, error: 'Erro ao salvar a reserva no banco.' };
}

async function deleteAppointment(client, clientName, date, time) {
  const queryDelete = 'DELETE FROM appointments WHERE client_name = $1 AND date = $2 AND time = $3 RETURNING id';
  const result = await client.query(queryDelete, [clientName, date, time]);

  return result.rowCount > 0
    ? { success: true, message: 'Agendamento excluído com sucesso.' }
    : { success: false, error: 'Nenhum agendamento encontrado para excluir.' };
}

async function cancelAppointment(client, clientName, date, time) {
  return await deleteAppointment(client, clientName, date, time);
}

// --- Função handler principal ---
exports.handler = async (event) => {
  const allowedOrigins = [
    'https://franciscobarbearia.com.br',
    'https://franciscobarbearia.netlify.app',
    'http://localhost:8888'
  ];

  const origin = event.headers.origin;
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*', // '*' em testes
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const client = createClient();
  try {
    await client.connect();

    if (event.httpMethod === 'GET') {
      const appointments = await getScheduledAppointments(client);
      return { statusCode: 200, headers, body: JSON.stringify(appointments) };
    }

    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const { client_name, date, time, whatsapp, service } = data;

      const requiredFields = [client_name, date, time, whatsapp, service];
      if (requiredFields.some(f => !f || f.trim() === '')) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Todos os campos são obrigatórios.' }) };
      }

      const queryCheckClient = 'SELECT * FROM appointments WHERE client_name = $1 AND date = $2';
      const existingAppointments = await client.query(queryCheckClient, [client_name, date]);

      for (const a of existingAppointments.rows) {
        await deleteAppointment(client, a.client_name, a.date, a.time);
      }

      const result = await createAppointment(client, client_name, date, time, whatsapp, service);
      return { statusCode: result.success ? 200 : 400, headers, body: JSON.stringify(result) };
    }

    if (event.httpMethod === 'DELETE') {
      const data = JSON.parse(event.body);
      const { client_name, date, time } = data;

      if (!client_name || !date || !time) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'client_name, date e time são obrigatórios.' }) };
      }

      const result = await cancelAppointment(client, client_name, date, time);
      return { statusCode: result.success ? 200 : 400, headers, body: JSON.stringify(result) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido!' }) };
  } catch (error) {
    console.error('Erro geral:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erro interno.', details: error.message }) };
  } finally {
    await client.end(); // fechamento importante!
  }
};
