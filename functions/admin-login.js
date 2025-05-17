const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

// Função para comparar a senha fornecida com o hash no banco de dados
function encryptPassword(inputPassword, storedPasswordHash) {
  return bcrypt.compareSync(inputPassword, storedPasswordHash);
}

// Função principal da Netlify Function
exports.handler = async (event) => {
  // Tratamento de requisição OPTIONS (pré-vôo CORS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://franciscobarbearia.com.br', // ou '*' para testes
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Configurações do banco de dados Railway
  const client = new Client({
    connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    if (event.httpMethod === 'POST') {
      const { username, password } = JSON.parse(event.body || '{}');

      if (!username || !password) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': 'https://franciscobarbearia.com.br',
          },
          body: JSON.stringify({ success: false, error: 'Usuário ou senha ausentes.' }),
        };
      }

      const query = 'SELECT * FROM admin_users WHERE username = $1';
      const res = await client.query(query, [username]);

      if (res.rows.length === 1) {
        const user = res.rows[0];
        const passwordMatch = encryptPassword(password, user.password);

        if (passwordMatch) {
          const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '1h' });

          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': 'https://franciscobarbearia.com.br',
            },
            body: JSON.stringify({ success: true, token }),
          };
        }
      }

      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': 'https://franciscobarbearia.com.br',
        },
        body: JSON.stringify({ success: false, error: 'Usuário ou senha inválidos.' }),
      };
    }

    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': 'https://franciscobarbearia.com.br',
      },
      body: JSON.stringify({ success: false, error: 'Método não permitido.' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://franciscobarbearia.com.br',
      },
      body: JSON.stringify({ success: false, error: 'Erro interno do servidor.' }),
    };
  } finally {
    await client.end();
  }
};
