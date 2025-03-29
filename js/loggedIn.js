document.addEventListener("DOMContentLoaded", function () {
    const isLoggedIn = localStorage.getItem("userLoggedIn"); 

    const userActionBtn = document.getElementById("user-action-btn");
    const logoutBtn = document.getElementById("logout-btn");

    // Verificando se o usuário está logado
    if (isLoggedIn === "true") { // Verifique se o valor é exatamente "true"
        userActionBtn.href = "schedule.html"; // Redireciona para o agendamento
        userActionBtn.innerHTML = 'Agendamento <i class="fa fa-calendar ms-3"></i>';
        logoutBtn.style.display = "block"; // Exibe o botão de logout
    } else {
        userActionBtn.href = "login-users.html"; // Redireciona para login
        userActionBtn.innerHTML = 'Entrar <i class="fa fa-sign-in ms-3"></i>';
        logoutBtn.style.display = "none"; // Esconde o botão de logout
    }
});

// Função para simular o login
function login() {
    localStorage.setItem("userLoggedIn", "true"); // Marca o usuário como logado
    window.location.href = "index.html"; // Redireciona para a página inicial após login
}

// Função para simular o logout
function logout() {
    localStorage.removeItem("userLoggedIn"); // Remove o status de login
    window.location.href = "index.html"; // Redireciona para a página inicial após logout
}
