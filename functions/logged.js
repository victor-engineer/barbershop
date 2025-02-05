exports.handler = async (event, context) => {
    const cookies = event.headers.cookie || '';
    const loggedIn = cookies.includes('admin_logged_in=true'); // Verificar cookie de login
  
    if (loggedIn) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Você já está logado.' }),
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: 'Não autenticado.' }),
      };
    }
  };
  