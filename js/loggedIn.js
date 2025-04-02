document.addEventListener("DOMContentLoaded", function () {
    const isLoggedIn = localStorage.getItem("userLoggedIn") === "true"; // Garante que o valor seja "true"
    
    const userActionBtn = document.getElementById("user-action-btn");
    const logoutBtn = document.getElementById("logout-btn");

    if (isLoggedIn) {
        userActionBtn.href = "schedule.html"; // Redireciona para a página de agendamento
        userActionBtn.innerHTML = 'Agendamento <i class="fa fa-calendar ms-3"></i>';
        logoutBtn.style.display = "block"; // Exibe o botão de logout
    } else {
        userActionBtn.href = "login-users.html"; // Redireciona para login
        userActionBtn.innerHTML = 'Entrar <i class="fa fa-sign-in ms-3"></i>';
        logoutBtn.style.display = "none"; // Esconde o botão de logout
    }
});

// Função de Login Simulada
function login() {
    localStorage.setItem("userLoggedIn", "true");
    window.location.reload(); // Recarrega a página para refletir a mudança
}

// Função de Logout
function logout() {
    localStorage.removeItem("userLoggedIn");
    window.location.reload(); // Recarrega a página para refletir a mudança
}
