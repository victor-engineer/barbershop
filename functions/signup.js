const bcrypt = require('bcryptjs');
const { Client } = require('pg');

// Função para validar e-mail
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para registrar usuários
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

    const { username, password, email } = JSON.parse(event.body);

    // Validação dos campos
    if (!username || !password || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Todos os campos são obrigatórios.' }),
      };
    }

    if (!isValidEmail(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'E-mail inválido.' }),
      };
    }

    // Verifica se o usuário já existe
    const userExistsQuery = 'SELECT * FROM users WHERE username = $1 OR email = $2';
    const userExists = await client.query(userExistsQuery, [username, email]);

    if (userExists.rows.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Usuário ou e-mail já cadastrados.' }),
      };
    }

    // Criptografa a senha antes de salvar
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insere no banco
    const insertQuery = 'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id, username, email';
    const newUser = await client.query(insertQuery, [username, hashedPassword, email]);

    return {
      statusCode: 201,
      body: JSON.stringify({ 
        success: true, 
        message: 'Usuário cadastrado com sucesso!', 
        user: newUser.rows[0] 
      }),
    };
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
