document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();  // Impede o envio tradicional do formulário
    
    const formData = new FormData(event.target);
    const data = {
        username: formData.get('username'),  // Verifique se o nome corresponde ao campo no HTML
        password: formData.get('password')   // Verifique se o nome corresponde ao campo no HTML
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
            alert('Login bem-sucedido!');
            // Redirecionar para o dashboard ou outra página
            window.location.href = 'admin-dashboard.html';
        } else {
            alert(result.error || 'Erro no login.');
        }
    } catch (error) {
        alert('Erro ao se conectar ao servidor: ' + error.message);
    }
});
