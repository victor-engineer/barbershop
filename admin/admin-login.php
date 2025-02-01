<?php
// Inicia o buffer de saída
ob_start();

// Inclui o CORS (sempre depois do buffer de saída)
include_once 'cors.php';

// Configurações de erro
error_reporting(E_ALL);
ini_set('display_errors', 0);  // Não exibir erros diretamente

// Inicia a sessão (deve ser antes de qualquer saída)
session_start();

// Inclui a conexão com o banco de dados
include 'db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Prepara a consulta SQL com parâmetros
    $query = "SELECT * FROM admin_users WHERE username = $1 AND password = crypt($2, password)";
    
    // A consulta espera os parâmetros $1 e $2
    $result = pg_query_params($conn, $query, array($username, $password));

    if ($result) {
        // Verificando se existe um usuário com as credenciais fornecidas
        if (pg_num_rows($result) === 1) {
            // Inicia a sessão e redireciona para o painel do administrador
            $_SESSION['admin_logged_in'] = true;
            header("Location: /admin/admin-dashboard-ui.php");
            exit();
        } else {
            // Mensagem de erro genérica caso as credenciais estejam incorretas
            echo json_encode([
                "success" => false,
                "error" => "Usuário ou senha inválidos."
            ]);
        }
    } else {
        // Caso a consulta falhe, registramos o erro no log do servidor
        error_log("Erro ao consultar banco de dados para login: " . pg_last_error($conn));

        // Mensagem de erro genérica
        echo json_encode([
            "success" => false,
            "error" => "Erro ao tentar autenticar. Tente novamente mais tarde."
        ]);
    }
}

// Envia a saída do buffer para o navegador
ob_end_flush();
?>
