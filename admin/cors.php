<?php
// Permitir a origem específica
header("Access-Control-Allow-Origin: http://127.0.0.1:5501");

// Permitir envio de credenciais (se necessário)
header("Access-Control-Allow-Credentials: true");

// Métodos permitidos
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Cabeçalhos permitidos
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Evitar problemas de cache com origem dinâmica
header("Vary: Origin");

// Responder requisições preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}
?>
