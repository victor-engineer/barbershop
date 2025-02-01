<?php
include 'db_connection.php';
include_once 'cors.php';

date_default_timezone_set('America/Sao_Paulo'); // Defina o fuso horário correto

$now = date('Y-m-d H:i:s'); // Data e hora atual

// Exclui agendamentos cujo horário já passou
$query = "DELETE FROM appointments WHERE CONCAT(date, ' ', time) < $1";
$result = pg_query_params($conn, $query, [$now]);

if ($result) {
    echo json_encode(["success" => true, "message" => "Agendamentos expirados removidos."]);
} else {
    echo json_encode(["success" => false, "error" => "Erro ao remover agendamentos: " . pg_last_error($conn)]);
}

pg_close($conn);
?>
