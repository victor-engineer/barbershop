const { Client } = require('pg');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Função para criptografar a senha (scrypt com salt)
function encryptPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Configuração do banco de dados usando Railway
function getClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL, // URL segura do Railway
    ssl: { rejectUnauthorized: false }, // Necessário para PostgreSQL no Railway
  });
}

// Cabeçalhos CORS para permitir requisições do frontend
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  // Responder requisições OPTIONS (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const client = getClient();
  await client.connect();

  try {
    if (event.httpMethod === 'POST') {
      const { username, password } = JSON.parse(event.body);

      if (!username || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Usuário ou senha ausentes.' }),
        };
      }

      const query = 'SELECT * FROM admin_users WHERE username = $1';
      const res = await client.query(query, [username]);

      if (res.rows.length === 1) {
        const user = res.rows[0];

        // Extrai o salt da senha armazenada
        const storedHash = user.password;
        const salt = storedHash.slice(0, 32); // Assumindo um salt de 32 caracteres

        // Criptografa a senha fornecida pelo usuário para comparar
        const encryptedPassword = encryptPassword(password, salt);

        if (encryptedPassword === storedHash) {
          // Gera o token JWT
          const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', {
            expiresIn: '1h',
          });

          // Configura um cookie seguro
          const cookie = `admin_logged_in=true; HttpOnly; Secure; Path=/; Max-Age=3600`;

          return {
            statusCode: 200,
            headers: {
              ...headers,
              'Set-Cookie': cookie,
            },
            body: JSON.stringify({ success: true, message: 'Login bem-sucedido!', token }),
          };
        } else {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ success: false, error: 'Usuário ou senha inválidos.' }),
          };
        }
      } else {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ success: false, error: 'Usuário ou senha inválidos.' }),
        };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Método não permitido.' }),
    };
  } catch (error) {
    console.error('Erro no login:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Erro interno do servidor. Tente novamente mais tarde.' }),
    };
  } finally {
    await client.end(); // Fecha conexão com o PostgreSQL
  }
};
