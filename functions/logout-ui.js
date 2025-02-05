// logout.js
exports.handler = async (event, context) => {
    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": "admin_logged_in=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT", // Apagar o cookie
        "Location": "/admin-login.html", // Redirecionar para a tela de login
      },
      body: JSON.stringify({ success: true, message: "Logout bem-sucedido!" }),
    };
  };
  