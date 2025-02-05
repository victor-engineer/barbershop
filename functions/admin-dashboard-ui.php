<?php
// Inicia a sessão
session_start();

// Verifica se o usuário está logado
if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    // Redireciona para a página de login se não estiver autenticado
    header("Location: login.php");
    exit();
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel do Administrador</title>
    <link href="img/favicon.ico" rel="icon">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&family=Oswald:wght@600&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css" rel="stylesheet">
    <link href="../lib/animate/animate.min.css" rel="stylesheet">
    <link href="../lib/owlcarousel/assets/owl.carousel.min.css" rel="stylesheet">
    <link href="../css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <link rel="stylesheet" href="../css/admin-dashboard.css">
</head>
<body>
    <div class="dashboard">
        <aside class="dashboard-sidebar">
            <div class="logo">
                <h2><i class="fas fa-tachometer-alt"></i> Painel</h2>
            </div>
            <nav class="dashboard-nav">
                <ul>
                    <li><a href="/index.html"><i class="fas fa-home"></i> Início</a></li>
                    <li><a href="/schedule.html"><i class="fas fa-calendar-alt"></i> Agendamentos</a></li>
                    <li><a href="logout.php"><i class="fas fa-sign-out-alt"></i> Sair</a></li>
                </ul>
            </nav>
        </aside>

        <main class="dashboard-main">
            <header class="dashboard-header">
                <h1>Bem-vindo, Francisco!</h1>
            </header>

            <!-- Agendamentos -->
            <section class="appointments-section">
                <h2>Agendamentos</h2>
                <div id="response-message"></div>
                <table class="appointments-table table table-striped">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Data</th>
                            <th>Hora</th>
                            <th>Opções</th>
                        </tr>
                    </thead>
                    <tbody id="appointments-body">
                        <!-- Os agendamentos serão carregados aqui via JavaScript -->
                    </tbody>
                </table>
            </section>

            <!-- Novo Agendamento -->
            <section class="new-appointment-section">
                <h2>Agendar Novo Atendimento</h2>
                <form id="booking-form" class="form-group">
                    <div class="form-group">
                        <label for="client_name"><i class="fas fa-user"></i> Nome do Cliente:</label>
                        <input type="text" id="client_name" name="client_name" class="form-control" required autocomplete="off">
                    </div>

                    <div class="form-group">
                        <label for="date"><i class="fas fa-calendar"></i> Data:</label>
                        <input type="date" id="date" name="date" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label for="time"><i class="fas fa-clock"></i> Hora:</label>
                        <input type="time" id="time" name="time" class="form-control" required>
                    </div>

                    <button type="submit" class="btn btn-success">
                        <i class="fas fa-calendar-plus"></i> Agendar
                    </button>
                </form>
            </section>
        </main>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    <script src="../js/admin-dashboard.js"></script>
</body>
</html>
