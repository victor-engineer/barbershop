const { Client } = require('pg');

// Função que será chamada pelo Netlify Function
exports.handler = async (event, context) => {
  // Configuração da conexão com o banco de dados
  const client = new Client({
    connectionString: process.env.DATABASE_URL, // Substitua com a URL do seu banco
  });

  await client.connect();

  if (event.httpMethod === "DELETE" && event.queryStringParameters && event.queryStringParameters.id) {
    const id = parseInt(event.queryStringParameters.id);

    // Validar se o ID é um número inteiro
    if (isNaN(id)) {
      return {
        statusCode: 400,
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
          body: JSON.stringify({ success: false, error: 'Agendamento não encontrado!' }),
        };
      }

      // Executar a exclusão do agendamento
      const deleteQuery = 'DELETE FROM appointments WHERE id = $1';
      const deleteResult = await client.query(deleteQuery, [id]);

      if (deleteResult.rowCount > 0) {
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, message: 'Agendamento excluído com sucesso!' }),
        };
      } else {
        return {
          statusCode: 500,
          body: JSON.stringify({ success: false, error: 'Erro ao excluir o agendamento.' }),
        };
      }

    } catch (err) {
      console.error("Erro no banco de dados: ", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: 'Erro ao processar a requisição.' }),
      };
    } finally {
      await client.end();
    }
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: 'ID não fornecido ou método incorreto.' }),
    };
  }
};
