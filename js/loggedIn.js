/*document.addEventListener("DOMContentLoaded", function () {
    const isLoggedIn = localStorage.getItem("userLoggedIn") === "true";

    const loginBtn = document.getElementById("login-btn");
    const loginBtnMobile = document.getElementById("login-btn-mobile");

    if (loginBtn && loginBtnMobile) { // Verifica se os botões existem antes de manipulá-los
        if (isLoggedIn) {
            // Usuário logado - Mostra "Agendamento"
            loginBtn.href = "schedule.html";
            loginBtn.innerHTML = 'Agendamento <i class="fa fa-calendar ms-3"></i>';

            loginBtnMobile.href = "schedule.html";
            loginBtnMobile.innerHTML = 'Agendamento <i class="fa fa-calendar ms-3"></i>';
        } else {
            // Usuário não logado - Mostra "Entrar"
            loginBtn.href = "login-users.html";
            loginBtn.innerHTML = 'Entrar <i class="fa fa-sign-in ms-3"></i>';

            loginBtnMobile.href = "login-users.html";
            loginBtnMobile.innerHTML = 'Entrar <i class="fa fa-sign-in ms-3"></i>';
        }
    }
});

// Função para simular login
function login() {
    localStorage.setItem("userLoggedIn", "true");
    window.location.href = "index.html"; // Recarrega a página inicial após login
}

// Função para simular logout
function logout() {
    localStorage.removeItem("userLoggedIn");
    window.location.href = "index.html"; // Recarrega a página inicial após logout
} */