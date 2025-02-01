<?php
include 'db_connection.php'; // Conexão com o banco
include_once 'cors.php'; // Permite requisições de diferentes origens

header('Content-Type: application/json'); // Define a saída como JSON

// Função para obter os agendamentos
function getScheduledAppointments($conn) {
    $query = "SELECT date, time FROM appointments";
    $result = pg_query($conn, $query);

    if (!$result) {
        echo json_encode(["error" => "Erro ao obter agendamentos."]);
        exit;
    }

    $appointments = [];
    while ($row = pg_fetch_assoc($result)) {
        $appointments[] = $row;
    }

    return $appointments;
}

// Verifica se a requisição é GET ou POST
if ($_SERVER["REQUEST_METHOD"] == "GET") {
    // Se for GET, retorna todos os agendamentos
    $appointments = getScheduledAppointments($conn);
    echo json_encode($appointments);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], "application/json") !== false) {
    $data = json_decode(file_get_contents("php://input"), true);

    // Log para depuração
    error_log("Dados recebidos: " . print_r($data, true));

    // Verifica se os dados necessários foram recebidos
    if (!$data || !isset($data['client_name'], $data['date'], $data['time'])) {
        echo json_encode(["error" => "Dados inválidos ou incompletos!"]);
        exit;
    }

    // Sanitização e validação dos dados recebidos
    $client_name = htmlspecialchars(trim($data['client_name']));
    $date = htmlspecialchars(trim($data['date']));
    $time = htmlspecialchars(trim($data['time']));

    // Validação de formato da data (YYYY-MM-DD)
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        echo json_encode(["error" => "Data inválida! Use o formato YYYY-MM-DD."]);
        exit;
    }

    // Validação de formato do horário (HH:MM)
    if (!preg_match('/^\d{2}:\d{2}$/', $time)) {
        echo json_encode(["error" => "Horário inválido! Use o formato HH:MM."]);
        exit;
    }

    $formatted_time = $time . ':00'; // Adiciona segundos ao horário

    // Verifica a conexão com o banco
    if (!$conn) {
        echo json_encode(["error" => "Falha na conexão com o banco de dados!"]);
        exit;
    }

    // Verifica se o horário já está reservado para a data
    $query_check = "SELECT 1 FROM appointments WHERE date = $1 AND time = $2";
    $check_result = pg_query_params($conn, $query_check, [$date, $formatted_time]);

    if (pg_num_rows($check_result) > 0) {
        echo json_encode([
            "success" => false,
            "error" => "O horário já está reservado!"
        ]);
        exit;
    }

    // Tentativa de inserção no banco de dados
    $query = "INSERT INTO appointments (client_name, date, time) VALUES ($1, $2, $3)";
    $result = pg_query_params($conn, $query, [$client_name, $date, $formatted_time]);

    // Verifica se a inserção foi bem-sucedida
    if ($result) {
        echo json_encode([
            "success" => true,
            "message" => "Reserva realizada com sucesso!",
            "client_name" => $client_name,
            "date" => $date,
            "time" => $formatted_time
        ]);
    } else {
        error_log("Erro no banco: " . pg_last_error($conn)); // Log para depuração
        echo json_encode([
            "success" => false,
            "error" => "Erro ao salvar a reserva. Detalhes: " . pg_last_error($conn)
        ]);
    }

    // Fecha a conexão
    pg_close($conn);
} else {
    echo json_encode([
        "success" => false,
        "error" => "Método não permitido ou formato de dados inválido!"
    ]);
}
?>
