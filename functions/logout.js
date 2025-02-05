exports.handler = async (event, context) => {
  // Destruir a sessão (simulando com cookies)
  const headers = {
    'Set-Cookie': [
      'session_id=; Path=/; Max-Age=0', // Simula a destruição da sessão
      'user=; Path=/; Max-Age=0' // Limpeza de outros cookies relacionados ao usuário
    ],
    'Location': '/admin-login.html', // Redireciona para a página de login
    'Cache-Control': 'no-store', // Evita cache
    'Pragma': 'no-cache'
  };

  // Retorna o redirecionamento para a página de login
  return {
    statusCode: 302, // Código de redirecionamento
    headers: headers,
    body: JSON.stringify({ success: true, message: 'Sessão encerrada e redirecionando para login.' })
  };
};
