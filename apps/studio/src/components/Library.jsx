import { useState } from "react";
const labels = {
  CHARACTER: "Personagem",
  OBJECT: "Objeto",
  BACKGROUND: "Cenário",
  AUDIO: "Áudio",
};
export function Library({
  items,
  books,
  assets,
  busy,
  onCreate,
  canWrite = false,
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("CHARACTER");
  const [ownerBookId, setOwner] = useState("");
  const [assetId, setAsset] = useState("");
  async function submit(event) {
    event.preventDefault();
    const ok = await onCreate({
      name,
      kind,
      ownerBookId: ownerBookId || null,
      assetId: assetId || null,
    });
    if (ok) {
      setName("");
      setAsset("");
    }
  }
  const eligibleAssets = assets.filter(
    (asset) =>
      (!asset.ownerBookId || asset.ownerBookId === ownerBookId) &&
      asset.mediaType.startsWith(kind === "AUDIO" ? "audio/" : "image/"),
  );
  return (
    <div className="library-layout">
      <section className="panel library-form">
        <h2>Adicionar ao catálogo</h2>
        <p className="muted">Organize os elementos das suas histórias.</p>
        <fieldset disabled={busy || !canWrite}>
          <form className="form-stack" onSubmit={submit}>
            <label>
              Nome do elemento
              <input
                required
                maxLength={200}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Raposa Luna"
              />
            </label>
            <label>
              Tipo
              <select
                value={kind}
                onChange={(event) => {
                  setKind(event.target.value);
                  setAsset("");
                }}
              >
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Disponibilidade
              <select
                value={ownerBookId}
                onChange={(event) => {
                  setOwner(event.target.value);
                  setAsset("");
                }}
              >
                <option value="">Global · todos os livros</option>
                {books
                  .filter((book) => book.status === "DRAFT")
                  .map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Asset cadastrado
              <select
                value={assetId}
                onChange={(event) => setAsset(event.target.value)}
              >
                <option value="">Somente metadados</option>
                {eligibleAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="button" disabled={busy}>
              {busy ? "Cadastrando…" : "Cadastrar elemento"}
            </button>
          </form>
        </fieldset>
        {!canWrite && (
          <p className="notice">
            Seu perfil tem acesso de consulta ao catálogo.
          </p>
        )}
        <p className="footnote">
          Importação de arquivos e edição visual chegarão nas próximas fases.
        </p>
      </section>
      <section className="panel catalog">
        <div className="section-heading">
          <h2>Elementos da biblioteca</h2>
          <span>{items.length} itens</span>
        </div>
        {!items.length ? (
          <div className="empty small">
            <span className="empty-mark">✳</span>
            <h3>Um universo para criar</h3>
            <p>Cadastre seu primeiro personagem, objeto, cenário ou áudio.</p>
          </div>
        ) : (
          <ul className="catalog-list">
            {items.map((item) => (
              <li key={item.id}>
                <span className="asset-symbol">
                  {labels[item.kind].slice(0, 1)}
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {labels[item.kind]} ·{" "}
                    {item.ownerBookId
                      ? books.find((book) => book.id === item.ownerBookId)
                          ?.title || "Livro exclusivo"
                      : "Biblioteca global"}
                  </small>
                </div>
                <span className="badge neutral">
                  {item.assetId ? "Asset vinculado" : "Metadados"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
