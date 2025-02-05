const { Client } = require('pg'); // Cliente do PostgreSQL

// Configuração do banco de dados (Railway)
const client = new Client({
  connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway', // Substitua pela sua conexão do Railway
  ssl: { rejectUnauthorized: false } // Necessário para Railway
});

// Conectar ao banco antes de executar consultas
client.connect().catch(err => console.error('Erro ao conectar ao banco:', err));

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Permitir acesso de qualquer domínio
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Lidar com CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    if (event.httpMethod === "GET") {
      // Buscar agendamentos
      const res = await client.query('SELECT * FROM appointments');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, appointments: res.rows }),
      };
    }

    if (event.httpMethod === "POST") {
      // Criar novo agendamento
      const { client_name, date, time } = JSON.parse(event.body);

      if (!client_name || !date || !time) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Dados incompletos!' }),
        };
      }

      const result = await client.query(
        'INSERT INTO appointments (client_name, date, time) VALUES ($1, $2, $3)',
        [client_name, date, time]
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, message: 'Agendamento criado com sucesso!' }),
      };
    }

    if (event.httpMethod === "DELETE") {
      // Excluir agendamento
      const { id } = JSON.parse(event.body);

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: "ID do agendamento é obrigatório" }),
        };
      }

      // Verificar se o agendamento existe
      const checkExistence = await client.query('SELECT * FROM appointments WHERE id = $1', [id]);
      if (checkExistence.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, message: 'Agendamento não encontrado' }),
        };
      }

      // Excluir o agendamento
      await client.query('DELETE FROM appointments WHERE id = $1', [id]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Agendamento excluído com sucesso!' }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: "Método não permitido" }),
    };
  } catch (error) {
    console.error('Erro na API:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
