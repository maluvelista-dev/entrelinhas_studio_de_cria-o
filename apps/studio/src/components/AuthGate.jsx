import { Button } from './ui/Button.jsx';
import { BookOpen } from 'lucide-react';
import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { App } from "../App.jsx";

export function AuthGate() {
  const [session, setSession] = useState(undefined);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refreshSession = useCallback(async () => {
    try {
      const value = await api("/auth/session");
      setSession(value.user);
      setError("");
    } catch (failure) {
      setError(failure.message);
      setSession(null);
    }
  }, []);

  useEffect(() => {
    refreshSession();
    const expired = () => {
      setSession(null);
      setError("Sua sessão terminou. Entre novamente.");
    };
    window.addEventListener("studio-session-expired", expired);
    return () => window.removeEventListener("studio-session-expired", expired);
  }, [refreshSession]);

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const value = await api("/auth/login", {
        method: "POST",
        body: { username, password },
      });
      setSession(value.user);
      setPassword("");
    } catch (failure) {
      setError(failure.message);
      setPassword("");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    await api("/auth/logout", { method: "POST", body: {} });
    setSession(null);
    setPassword("");
  }
  if (session === undefined)
    return (
      <div className="login-shell">
        <p role="status">Conferindo sua sessão…</p>
      </div>
    );
  if (session) return <App user={session} onLogout={logout} />;
  return (
    <main className="login-shell">
      <section className="panel login-card">
        <span className="brand-mark"><BookOpen aria-hidden="true" size={26} /></span>
        <p className="eyebrow">ENTRELINHAS · STUDIO INTERNO</p>
        <h1>Bem-vindo ao seu espaço de criação.</h1>
        <p className="muted">
          Entre com o acesso fornecido pelo administrador.
        </p>
        {error && (
          <p role="alert" className="inline-error">
            {error}
          </p>
        )}
        <form className="form-stack" onSubmit={login}>
          <label>
            Usuário
            <input
              autoComplete="username"
              autoFocus
              required
              value={username}
              minLength={3}
              maxLength={80}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <Button className="button" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </section>
    </main>
  );
}
