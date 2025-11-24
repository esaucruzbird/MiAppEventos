// OJO: esto pone client_secret en el cliente. Solo para desarrollo.
// En producción, este paso se debería colcoar en el servidor mas que todo por seguridad
export async function exchangeCodeForToken({ code, clientId, clientSecret, redirectUri }) {
  const url = "https://github.com/login/oauth/access_token";

  const body = {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri
  };

  const params = new URLSearchParams(body).toString();

  const res = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  const json = await res.json();
  // json: { access_token, scope, token_type } o { error, error_description }
  return json;
}
