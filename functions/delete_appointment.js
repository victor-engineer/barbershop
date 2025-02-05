const { Client } = require('pg');

// Função que será chamada pelo Netlify Function
exports.handler = async (event) => {
  // Configuração da conexão com o banco de dados no Railway
  const client = new Client({
    connectionString: process.env.DATABASE_URL, // Use a variável de ambiente do Netlify
    ssl: { rejectUnauthorized: false }, // Necessário para Railway
  });

  await client.connect();

  // Configurar cabeçalhos para CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Responder requisições OPTIONS para evitar erro de CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod === "DELETE" && event.queryStringParameters?.id) {
    const id = parseInt(event.queryStringParameters.id);

    // Validar se o ID é um número inteiro
    if (isNaN(id)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'ID inválido ou não fornecido!' }),
      };
    }

    try {
      // Verificar se o agendamento existe
      const checkQuery = 'SELECT id FROM appointments WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);

      if (checkResult.rowCount === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, error: 'Agendamento não encontrado!' }),
        };
      }

      // Executar a exclusão do agendamento
      const deleteQuery = 'DELETE FROM appointments WHERE id = $1';
      const deleteResult = await client.query(deleteQuery, [id]);

      if (deleteResult.rowCount > 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Agendamento excluído com sucesso!' }),
        };
      } else {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ success: false, error: 'Erro ao excluir o agendamento.' }),
        };
      }
    } catch (err) {
      console.error("Erro no banco de dados: ", err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: 'Erro ao processar a requisição.' }),
      };
    } finally {
      await client.end(); // Fechar conexão
    }
  } else {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'ID não fornecido ou método incorreto.' }),
    };
  }
};
