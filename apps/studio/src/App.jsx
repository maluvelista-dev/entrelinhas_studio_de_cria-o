import { useCallback, useEffect, useState } from "react";
import { statusLabels } from "@studio/schemas";
import { api } from "./api.js";
import { BookForm } from "./components/BookForm.jsx";
import { BookEditor } from "./components/BookEditor.jsx";
import { Library } from "./components/Library.jsx";
import { AccessManagement } from "./components/AccessManagement.jsx";

export function App({ user, onLogout }) {
  const can = permission => user?.permissions?.includes(permission) ?? false;
  const [section, setSection] = useState("books");
  const [books, setBooks] = useState([]);
  const [items, setItems] = useState([]);
  const [assets, setAssets] = useState([]);
  const [book, setBook] = useState(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");
  const refresh = useCallback(async () => {
    const [nextBooks, nextItems, nextAssets] = await Promise.all([
      api("/internal/books"),
      api("/internal/library"),
      api("/internal/assets"),
    ]);
    setBooks(nextBooks);
    setItems(nextItems);
    setAssets(nextAssets);
  }, []);
  useEffect(() => {
    let active = true;
    refresh()
      .catch((err) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  useEffect(() => {
    const warn = (event) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function canNavigate() {
    return !dirty || window.confirm("Descartar alterações ainda não salvas?");
  }
  function navigate(next) {
    if (!canNavigate() || busy) return;
    setDirty(false);
    setSection(next);
    setCreating(false);
    setBook(null);
    setNotice("");
    setError(null);
  }
  async function openBook(id) {
    if (!canNavigate() || busy) return;
    setBusy(true);
    setError(null);
    setNotice("");
    setDirty(false);
    try {
      setBook(await api("/internal/books/" + id));
      setCreating(false);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  async function mutate(path, method, body, isBook = true) {
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      const result = await api(path, { method, body });
      if (isBook) {
        setBook(result);
        setCreating(false);
        setDirty(false);
      }
      setNotice("Salvo com sucesso.");
      try {
        await refresh();
      } catch {
        setNotice(
          "Salvo. A lista não pôde ser atualizada; tente recarregá-la.",
        );
      }
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const visibleBooks = books.filter((item) =>
    item.title
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            navigate("books");
          }}
        >
          <span className="brand-mark">e.</span>
          <span>
            entrelinhas<small>STUDIO CRIATIVO</small>
          </span>
        </a>
        <p className="nav-caption">SEU ESPAÇO DE CRIAÇÃO</p>
        <nav aria-label="Navegação principal">
          <button
            className={section === "books" ? "active" : ""}
            disabled={busy}
            onClick={() => navigate("books")}
          >
            <span>▤</span> Meus livros <b>{books.length}</b>
          </button>
          <button
            className={section === "library" ? "active" : ""}
            disabled={busy}
            onClick={() => navigate("library")}
          >
            <span>✳</span> Biblioteca <b>{items.length}</b>
          </button>
          {can("users:manage") && <button className={section === "access" ? "active" : ""} disabled={busy} onClick={() => navigate("access")}><span>⚿</span> Acessos</button>}
        </nav>
        <div className="sidebar-note">
          <span>
            PEQUENAS HISTÓRIAS.
            <br />
            GRANDES DESCOBERTAS.
          </span>
          <p>
            Um lugar para dar vida
            <br />à imaginação.
          </p>
          <div className="orbit">✦</div>
        </div>
        <div className="workspace">
          <span className="workspace-avatar">E</span>
          <div>
            {user?.displayName}<small>{user?.role === "ADMIN" ? "Administrador" : user?.role === "EDITOR" ? "Editor" : "Revisor"}</small>
          </div>
          
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>
            Workspace <span className="breadcrumb">/</span>{" "}
            {section === "books" ? "Meus livros" : section === "access" ? "Acessos" : "Biblioteca"}
          </span>
          <div className="topbar-account"><span className="local-label">● Studio interno</span><button className="back-link" disabled={busy} onClick={async () => { if (!canNavigate()) return; try { await onLogout(); } catch (failure) { setError(failure); } }}>Sair</button></div>
        </header>
        <div className="main-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">DA PRIMEIRA IDEIA À PRÓXIMA HISTÓRIA</p>
              <h1>
                {section === "books"
                  ? "Suas histórias começam aqui."
                  : section === "access" ? "Cada pessoa, o acesso certo." : "Um universo de possibilidades."}
              </h1>
              <p>
                {section === "books"
                  ? "Crie, organize e prepare seus livros para ganhar o mundo."
                  : section === "access" ? "Gerencie os perfis e as contas da sua equipe." : "Personagens, cenários e elementos que conectam suas histórias."}
              </p>
            </div>
            {section === "books" && can("books:write") && (
              <button
                className="button"
                disabled={busy || loading}
                onClick={() => {
                  if (canNavigate()) {
                    setCreating(true);
                    setBook(null);
                    setDirty(false);
                    setError(null);
                  }
                }}
              >
                + Novo livro
              </button>
            )}
          </div>
          {error && (
            <div role="alert" className="error-banner">
              <div>
                <strong>{error.message}</strong>
                {error.fields?.map((field) => (
                  <small key={field.path}>
                    {field.path}: {field.message}
                  </small>
                ))}
              </div>
              <button
                className="button secondary"
                disabled={busy}
                onClick={async () => {
                  if (!canNavigate()) return;
                  setError(null);
                  setLoading(true);
                  try {
                    if (book) {
                      setBook(await api("/internal/books/" + book.id));
                      setDirty(false);
                    }
                    await refresh();
                  } catch (err) {
                    setError(err);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Recarregar
              </button>
            </div>
          )}
          {notice && (
            <p role="status" className="success-notice">
              ✓ {notice}
            </p>
          )}
          {loading ? (
            <div className="panel loading" role="status">
              Carregando seu espaço de criação…
            </div>
          ) : section === "access" ? (
            <AccessManagement user={user} />
          ) : section === "library" ? (
            <Library
              canWrite={can("library:write")}
              items={items}
              books={books}
              assets={assets}
              busy={busy}
              onCreate={(input) =>
                mutate("/internal/library", "POST", input, false)
              }
            />
          ) : (
            <>
              <div className="stats">
                <div>
                  <span className="stat-icon">▤</span>
                  <div>
                    <strong>{books.length}</strong>
                    <span>Livros no Studio</span>
                  </div>
                </div>
                <div>
                  <span className="stat-icon peach">✎</span>
                  <div>
                    <strong>
                      {books.filter((item) => item.status === "DRAFT").length}
                    </strong>
                    <span>Em criação</span>
                  </div>
                </div>
                <div>
                  <span className="stat-icon lilac">✓</span>
                  <div>
                    <strong>
                      {books.filter((item) => item.status === "REVIEW").length}
                    </strong>
                    <span>Em revisão</span>
                  </div>
                </div>
              </div>
              {creating ? (
                <section className="panel create-panel">
                  <p className="eyebrow">UMA NOVA JORNADA</p>
                  <h2>Vamos começar um livro</h2>
                  <BookForm
                    assets={assets}
                    busy={busy}
                    onDirty={setDirty}
                    onCancel={() => {
                      if (canNavigate()) {
                        setCreating(false);
                        setDirty(false);
                      }
                    }}
                    onSave={(input) => mutate("/internal/books", "POST", input)}
                  />
                </section>
              ) : book ? (
                <>
                  <button
                    className="back-link"
                    disabled={busy}
                    onClick={() => {
                      if (canNavigate()) {
                        setBook(null);
                        setDirty(false);
                      }
                    }}
                  >
                    ← Todos os livros
                  </button>
                  <BookEditor
                    permissions={user.permissions}
                    key={book.id}
                    book={book}
                    assets={assets}
                    busy={busy}
                    dirty={dirty}
                    onDirty={setDirty}
                    onUpdate={(input) =>
                      mutate("/internal/books/" + book.id, "PUT", {
                        ...input,
                        revision: book.revision,
                      })
                    }
                    onPage={(document, pageId) =>
                      mutate(
                        "/internal/books/" +
                          book.id +
                          "/pages" +
                          (pageId ? "/" + pageId : ""),
                        pageId ? "PUT" : "POST",
                        { document, revision: book.revision },
                      )
                    }
                    onReorder={(pageIds) =>
                      mutate(
                        "/internal/books/" + book.id + "/page-order",
                        "PUT",
                        { pageIds, revision: book.revision },
                      )
                    }
                    onTransition={(status, comment) =>
                      mutate(
                        "/internal/books/" + book.id + "/transitions",
                        "POST",
                        { status, comment, revision: book.revision },
                      )
                    }
                  />
                </>
              ) : (
                <section className="panel collection">
                  <div className="collection-heading">
                    <div>
                      <h2>Sua estante</h2>
                      <span>
                        {books.length} histórias, infinitas possibilidades
                      </span>
                    </div>
                    <label className="search">
                      <span className="sr-only">Buscar livros</span>
                      <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar uma história…"
                      />
                    </label>
                  </div>
                  {!visibleBooks.length ? (
                    <div className="empty">
                      <div className="book-illustration">
                        <div className="book-back" />
                        <div className="book-front">
                          <span>
                            Era
                            <br />
                            uma
                            <br />
                            <em>vez.</em>
                          </span>
                          <i>✦</i>
                        </div>
                        <b>✦</b>
                      </div>
                      <h3>
                        {books.length
                          ? "Nenhuma história encontrada"
                          : "A próxima grande história é sua"}
                      </h3>
                      <p>
                        {books.length
                          ? "Tente buscar por outro título."
                          : "Sua estante ainda está vazia. Comece com uma ideia, um título e uma primeira página."}
                      </p>
                      {!books.length && can("books:write") && (
                        <button
                          className="button secondary"
                          onClick={() => setCreating(true)}
                        >
                          Criar meu primeiro livro →
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="book-grid">
                      {visibleBooks.map((item, index) => (
                        <button
                          className="book-card"
                          key={item.id}
                          disabled={busy}
                          onClick={() => openBook(item.id)}
                        >
                          <div className={"book-cover cover-" + (index % 4)}>
                            <span className="cover-kicker">
                              ENTRELINHAS · HISTÓRIAS
                            </span>
                            <strong>{item.title}</strong>
                            <span className="cover-star">✳</span>
                            <small>Versão {item.version}</small>
                          </div>
                          <div className="book-card-details">
                            <span
                              className={"badge " + item.status.toLowerCase()}
                            >
                              {statusLabels[item.status]}
                            </span>
                            <h3>{item.title}</h3>
                            <p>
                              {item.pageCount} páginas ·{" "}
                              {new Date(item.updatedAt).toLocaleDateString(
                                "pt-BR",
                              )}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
          <footer>
            Feito para imaginar. Organizado para criar.
            <span>Entrelinhas Studio · Fase 1</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
