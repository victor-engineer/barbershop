const { Pool } = require('pg');
const axios = require('axios');

// ================== WHATSAPP CONFIG ==================
const ZAPI_INSTANCE = process.env.ZAPI_INSTANCE;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const BARBER_PHONE = process.env.BARBER_PHONE;

// ================== DATABASE ==================
console.log('Inicializando pool de conexões com o banco de dados...');
const pool = new Pool({
  connectionString: 'postgresql://postgres:UMCdlnDVxeJwdWCIDwLbBQLihuXAwILY@shortline.proxy.rlwy.net:18696/railway',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// ================== UTILS ==================
async function withRetry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

// ================== WHATSAPP ==================
async function sendWhatsAppMessage(phone, message) {
  const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`;
  await axios.post(url, { phone, message });
}

function buildClientMessage({ clientName, date, time, service }) {
  return `✂️ *Barbearia Francisco*

Olá, ${clientName}! 👋

Seu horário foi *confirmado*:

📅 Data: ${date}
⏰ Hora: ${time.substring(0,5)}
💈 Serviço: ${service}

Qualquer dúvida é só responder 😉`;
}

function buildBarberMessage({ clientName, date, time, service, whatsapp }) {
  return `📢 *Novo agendamento*

👤 Cliente: ${clientName}
📞 WhatsApp: ${whatsapp}
📅 Data: ${date}
⏰ Hora: ${time.substring(0,5)}
💈 Serviço: ${service}`;
}

// ================== DATABASE FUNCTIONS ==================
async function getScheduledAppointments() {
  const query = 'SELECT date, time, client_name, whatsapp, service FROM appointments';
  const res = await withRetry(() => pool.query(query));
  return res.rows;
}

async function createAppointment(clientName, date, time, whatsapp, service) {
  const queryCheck = 'SELECT 1 FROM appointments WHERE date = $1 AND time::text LIKE $2';
  const checkResult = await withRetry(() =>
    pool.query(queryCheck, [date, time + '%'])
  );

  if (checkResult.rows.length > 0) {
    return { success: false, error: 'O horário já está reservado!' };
  }

  const formattedTime = time.length === 5 ? time + ':00' : time;

  const query = `
    INSERT INTO appointments (client_name, date, time, whatsapp, service)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;

  const result = await withRetry(() =>
    pool.query(query, [clientName, date, formattedTime, whatsapp, service])
  );

  return {
    success: true,
    message: 'Reserva realizada com sucesso!',
    clientName,
    date,
    time: formattedTime,
    whatsapp,
    service
  };
}

async function deleteAppointment(clientName, date, time) {
  const queryDelete = `
    DELETE FROM appointments
    WHERE client_name = $1 AND date = $2 AND time = $3
  `;
  await withRetry(() =>
    pool.query(queryDelete, [clientName, date, time])
  );
}

async function cancelAppointment(clientName, date, time) {
  await deleteAppointment(clientName, date, time);
  return { success: true, message: 'Agendamento cancelado com sucesso!' };
}

// ================== HANDLER ==================
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod === 'GET') {
    const appointments = await getScheduledAppointments();
    return { statusCode: 200, headers, body: JSON.stringify(appointments) };
  }

  if (event.httpMethod === 'POST') {
    const data = JSON.parse(event.body);

    const result = await createAppointment(
      data.client_name.trim(),
      data.date.trim(),
      data.time.trim(),
      data.whatsapp.trim(),
      data.service.trim()
    );

    // ✅ ENVIO DE WHATSAPP (SÓ ACRESCENTADO)
    if (result.success) {
      try {
        await sendWhatsAppMessage(
          `55${data.whatsapp.replace(/\D/g, '')}`,
          buildClientMessage(result)
        );

        await sendWhatsAppMessage(
          BARBER_PHONE,
          buildBarberMessage(result)
        );
      } catch (err) {
        console.error('Erro ao enviar WhatsApp:', err.message);
      }
    }

    return {
      statusCode: result.success ? 200 : 400,
      headers,
      body: JSON.stringify(result)
    };
  }

  if (event.httpMethod === 'DELETE') {
    const data = JSON.parse(event.body);
    const result = await cancelAppointment(data.client_name, data.date, data.time);
    return { statusCode: 200, headers, body: JSON.stringify(result) };
  }

  return { statusCode: 405, headers };
};
