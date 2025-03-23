const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

  try {
    await client.connect();

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ success: false, error: 'Método não permitido.' }),
      };
    }

    const { username, password } = JSON.parse(event.body);

    // Validação dos campos
    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Usuário ou senha ausentes.' }),
      };
    }

    // Verifica se o usuário existe
    const query = 'SELECT * FROM users WHERE username = $1';
    const res = await client.query(query, [username]);

    if (res.rows.length === 1) {
      const user = res.rows[0];

      // Verifica a senha usando a criptografia
      const passwordMatch = encryptPassword(password, user.password);

      if (passwordMatch) {
        // Se o login for bem-sucedido, gera o token JWT
        const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '1h' });

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            token,  // Retorna o JWT como token de autenticação
          }),
        };
      } else {
        return {
          statusCode: 401,
          body: JSON.stringify({
            success: false,
            error: 'Usuário ou senha inválidos.',
          }),
        };
      }
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: 'Usuário ou senha inválidos.',
        }),
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Erro interno do servidor.' }),
    };
  } finally {
    await client.end();
  }
};
