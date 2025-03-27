const bcrypt = require('bcryptjs');
const { Client } = require('pg');

// Função para validar número de WhatsApp
function isValidWhatsApp(whatsapp) {
  const whatsappRegex = /^\+?[1-9]\d{1,14}$/; // Regex para números internacionais
  return whatsappRegex.test(whatsapp);
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

    const { whatsapp, password } = JSON.parse(event.body);

    // Validação dos campos
    if (!whatsapp || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'WhatsApp ou senha ausentes.' }),
      };
    }

    // Valida o número de WhatsApp
    if (!isValidWhatsApp(whatsapp)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Número de WhatsApp inválido.' }),
      };
    }

    // Verifica se o usuário existe no banco de dados
    const query = 'SELECT * FROM users WHERE whatsapp = $1';
    const res = await client.query(query, [whatsapp]);

    if (res.rows.length === 1) {
      const user = res.rows[0];

      // Verifica a senha usando a criptografia
      const passwordMatch = bcrypt.compareSync(password, user.password);

      if (passwordMatch) {
        // Se o login for bem-sucedido, gera o token JWT
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

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
            error: 'WhatsApp ou senha inválidos.',
          }),
        };
      }
    } else {
      return {
        statusCode: 401,
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
      body: JSON.stringify({ success: false, error: 'Erro interno do servidor.' }),
    };
  } finally {
    await client.end();
  }
};
