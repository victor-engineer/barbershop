const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway',
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      // Modificado para incluir os serviços diretamente da coluna 'service' na tabela 'appointments'
      const res = await pool.query(`
        SELECT id, date, time, client_name, whatsapp, service
        FROM appointments
        ORDER BY date, time
      `);
      return { statusCode: 200, body: JSON.stringify({ success: true, appointments: res.rows }) };
    } 
    
    else if (event.httpMethod === "POST") {
      const { client_name, date, time, service } = JSON.parse(event.body);
      
      if (!client_name || !date || !time || !service) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: "Todos os campos são obrigatórios!" }) };
      }

      const check = await pool.query('SELECT * FROM appointments WHERE date = $1 AND time = $2', [date, time]);
      if (check.rows.length > 0) {
        return { statusCode: 409, body: JSON.stringify({ success: false, error: "Horário já reservado!" }) };
      }

      // Inserção do agendamento com o serviço
      await pool.query('INSERT INTO appointments (client_name, date, time, service) VALUES ($1, $2, $3, $4)', [client_name, date, time, service]);

      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Agendamento criado com sucesso!' }) };
    } 
    
    else if (event.httpMethod === "DELETE") {
      // Alteração para pegar o ID da query string
      const { id } = event.queryStringParameters;
      
      if (!id) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: "ID do agendamento é obrigatório!" }) };
      }

      await pool.query('DELETE FROM appointments WHERE id = $1', [id]); // Exclui o agendamento
      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Agendamento removido com sucesso!' }) };
    } 
    
    else {
      return { statusCode: 405, body: JSON.stringify({ success: false, error: "Método não permitido" }) };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
  }
};
