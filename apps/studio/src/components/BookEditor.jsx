import { editablePage } from '@studio/schemas/page';
import { PageScene } from './PageScene.jsx';
import { Button } from './ui/Button.jsx';
import { ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { StatusBadge } from './ui/StatusBadge.jsx';
import { useState } from "react";
import { emptyPage, statusLabels } from "@studio/schemas";
import { BookForm } from "./BookForm.jsx";
function PageForm({ page, book, editable, busy, onSave, onDirty }) {
  const [text, setText] = useState(page.content.text);
  const [scene, setScene] = useState(editablePage(page).scene);
  return (
    <form
      className="form-stack"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ ...editablePage(page), scene, content: { text, narration: null } });
      }}
    >
      <div className="section-heading">
        <h3>Página {page.position}</h3>
        <span>{text.length.toLocaleString("pt-BR")} / 30.000 caracteres</span>
      </div>
      <label>
        Texto da página
        <textarea
          disabled={busy || !editable}
          className="page-text"
          rows={14}
          maxLength={30000}
          value={text}
          placeholder="Era uma vez…"
          onChange={(event) => {
            setText(event.target.value);
            onDirty(true);
          }}
        />
      </label>
      <PageScene book={book} document={{ ...editablePage(page), scene, content: { text, narration: null } }} editable={editable} busy={busy} onChange={scene => { setScene(scene); onDirty(true); }} />
      <div className="form-actions">
        <Button className="button" disabled={busy || !editable}>
          {busy ? "Salvando…" : "Salvar página"}
        </Button>
      </div>
    </form>
  );
}
export function BookEditor({
  book,
  assets,
  busy,
  dirty,
  permissions = [],
  onDirty,
  onUpdate,
  onPage,
  onReorder,
  onTransition,
}) {
  const canEdit = permissions.includes("books:write");
  const canTransition = permissions.includes(
    book.status === "DRAFT" ? "books:submit" : "books:return",
  );
  const [tab, setTab] = useState("details");
  const [pageId, setPageId] = useState(null);
  const [comment, setComment] = useState("");
  const page = book.pages.find((item) => item.id === pageId) || book.pages[0];
  function change(action) {
    if (dirty && !window.confirm("Descartar alterações ainda não salvas?"))
      return;
    onDirty(false);
    action();
  }
  function move(index, direction) {
    const ids = book.pages.map((item) => item.id);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    change(() => onReorder(ids));
  }
  return (
    <section className="editor panel">
      <div className="editor-title">
        <div>
          <StatusBadge status={book.status} />
          <h2>{book.title}</h2>
          <p>
            /{book.slug} · Versão {book.version} · {book.pages.length} páginas
          </p>
        </div>
        <span className="revision">
          {dirty ? "Alterações não salvas" : "Revisão " + book.revision}
        </span>
      </div>
      <div className="tabs" role="tablist" aria-label="Editor do livro">
        {[
          ["details", "Sobre o livro"],
          ["pages", "Páginas"],
          ["review", "Revisão"],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            disabled={busy}
            aria-selected={tab === id}
            onClick={() => change(() => setTab(id))}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "details" && (
        <div className="editor-body">
          {book.status !== "DRAFT" && (
            <p className="notice">
              Este livro está em revisão. Devolva-o a rascunho para editar.
            </p>
          )}
          <fieldset disabled={busy || !canEdit || book.status !== "DRAFT"}>
            <BookForm
              key={book.revision}
              book={book}
              assets={assets}
              busy={busy}
              onSave={onUpdate}
              onDirty={onDirty}
            />
          </fieldset>
        </div>
      )}
      {tab === "pages" && (
        <div className="pages-layout">
          <aside className="page-list">
            <div className="section-heading">
              <h3>Páginas</h3>
              <span>{book.pages.length}</span>
            </div>
            {book.pages.map((item, index) => (
              <div
                className={
                  "page-row " + (page?.id === item.id ? "selected" : "")
                }
                key={item.id}
              >
                <button
                  className="page-select"
                  disabled={busy}
                  onClick={() => change(() => setPageId(item.id))}
                >
                  <span className="page-number">
                    {String(item.position).padStart(2, "0")}
                  </span>
                  <span>
                    {item.content.text.slice(0, 35) || "Página em branco"}
                  </span>
                </button>
                <div className="order-actions">
                  <button
                    aria-label={"Mover página " + item.position + " para cima"}
                    disabled={
                      busy || !canEdit || book.status !== "DRAFT" || index === 0
                    }
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp aria-hidden="true" size={16} />
                  </button>
                  <button
                    aria-label={"Mover página " + item.position + " para baixo"}
                    disabled={
                      busy ||
                      !canEdit ||
                      book.status !== "DRAFT" ||
                      index === book.pages.length - 1
                    }
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown aria-hidden="true" size={16} />
                  </button>
                </div>
              </div>
            ))}
            <Button
              className="button secondary full"
              disabled={busy || !canEdit || book.status !== "DRAFT"}
              onClick={() => change(() => onPage(emptyPage()))}
            >
              <Plus aria-hidden="true" size={16} /> Adicionar página
            </Button>
          </aside>
          <div className="page-content">
            {page ? (
              <div>
                <PageForm
                  key={page.id + ":" + book.revision}
                  page={page}
                  book={book} editable={canEdit && book.status === "DRAFT"}
                  busy={busy}
                  onDirty={onDirty}
                  onSave={(document) => onPage(document, page.id)}
                />
              </div>
            ) : (
              <div className="empty small">
                <span className="empty-mark">01</span>
                <h3>A primeira página espera por você</h3>
                <p>Adicione uma página e comece a escrever.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {tab === "review" && (
        <div className="editor-body">
          <h3>Um passo de cada vez</h3>
          <p className="muted">
            Envie o texto para revisão ou devolva-o a rascunho para continuar a
            edição.
          </p>
          <div className="workflow">
            <span className={book.status === "DRAFT" ? "current" : ""}>
              Rascunho
            </span>
            <span>→</span>
            <span className={book.status === "REVIEW" ? "current" : ""}>
              Em revisão
            </span>
          </div>
          <label>
            Comentário opcional
            <textarea
              value={comment}
              maxLength={1000}
              rows={3}
              onChange={(event) => setComment(event.target.value)}
            />
          </label>
          <Button
            className="button"
            disabled={
              busy ||
              !canTransition ||
              !["DRAFT", "REVIEW"].includes(book.status)
            }
            onClick={() => {
              change(() =>
                onTransition(
                  book.status === "DRAFT" ? "REVIEW" : "DRAFT",
                  comment,
                ),
              );
            }}
          >
            {book.status === "REVIEW"
              ? "Devolver a rascunho"
              : "Enviar para revisão"}
          </Button>
          <p className="notice">
            A publicação estará disponível após a implementação das validações
            editoriais.
          </p>
          <h3>Histórico editorial</h3>
          {!book.history.length && (
            <p className="muted">Nenhuma mudança de status registrada.</p>
          )}
          <ol className="history">
            {book.history.map((item) => (
              <li key={item.id}>
                <strong>
                  {statusLabels[item.fromStatus]} →{" "}
                  {statusLabels[item.toStatus]}
                </strong>
                <small>
                  {new Date(item.createdAt).toLocaleString("pt-BR")} ·{" "}
                  {item.actorName ||
                    (item.actorId
                      ? "Usuário identificado"
                      : "Ação local anterior ao login")}
                </small>
                {item.comment && <p>{item.comment}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
