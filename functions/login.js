const { Client } = require('pg');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Função para criptografar a senha, similar ao `crypt()` do PHP
function encryptPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Função principal da Netlify Function
exports.handler = async (event) => {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'barbershop',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();

    if (event.httpMethod === 'POST') {
      const { username, password } = JSON.parse(event.body);

      if (!username || !password) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, error: 'Usuário ou senha ausentes.' }),
        };
      }

      const query = 'SELECT * FROM admin_users WHERE username = $1';
      const res = await client.query(query, [username]);

      if (res.rows.length === 1) {
        const user = res.rows[0];
        const encryptedPassword = encryptPassword(password, user.password.slice(0, 16));

        if (encryptedPassword === user.password) {
          // Cria o JWT token
          const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '1h' });

          // Aqui setamos o cookie de login
          const cookie = `admin_logged_in=true; HttpOnly; Path=/; Max-Age=3600`;

          return {
            statusCode: 200,
            headers: {
              'Set-Cookie': cookie, // Configurando o cookie
            },
            body: JSON.stringify({ success: true, message: 'Login bem-sucedido!', token }),
          };
        } else {
          return {
            statusCode: 401,
            body: JSON.stringify({ success: false, error: 'Usuário ou senha inválidos.' }),
          };
        }
      } else {
        return {
          statusCode: 401,
          body: JSON.stringify({ success: false, error: 'Usuário ou senha inválidos.' }),
        };
      }
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Método não permitido.' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Erro interno do servidor. Tente novamente mais tarde.' }),
    };
  } finally {
    await client.end();
  }
};
