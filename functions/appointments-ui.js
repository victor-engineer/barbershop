exports.handler = async (event, context) => {
  if (event.httpMethod === "GET") {
    // Buscar agendamentos
    try {
      const res = await pool.query('SELECT * FROM appointments');
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, appointments: res.rows }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: err.message }),
      };
    }
  } else if (event.httpMethod === "POST") {
    // Criar novo agendamento
    const { client_name, date, time } = JSON.parse(event.body);
    try {
      const result = await pool.query(
        'INSERT INTO appointments(client_name, date, time) VALUES($1, $2, $3)',
        [client_name, date, time]
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Agendamento criado com sucesso!' }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: err.message }),
      };
    }
  } else if (event.httpMethod === "DELETE") {
    // Excluir agendamento
    const { id } = JSON.parse(event.body);

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "ID do agendamento é obrigatório" }),
      };
    }

    try {
      // Verificar se o agendamento existe
      const checkExistence = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
      if (checkExistence.rows.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ success: false, message: 'Agendamento não encontrado' }),
        };
      }

      // Excluir o agendamento
      const result = await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Agendamento excluído com sucesso!' }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: err.message }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ success: false, message: "Método não permitido" }),
  };
};
