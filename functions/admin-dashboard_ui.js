const { Client } = require('pg');
const jwt = require('jsonwebtoken');

// Função para validar o token JWT
function validateJwtToken(token) {
  const secretKey = "secrect_key"; // Chave secreta
  try {
    const decoded = jwt.verify(token, secretKey);
    return decoded;
  } catch (error) {
    return false;
  }
}

// Função para obter agendamentos futuros
async function getUpcomingAppointments(client) {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' '); // Obtém data e hora atual no formato 'YYYY-MM-DD HH:MM'

  // Exclui agendamentos expirados
  const deleteQuery = "DELETE FROM appointments WHERE date || ' ' || time < $1";
  await client.query(deleteQuery, [now]);

  // Consulta os agendamentos futuros
  const query = "SELECT * FROM appointments WHERE date || ' ' || time >= $1 ORDER BY date, time";
  const result = await client.query(query, [now]);

  return result.rows.map(row => ({
    id: row.id,
    client_name: row.client_name,
    date: row.date,
    time: row.time
  }));
}

// Função principal da Netlify Function
exports.handler = async (event) => {
  const client = new Client({
    connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway', // URL de conexão do Railway
    ssl: { rejectUnauthorized: false } // Necessário para conexões seguras no Railway
  });

  try {
    // Conectar ao banco de dados
    await client.connect();

    // Obtém o token JWT do cabeçalho da requisição
    const token = event.headers.Authorization ? event.headers.Authorization.replace('Bearer ', '') : null;

    // Valida o token JWT
    if (!token || !validateJwtToken(token)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Não autorizado! Token inválido ou ausente.' }),
      };
    }

    // Verifica o método HTTP
    if (event.httpMethod === 'GET') {
      // Se for GET, retorna os agendamentos futuros
      const appointments = await getUpcomingAppointments(client);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, appointments }),
      };
    }

    if (event.httpMethod === 'POST') {
      // Lê os dados do POST
      const data = JSON.parse(event.body);

      // Valida os dados recebidos
      if (!data.client_name || !data.date || !data.time) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Dados inválidos ou incompletos!' }),
        };
      }

      const client_name = data.client_name.trim();
      const date = data.date.trim();
      const time = data.time.trim();

      // Validação de formato de data (YYYY-MM-DD) e hora (HH:MM)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const timeRegex = /^\d{2}:\d{2}$/;

      if (!dateRegex.test(date)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Data inválida! Use o formato YYYY-MM-DD.' }),
        };
      }

      if (!timeRegex.test(time)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Horário inválido! Use o formato HH:MM.' }),
        };
      }

      const formatted_time = `${time}:00`;

      // Verifica se o horário já está reservado
      const checkQuery = "SELECT 1 FROM appointments WHERE date = $1 AND time = $2";
      const checkResult = await client.query(checkQuery, [date, formatted_time]);

      if (checkResult.rowCount > 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'O horário já está reservado!' }),
        };
      }

      // Inserção no banco de dados
      const insertQuery = "INSERT INTO appointments (client_name, date, time) VALUES ($1, $2, $3)";
      await client.query(insertQuery, [client_name, date, formatted_time]);

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Reserva realizada com sucesso!',
          client_name,
          date,
          time: formatted_time,
        }),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido!' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno do servidor!' }),
    };
  } finally {
    await client.end();
  }
};
