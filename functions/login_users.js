require('dotenv').config();  // Carrega variáveis do .env

const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const jwt = require('jsonwebtoken'); // Certifique-se de importar o jwt

// Função para comparar a senha fornecida com o hash no banco de dados
function encryptPassword(inputPassword, storedPasswordHash) {
  console.log("Comparando senha fornecida com o hash armazenado...");
  return bcrypt.compareSync(inputPassword, storedPasswordHash);
}

// Função para login
exports.handler = async (event) => {
  const client = new Client({
    connectionString: 'postgresql://postgres:UMCdlnDVxeJwdWCIDwLbBQLihuXAwILY@shortline.proxy.rlwy.net:18696/railway',
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
    console.log("Conexão bem-sucedida!");

    // Verifica se é uma requisição OPTIONS (para CORS)
    if (event.httpMethod === 'OPTIONS') {
      console.log("Requisição OPTIONS detectada. Retornando status 204.");
      return {
        statusCode: 204,  // No content
        headers: headers,  // Adiciona os headers de CORS
        body: JSON.stringify({}),
      };
    }

    if (event.httpMethod !== 'POST') {
      console.log("Método não permitido detectado. Esperado POST.");
      return {
        statusCode: 405,
        headers: headers,  // Adiciona os headers de CORS
        body: JSON.stringify({ success: false, error: 'Método não permitido.' }),
      };
    }

    const { whatsapp, password } = JSON.parse(event.body);
    console.log(`Login tentativa: WhatsApp: ${whatsapp}`);

    // Validação dos campos
    if (!whatsapp || !password) {
      console.log("Erro: WhatsApp ou senha ausentes.");
      return {
        statusCode: 400,
        headers: headers,  // Adiciona os headers de CORS
        body: JSON.stringify({ success: false, error: 'WhatsApp ou senha ausentes.' }),
      };
    }

    // Verifica se o usuário existe, agora com o WhatsApp
    const query = 'SELECT * FROM users WHERE whatsapp = $1';
    console.log(`Executando consulta: ${query} com whatsapp: ${whatsapp}`);
    const res = await client.query(query, [whatsapp]);

    if (res.rows.length === 1) {
      const user = res.rows[0];
      console.log("Usuário encontrado. Verificando senha...");

      // Verifica a senha usando a criptografia
      const passwordMatch = encryptPassword(password, user.password);

      if (passwordMatch) {
        console.log("Senha válida! Login bem-sucedido.");
      
        return {
          statusCode: 200,
          headers: headers,  // Adiciona os headers de CORS
          body: JSON.stringify({
            success: true,
            message: "Login bem-sucedido!"  // Apenas a mensagem de sucesso, sem o token
          }),
        };
      } else {
        console.log("Senha inválida! Rejeitando login.");
        return {
          statusCode: 401,
          headers: headers,  // Adiciona os headers de CORS
          body: JSON.stringify({
            success: false,
            error: 'WhatsApp ou senha inválidos.',
          }),
        };
      }
    }
  } catch (error) {
    console.error("Erro no servidor:", error);
    return {
      statusCode: 500,
      headers: headers,  // Adiciona os headers de CORS
      body: JSON.stringify({ success: false, error: 'Erro interno do servidor.' }),
    };
  } finally {
    await client.end();
    console.log("Conexão com o banco encerrada.");
  }
};
