const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:mEhTBvMQxOhgHFtnlJfssbcoWrmVlHIx@viaduct.proxy.rlwy.net:49078/railway',
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      // Modificado para incluir os serviços associados aos agendamentos
      const res = await pool.query(`
        SELECT a.id, a.date, a.time, a.client_name, a.whatsapp, 
               array_agg(asv.service) AS services
        FROM appointments a
        LEFT JOIN appointment_services asv ON a.id = asv.appointment_id
        GROUP BY a.id
        ORDER BY a.date, a.time
      `);
      return { statusCode: 200, body: JSON.stringify({ success: true, appointments: res.rows }) };
    } 
    
    else if (event.httpMethod === "POST") {
      const { client_name, date, time, services } = JSON.parse(event.body);
      
      if (!client_name || !date || !time || !services) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: "Todos os campos são obrigatórios!" }) };
      }

      const check = await pool.query('SELECT * FROM appointments WHERE date = $1 AND time = $2', [date, time]);
      if (check.rows.length > 0) {
        return { statusCode: 409, body: JSON.stringify({ success: false, error: "Horário já reservado!" }) };
      }

      // Inserção do agendamento
      const result = await pool.query('INSERT INTO appointments (client_name, date, time) VALUES ($1, $2, $3) RETURNING id', [client_name, date, time]);
      const appointmentId = result.rows[0].id;

      // Inserção dos serviços associados ao agendamento
      const serviceQueries = services.map(service => {
        return pool.query('INSERT INTO appointment_services (appointment_id, service) VALUES ($1, $2)', [appointmentId, service]);
      });

      // Executa todas as inserções de serviços
      await Promise.all(serviceQueries);

      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Agendamento criado com sucesso!' }) };
    } 
    
    else if (event.httpMethod === "DELETE") {
      // Alteração para pegar o ID da query string
      const { id } = event.queryStringParameters;
      
      if (!id) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: "ID do agendamento é obrigatório!" }) };
      }

      await pool.query('DELETE FROM appointment_services WHERE appointment_id = $1', [id]); // Exclui os serviços associados
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
