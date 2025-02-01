<?php
$host = 'localhost'; // Alterar conforme necessário
$port = '5432';      // Porta padrão do PostgreSQL
$user = 'postgres';  // Seu usuário do PostgreSQL
$password = 'postgres'; // Sua senha do PostgreSQL
$dbname = 'barbershop';  // Nome do banco de dados

$conn = pg_connect("host=127.0.0.1 port=5432 dbname=barbershop user=postgres password=postgres");

if (!$conn) {
    die("Conexão falhou: " . pg_last_error());
}
?>
