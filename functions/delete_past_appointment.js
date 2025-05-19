const { Client } = require('pg');

// Função que será chamada pelo Netlify Function
exports.handler = async (event) => {
  const client = new Client({
    connectionString: 'postgresql://postgres:UMCdlnDVxeJwdWCIDwLbBQLihuXAwILY@shortline.proxy.rlwy.net:18696/railway', // URL do banco de dados PostgreSQL no Railway
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

  try {
    // Obtém a data e hora atual no formato UTC (Y-m-d H:i:s)
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Consulta SQL para excluir agendamentos expirados
    const query = 'DELETE FROM appointments WHERE CONCAT(date, \' \', time) < $1';
    const result = await client.query(query, [now]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: result.rowCount > 0 ? 'Agendamentos expirados removidos.' : 'Nenhum agendamento expirado encontrado.',
      }),
    };
  } catch (err) {
    console.error('Erro ao remover agendamentos expirados:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Erro ao remover agendamentos: ' + err.message }),
    };
  } finally {
    await client.end(); // Fechar conexão com o banco de dados
  }
};
