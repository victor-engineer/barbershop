require('dotenv').config();  // Carrega variáveis do .env

const bcrypt = require('bcryptjs');
const { Client } = require('pg');

// Função para comparar a senha fornecida com o hash no banco de dados
function encryptPassword(inputPassword, storedPasswordHash) {
  return bcrypt.compareSync(inputPassword, storedPasswordHash);
}

// Função para login
exports.handler = async (event) => {
  const client = new Client({
    connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway',
    ssl: { rejectUnauthorized: false },
  });

  // Configurações de CORS
  const allowedOrigins = ['http://localhost:5501', 'https://franciscobarbearia.netlify.app', 'http://localhost:8888'];
  const origin = event.headers.origin;
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    await client.connect();

    // Verifica se é uma requisição OPTIONS (para CORS)
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,  // No content
        headers: headers,  // Adiciona os headers de CORS
        body: JSON.stringify({}),
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: headers,  // Adiciona os headers de CORS
        body: JSON.stringify({ success: false, error: 'Método não permitido.' }),
      };
    }

    const { whatsapp, password } = JSON.parse(event.body);

    // Validação dos campos
    if (!whatsapp || !password) {
      return {
        statusCode: 400,
        headers: headers,  // Adiciona os headers de CORS
        body: JSON.stringify({ success: false, error: 'WhatsApp ou senha ausentes.' }),
      };
    }

    // Verifica se o usuário existe, agora com o WhatsApp
    const query = 'SELECT * FROM users WHERE whatsapp = $1';
    const res = await client.query(query, [whatsapp]);

    if (res.rows.length === 1) {
      const user = res.rows[0];

      // Verifica a senha usando a criptografia
      const passwordMatch = encryptPassword(password, user.password);

      if (passwordMatch) {
        // Se o login for bem-sucedido, gera o token JWT
        const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '1h' });

        return {
          statusCode: 200,
          headers: headers,  // Adiciona os headers de CORS
          body: JSON.stringify({
            success: true,
            token,  // Retorna o JWT como token de autenticação
          }),
        };
      } else {
        return {
          statusCode: 401,
          headers: headers,  // Adiciona os headers de CORS
          body: JSON.stringify({
            success: false,
            error: 'WhatsApp ou senha inválidos.',
          }),
        };
      }
    } else {
      return {
        statusCode: 401,
        headers: headers,  // Adiciona os headers de CORS
        body: JSON.stringify({
          success: false,
          error: 'WhatsApp ou senha inválidos.',
        }),
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: headers,  // Adiciona os headers de CORS
      body: JSON.stringify({ success: false, error: 'Erro interno do servidor.' }),
    };
  } finally {
    await client.end();
  }
};
