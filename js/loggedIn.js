document.addEventListener("DOMContentLoaded", function () {
    const isLoggedIn = localStorage.getItem("userLoggedIn"); 

    const userActionBtn = document.getElementById("user-action-btn");
    const logoutBtn = document.getElementById("logout-btn");

    if (isLoggedIn) {
        userActionBtn.href = "schedule.html";
        userActionBtn.innerHTML = 'Agendamento <i class="fa fa-calendar ms-3"></i>';
        logoutBtn.style.display = "block"; // Mostra o botão de logout
    } else {
        userActionBtn.href = "login.html";
        userActionBtn.innerHTML = 'Login <i class="fa fa-sign-in ms-3"></i>';
        logoutBtn.style.display = "none"; // Esconde o botão de logout
    }
});

// Simulando login bem-sucedido
function login() {
    localStorage.setItem("userLoggedIn", "true"); // Salva que o usuário está logado
    window.location.href = "index.html"; // Redireciona para a página inicial
}

// Simulando logout
function logout() {
    localStorage.removeItem("userLoggedIn"); // Remove o status de login
    window.location.href = "index.html"; // Redireciona para a página inicial
}
