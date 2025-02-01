<?php
include 'db_connection.php';
include('cors.php');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = $_POST['id'];
    $client_name = $_POST['client_name'];
    $date = $_POST['date'];
    $time = $_POST['time'];

    $query = "UPDATE appointments SET client_name = '$client_name', date = '$date', time = '$time' WHERE id = $id";
    pg_query($conn, $query);

    header("Location: admin-dashboard.php");
}
?>
