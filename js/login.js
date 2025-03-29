document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Impede o envio tradicional do formulário

    const formData = new FormData(event.target);
    const data = {
        username: formData.get('username'),
        password: formData.get('password')
    };

    try {
        const response = await fetch('https://franciscobarbearia.netlify.app/.netlify/functions/admin-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            Swal.fire({
                title: 'Sucesso!',
                text: 'Login feito com sucesso!',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                window.location.href = 'admin-dashboard.html'; // Redireciona após o OK
            });
        } else {
            Swal.fire({
                title: 'Erro!',
                text: result.error || 'Erro no login.',
                icon: 'error',
                confirmButtonText: 'Tentar novamente'
            });
        }
    } catch (error) {
        Swal.fire({
            title: 'Erro!',
            text: 'Erro ao se conectar ao servidor: ' + error.message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
});