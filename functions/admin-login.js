const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Pool de conexões global para evitar reconexões desnecessárias
const pool = new Pool({
  connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway',
  ssl: { rejectUnauthorized: false },
  max: 5, // Limita conexões simultâneas
  idleTimeoutMillis: 30000, // Fecha conexões ociosas após 30s
  connectionTimeoutMillis: 5000 // Tempo máximo para tentar conectar
});

function encryptPassword(inputPassword, storedPasswordHash) {
  return bcrypt.compareSync(inputPassword, storedPasswordHash);
}

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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({
        success: false,
        error: 'Método não permitido.',
      }),
    };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Usuário ou senha ausentes.',
        }),
      };
    }

    const result = await withRetry(() => pool.query('SELECT * FROM admin_users WHERE username = $1', [username]));

    if (result.rows.length !== 1) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: 'Usuário ou senha inválidos.',
        }),
      };
    }

    const user = result.rows[0];
    const passwordMatch = encryptPassword(password, user.password);

    if (!passwordMatch) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: 'Usuário ou senha inválidos.',
        }),
      };
    }

    const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '1h' });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        token,
      }),
    };
  } catch (error) {
    console.error('Erro ao processar login:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Erro interno do servidor. Tente novamente mais tarde.',
      }),
    };
  }
};
