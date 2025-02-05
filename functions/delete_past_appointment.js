const { Client } = require('pg');

// Função que será chamada pelo Netlify Function
exports.handler = async (event, context) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL, // URL do seu banco de dados PostgreSQL
  });

  await client.connect();

  // Obtém a data e hora atual no formato Y-m-d H:i:s
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  try {
    // Consulta SQL para excluir agendamentos expirados
    const query = 'DELETE FROM appointments WHERE CONCAT(date, \' \', time) < $1';
    const result = await client.query(query, [now]);

    if (result.rowCount > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Agendamentos expirados removidos.' }),
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Nenhum agendamento expirado encontrado.' }),
      };
    }
  } catch (err) {
    console.error('Erro ao remover agendamentos expirados:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Erro ao remover agendamentos: ' + err.message }),
    };
  } finally {
    await client.end();
  }
};
