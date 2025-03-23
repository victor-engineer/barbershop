exports.handler = async (event) => {
  // Defina origens permitidas
  const allowedOrigins = [
    "https://franciscobarbearia.netlify.app",
    "http://localhost:8888", // Permitir chamadas locais
    "https://franciscobarbearia.com.br"
  ];

  // Pegue a origem da requisição
  const requestOrigin = event.headers.origin || "";

  // Verifique se a origem está na lista de permitidas
  const allowedOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];

  if (!allowedOrigin) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Origem não permitida configurada corretamente.",
      }),
    };
  }

  const headers = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Vary": "Origin",  // Evitar cache incorreto
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: headers,
      body: "",
    };
  }

  // Lógica de sua função
  return {
    statusCode: 200,
    headers: headers,
    body: JSON.stringify({
      message: "CORS configurado com sucesso!",
    }),
  };
};
