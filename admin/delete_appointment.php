<?php
include 'db_connection.php';
include('cors.php');

if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET['id'])) {
    // Sanitizar o ID recebido
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

    // Verificar se o ID é válido
    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'ID inválido ou não fornecido!']);
        exit;
    }

    // Verificar se o ID existe antes de deletar
    $checkQuery = "SELECT id FROM appointments WHERE id = $1";
    $checkResult = pg_query_params($conn, $checkQuery, [$id]);

    if (!$checkResult || pg_num_rows($checkResult) === 0) {
        echo json_encode(['success' => false, 'error' => 'Agendamento não encontrado!']);
        exit;
    }

    // Executar a exclusão
    $query = "DELETE FROM appointments WHERE id = $1";
    $result = pg_query_params($conn, $query, [$id]);

    if ($result && pg_affected_rows($result) > 0) {
        echo json_encode(['success' => true, 'message' => 'Agendamento excluído com sucesso!']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Erro ao excluir o agendamento: ' . pg_last_error($conn)]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'ID não fornecido ou método incorreto']);
}
?>
