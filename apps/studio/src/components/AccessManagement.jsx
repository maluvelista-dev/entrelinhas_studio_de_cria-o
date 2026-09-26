import { Toast } from './ui/Toast.jsx';
import { Button } from './ui/Button.jsx';
import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
const labels = {
  ADMIN: "Administrador",
  EDITOR: "Editor",
  REVIEWER: "Revisor",
};
function UserForm({ selected, currentUserId, busy, onSave, onCancel }) {
  const [username, setUsername] = useState(selected?.username || "");
  const [displayName, setName] = useState(selected?.displayName || "");
  const [role, setRole] = useState(selected?.role || "EDITOR");
  const [active, setActive] = useState(selected?.active ?? true);
  const [password, setPassword] = useState("");
  return (
    <form
      className="form-stack"
      onSubmit={async (event) => {
        event.preventDefault();
        const done = await onSave({
          username,
          displayName,
          role,
          active,
          password,
        });
        if (done) setPassword("");
      }}
    >
      <label>
        Nome de exibição
        <input
          required
          maxLength={120}
          value={displayName}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label>
        Usuário de acesso
        <input
          required
          minLength={3}
          maxLength={80}
          pattern="[a-z0-9][a-z0-9._\-]*"
          value={username}
          disabled={Boolean(selected)}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="off"
        />
      </label>
      <label>
        Perfil
        <select
          value={role}
          disabled={selected?.id === currentUserId}
          onChange={(event) => setRole(event.target.value)}
        >
          {Object.entries(labels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={active}
            disabled={selected.id === currentUserId}
            onChange={(event) => setActive(event.target.checked)}
          />
          Acesso ativo
        </label>
      )}
      <label>
        {selected ? "Nova senha (opcional)" : "Senha inicial"}
        <input
          type="password"
          autoComplete="new-password"
          required={!selected}
          minLength={12}
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <small>
          Mínimo de 12 caracteres. A senha nunca é exibida na listagem.
        </small>
      </label>
      {selected && (
        <p className="notice">
          Alterar perfil, desativar acesso ou redefinir senha encerra as sessões
          desse usuário.
        </p>
      )}
      <div className="form-actions">
        {selected && (
          <Button className="button secondary" type="button" onClick={onCancel}>
            Novo usuário
          </Button>
        )}
        <Button className="button" disabled={busy}>
          {busy ? "Salvando…" : selected ? "Salvar acesso" : "Criar acesso"}
        </Button>
      </div>
    </form>
  );
}
export function AccessManagement({ user }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formVersion, setFormVersion] = useState(0);
  const reload = useCallback(async () => {
    setUsers(await api("/internal/users"));
  }, []);
  useEffect(() => {
    reload().catch((failure) => setError(failure.message));
  }, [reload]);
  async function save(input) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (selected) {
        await api("/internal/users/" + selected.id, {
          method: "PUT",
          body: {
            displayName: input.displayName,
            role: input.role,
            active: input.active,
          },
        });
        if (input.password) {
          await api("/internal/users/" + selected.id + "/password", {
            method: "POST",
            body: { password: input.password },
          });
          if (selected.id === user.id) {
            window.dispatchEvent(new Event("studio-session-expired"));
            return true;
          }
        }
      } else {
        await api("/internal/users", {
          method: "POST",
          body: {
            username: input.username,
            displayName: input.displayName,
            role: input.role,
            password: input.password,
          },
        });
      }
      setNotice("Acesso salvo.");
      setSelected(null);
      setFormVersion((value) => value + 1);
      await reload();
      return true;
    } catch (failure) {
      setError(failure.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}
      {notice && (
        <Toast onDismiss={() => setNotice('')}>{notice}</Toast>
      )}
      <p className="notice">
        Administradores gerenciam acessos. Editores produzem e enviam para
        revisão. Revisores consultam e devolvem a rascunho. A equipe compartilha
        os livros deste Studio.
      </p>
      <div className="library-layout">
        <div className="panel library-form">
          <h2>{selected ? "Editar acesso" : "Novo acesso"}</h2>
          <UserForm
            key={(selected?.id || "new") + ":" + formVersion}
            selected={selected}
            currentUserId={user.id}
            busy={busy}
            onSave={save}
            onCancel={() => setSelected(null)}
          />
        </div>
        <div className="panel catalog">
          <h2>Equipe</h2>
          <ul className="catalog-list">
            {users.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.displayName}</strong>
                  <small>
                    {item.username} · {labels[item.role]} ·{" "}
                    {item.active ? "Ativo" : "Desativado"}
                  </small>
                </div>
                <Button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    setSelected(item);
                    setError("");
                    setNotice("");
                  }}
                  aria-label={"Editar acesso de " + item.username}
                >
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
