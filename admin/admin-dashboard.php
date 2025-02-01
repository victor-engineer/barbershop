<?php
// Inicia a sessão
session_start();

// Inclui a conexão com o banco de dados e o CORS
include 'db_connection.php';
include_once 'cors.php';

header('Content-Type: application/json');

// Verifica se o usuário está logado
if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    echo json_encode([
        "success" => false,
        "error" => "Não autorizado! Por favor, faça login."
    ]);
    exit();
}

// Define o fuso horário correto
date_default_timezone_set('America/Sao_Paulo'); 

// Obtém a data e hora atual
$now = date('Y-m-d H:i:s'); 

// Exclui agendamentos expirados antes de buscar os ativos
$deleteQuery = "DELETE FROM appointments WHERE CONCAT(date::text, ' ', time::text) < $1";
$deleteResult = pg_query_params($conn, $deleteQuery, [$now]);

if (!$deleteResult) {
    error_log("Erro ao remover agendamentos expirados: " . pg_last_error($conn));
}

// Consulta os agendamentos futuros no banco de dados
$query = "SELECT * FROM appointments WHERE CONCAT(date::text, ' ', time::text) >= $1 ORDER BY date, time";
$result = pg_query_params($conn, $query, [$now]);

if ($result) {
    $appointments = [];
    while ($row = pg_fetch_assoc($result)) {
        $appointments[] = [
            "id" => $row["id"],
            "client_name" => $row["client_name"],
            "date" => $row["date"],
            "time" => $row["time"]
        ];
    }

    echo json_encode([
        "success" => true,
        "appointments" => $appointments
    ]);
} else {
    // Registro de erro no servidor para não expor dados sensíveis ao usuário
    error_log("Erro ao recuperar os agendamentos: " . pg_last_error($conn));
    
    echo json_encode([
        "success" => false,
        "error" => "Erro ao recuperar os agendamentos. Tente novamente mais tarde."
    ]);
}

// Fecha a conexão com o banco de dados
pg_close($conn);
?>
