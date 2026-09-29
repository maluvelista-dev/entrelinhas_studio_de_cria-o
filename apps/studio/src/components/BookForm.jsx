import { AssetImage } from './AssetImage.jsx';
import { Button } from './ui/Button.jsx';
import { useId, useState } from "react";
export function BookForm({
  book,
  assets = [],
  busy,
  onSave,
  onDirty = () => {},
  onCancel,
}) {
  const errorId = useId();
  const [title, setTitle] = useState(book?.title || "");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState(book?.description || "");
  const [min, setMin] = useState(book?.ageRange?.min ?? "");
  const [max, setMax] = useState(book?.ageRange?.max ?? "");
  const [cover, setCover] = useState(book?.cover || "");
  const [validation, setValidation] = useState("");
  function submit(event) {
    event.preventDefault();
    if (
      (min === "") !== (max === "") ||
      (min !== "" && Number(min) > Number(max))
    ) {
      setValidation(
        "Preencha as duas idades, com a mínima menor ou igual à máxima.",
      );
      return;
    }
    setValidation("");
    onSave({
      title,
      ...(!book ? { slug } : {}),
      description,
      ageRange: min === "" ? null : { min: Number(min), max: Number(max) },
      cover: cover || null,
    });
  }
  return (
    <form
      onSubmit={submit}
      onChange={() => onDirty(true)}
      className="form-stack"
    >

      <label>
        Título do livro
        <input
          autoFocus={!book}
          required
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Toda história começa com um nome"
        />
      </label>
      {!book && (
        <label>
          Identificador (slug)
          <input
            required
            maxLength={120}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="a-floresta-dos-sonhos"
          />
          <small>
            Use letras minúsculas, números e hífens. Este identificador
            permanece fixo.
          </small>
        </label>
      )}
      <label>
        Descrição
        <textarea
          rows={4}
          maxLength={5000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Sobre o que é esta história?"
        />
      </label>
      <div className="field-row">
        <label>
          Idade mínima
          <input
            type="number"
            aria-invalid={Boolean(validation)}
            aria-describedby={validation ? errorId : undefined}
            min="0"
            max="18"
            value={min}
            onChange={(event) => setMin(event.target.value)}
            placeholder="Ex.: 3"
          />
        </label>
        <label>
          Idade máxima
          <input
            type="number"
            aria-invalid={Boolean(validation)}
            aria-describedby={validation ? errorId : undefined}
            min="0"
            max="18"
            value={max}
            onChange={(event) => setMax(event.target.value)}
            placeholder="Ex.: 7"
          />
        </label>
      </div>
      {validation && (
        <p id={errorId} role="alert" className="inline-error">
          {validation}
        </p>
      )}
      <label>
        Asset de capa
        <select
          value={cover}
          onChange={(event) => setCover(event.target.value)}
        >
          <option value="">Sem capa por enquanto</option>
          {assets
            .filter(
              (asset) =>
                asset.mediaType.startsWith("image/") &&
                (!asset.ownerBookId || asset.ownerBookId === book?.id),
            )
            .map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
        </select>
        <small>
          Importe imagens na Biblioteca e selecione uma capa disponível para este livro.
        </small>
      </label>
      {cover && <AssetImage id={cover} alt="Prévia da capa selecionada" className="cover-preview" />}
      <div className="form-actions">
        {onCancel && (
          <Button type="button" className="button secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button className="button" disabled={busy}>
          {busy ? "Salvando…" : book ? "Salvar alterações" : "Criar livro"}
        </Button>
      </div>
    </form>
  );
}
