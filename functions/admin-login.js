const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

// Função para comparar a senha fornecida com o hash no banco de dados
function encryptPassword(inputPassword, storedPasswordHash) {
  // Usar bcrypt para comparar as senhas
  return bcrypt.compareSync(inputPassword, storedPasswordHash);
}

// Função principal da Netlify Function
exports.handler = async (event) => {
  // Configurações do banco de dados usando a variável de ambiente DATABASE_URL do Railway
  const client = new Client({
    connectionString:'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway', // URL de conexão do Railway
    ssl: {
      rejectUnauthorized: false, // Para conexões seguras
    },
  });

  try {
    // Conectar ao banco de dados
    await client.connect();

    // Verifica se o método HTTP é POST
    if (event.httpMethod === 'POST') {
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

      // Prepara a consulta para buscar o usuário no banco de dados
      const query = 'SELECT * FROM admin_users WHERE username = $1';
      const res = await client.query(query, [username]);

      if (res.rows.length === 1) {
        const user = res.rows[0];

        // Verifica a senha usando a criptografia
        const passwordMatch = encryptPassword(password, user.password);

        if (passwordMatch) {
          // Se o login for bem-sucedido, armazena a sessão (Netlify não suporta sessões, então simulamos com um JWT)
          const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY, { expiresIn: '1h' });

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
    }

    return {
      statusCode: 405,
      body: JSON.stringify({
        success: false,
        error: 'Método não permitido.',
      }),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Erro interno do servidor. Tente novamente mais tarde.',
      }),
    };
  } finally {
    // Fecha a conexão com o banco
    await client.end();
  }
};
