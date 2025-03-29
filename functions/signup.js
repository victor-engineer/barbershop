require('dotenv').config();  // Carrega variáveis do .env

const bcrypt = require('bcryptjs');
const { Client } = require('pg');

// Função para validar número de WhatsApp
function isValidWhatsApp(whatsapp) {
  const whatsappRegex = /^\+?[1-9]\d{1,14}$/;
  return whatsappRegex.test(whatsapp);
}

exports.handler = async (event) => {
  const client = new Client({
    connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway',
    ssl: { rejectUnauthorized: false },
  });

  const allowedOrigins = ['http://localhost:5501', 'https://franciscobarbearia.netlify.app', 'http://localhost:8888'];
  const origin = event.headers.origin;
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    console.log("Iniciando a função serverless...");
    await client.connect();

    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: headers,
        body: JSON.stringify({}),
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: headers,
        body: JSON.stringify({ success: false, error: 'Método não permitido.' }),
      };
    }

    const { whatsapp, password, username } = JSON.parse(event.body);

    if (!whatsapp || !password || !username) {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ success: false, error: 'WhatsApp, senha ou nome de usuário ausentes.' }),
      };
    }

    if (!isValidWhatsApp(whatsapp)) {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ success: false, error: 'Número de WhatsApp inválido.' }),
      };
    }

    const checkUser = await client.query('SELECT * FROM users WHERE whatsapp = $1', [whatsapp]);

    if (checkUser.rows.length > 0) {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ success: false, error: 'Usuário já cadastrado.' }),
      };
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const query = 'INSERT INTO users (whatsapp, password, username) VALUES ($1, $2, $3) RETURNING id';
    const result = await client.query(query, [whatsapp, hashedPassword, username]);

    // Removendo a geração do token JWT
    const user = {
      id: result.rows[0].id,
      username: username,
      whatsapp: whatsapp,
    };

    return {
      statusCode: 201,
      headers: headers,
      body: JSON.stringify({ success: true, user }),
    };
  } catch (error) {
    console.error("Erro no servidor:", error);
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ success: false, error: 'Erro interno do servidor.', details: error.message }),
    };
  } finally {
    await client.end();
  }
};
