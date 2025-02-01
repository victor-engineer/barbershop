<?php
include 'db_connection.php';
include('cors.php');

if (isset($_GET['id'])) {
    $id = $_GET['id'];

    $query = "SELECT * FROM appointments WHERE id = $id";
    $result = pg_query($conn, $query);
    $appointment = pg_fetch_assoc($result);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editar Agendamento</title>
    <link rel="stylesheet" href="../css/edit_appointment.css">
    <link href="img/favicon.ico" rel="icon">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&family=Oswald:wght@600&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css" rel="stylesheet">
</head>
<body>
    <form action="admin-dashboard-ui.php" method="POST">
        <input type="hidden" name="id" value="<?php echo $appointment['id']; ?>">
        
        <label for="client_name">Nome do Cliente:</label>
        <input type="text" id="client_name" name="client_name" value="<?php echo $appointment['client_name']; ?>" required><br>

        <label for="date">Data:</label>
        <input type="date" id="date" name="date" value="<?php echo $appointment['date']; ?>" required><br>

        <label for="time">Hora:</label>
        <input type="time" id="time" name="time" value="<?php echo $appointment['time']; ?>" required><br>

        <button type="submit">Atualizar</button>
    </form>
</body>
</html>
