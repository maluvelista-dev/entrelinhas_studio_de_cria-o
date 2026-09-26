export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch("/api" + path, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Confira se ela está em execução.",
    );
  }
  if (response.status === 204) return null;
  if (response.status === 401 && !path.startsWith("/auth/"))
    window.dispatchEvent(new Event("studio-session-expired"));
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(
      "A API não respondeu como esperado. Confira se ela está em execução.",
    );
  }
  if (!response.ok) {
    const error = new Error(
      body.error?.message || "Não foi possível concluir a operação.",
    );
    error.code = body.error?.code;
    error.fields = body.error?.fields;
    throw error;
  }
  return body;
}
