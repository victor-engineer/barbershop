const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const jwt = require('jsonwebtoken'); // Importa o JWT

// Função para validar número de WhatsApp
function isValidWhatsApp(whatsapp) {
  const whatsappRegex = /^\+?[1-9]\d{1,14}$/; // Regex para números internacionais
  return whatsappRegex.test(whatsapp);
}

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    console.log("Iniciando a função serverless...");
    
    console.log("Conectando ao banco de dados...");
    await client.connect();

    // Verifica se é uma requisição OPTIONS (para CORS)
    if (event.httpMethod === 'OPTIONS') {
      console.log("Requisição OPTIONS, retornando headers...");
      return {
        statusCode: 204,
        headers: headers,
        body: JSON.stringify({}),
      };
    }

    if (event.httpMethod !== 'POST') {
      console.log("Método não permitido:", event.httpMethod);
      return {
        statusCode: 405,
        headers: headers,
        body: JSON.stringify({ success: false, error: 'Método não permitido.' }),
      };
    }

    const { whatsapp, password, username } = JSON.parse(event.body);
    console.log("Dados recebidos:", { whatsapp, password, username });

    // Validação dos campos
    if (!whatsapp || !password || !username) {
      console.log("WhatsApp, senha ou nome de usuário ausentes.");
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ success: false, error: 'WhatsApp, senha ou nome de usuário ausentes.' }),
      };
    }

    // Valida o número de WhatsApp
    if (!isValidWhatsApp(whatsapp)) {
      console.log("Número de WhatsApp inválido:", whatsapp);
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ success: false, error: 'Número de WhatsApp inválido.' }),
      };
    }

    // Verifica se o usuário já está cadastrado
    console.log("Verificando se usuário já existe...");
    const checkUser = await client.query('SELECT * FROM users WHERE whatsapp = $1', [whatsapp]);
    console.log("Resultado da consulta de usuário:", checkUser.rows);

    if (checkUser.rows.length > 0) {
      console.log("Usuário já cadastrado:", whatsapp);
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ success: false, error: 'Usuário já cadastrado.' }),
      };
    }

    // Criptografa a senha antes de salvar
    console.log("Criptografando senha...");
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Insere o usuário no banco
    console.log("Inserindo usuário no banco...");
    const query = 'INSERT INTO users (whatsapp, password, username) VALUES ($1, $2, $3) RETURNING id';
    const result = await client.query(query, [whatsapp, hashedPassword, username]);
    console.log("Resultado da inserção de usuário:", result.rows);

    // Gera um token JWT para autenticação após o cadastro
    console.log("Gerando token JWT...");
    const token = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return {
      statusCode: 201,
      headers: headers,
      body: JSON.stringify({ success: true, userId: result.rows[0].id, token }),
    };
  } catch (error) {
    console.error("Erro no servidor:", error);
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ success: false, error: 'Erro interno do servidor.', details: error.message }),
    };
  } finally {
    console.log("Fechando conexão com o banco de dados...");
    await client.end();
  }
};
