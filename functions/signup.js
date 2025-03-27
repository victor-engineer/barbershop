const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const jwt = require('jsonwebtoken'); // Não se esqueça de importar o jwt

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
    console.log("Conectando ao banco de dados...");
    await client.connect();

    // Verifica se é uma requisição OPTIONS (para CORS)
    if (event.httpMethod === 'OPTIONS') {
      console.log("Requisição OPTIONS, retornando headers...");
      return {
        statusCode: 204,  // No content
        headers: headers,  // Adiciona os headers de CORS
        body: JSON.stringify({}),
      };
    }

    if (event.httpMethod !== 'POST') {
      console.log("Método não permitido:", event.httpMethod);
      return {
        statusCode: 405,
        headers: headers,  // Adiciona os headers de CORS
        body: JSON.stringify({ success: false, error: 'Método não permitido.' }),
      };
    }

    const { whatsapp, password } = JSON.parse(event.body);
    console.log("Recebendo dados:", { whatsapp, password });

    // Validação dos campos
    if (!whatsapp || !password) {
      console.log("WhatsApp ou senha ausentes.");
      return {
        statusCode: 400,
        headers: headers,  // Adiciona os headers de CORS
        body: JSON.stringify({ success: false, error: 'WhatsApp ou senha ausentes.' }),
      };
    }

    // Valida o número de WhatsApp
    if (!isValidWhatsApp(whatsapp)) {
      console.log("Número de WhatsApp inválido:", whatsapp);
      return {
        statusCode: 400,
        headers: headers,  // Adiciona os headers de CORS
        body: JSON.stringify({ success: false, error: 'Número de WhatsApp inválido.' }),
      };
    }

    // Verifica se o usuário existe no banco de dados
    console.log("Consultando usuário no banco de dados...");
    const query = 'SELECT * FROM users WHERE whatsapp = $1';
    const res = await client.query(query, [whatsapp]);

    if (res.rows.length === 1) {
      const user = res.rows[0];
      console.log("Usuário encontrado:", user);

      // Verifica a senha usando a criptografia
      const passwordMatch = bcrypt.compareSync(password, user.password);
      console.log("Senha verificada:", passwordMatch);

      if (passwordMatch) {
        // Se o login for bem-sucedido, gera o token JWT
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log("Login bem-sucedido, gerando token...");

        return {
          statusCode: 200,
          headers: headers,  // Adiciona os headers de CORS
          body: JSON.stringify({
            success: true,
            token,  // Retorna o JWT como token de autenticação
          }),
        };
      } else {
        console.log("Senha incorreta.");
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
      console.log("Usuário não encontrado.");
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
    console.error("Erro no servidor:", error);
    return {
      statusCode: 500,
      headers: headers,  // Adiciona os headers de CORS
      body: JSON.stringify({ success: false, error: 'Erro interno do servidor.' }),
    };
  } finally {
    console.log("Fechando conexão com o banco de dados...");
    await client.end();
  }
};
