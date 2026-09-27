// One manager owns one preview's textures. Runtime documents contain IDs, never URLs.
export class AssetManager {
  #assets; #load; #destroy; #pending = new Map(); #owned = new Set(); #closed = false;
  constructor(assets, { load, destroy }) {
    this.#assets = new Map([...assets].map(([id, descriptor]) => [id, structuredClone(descriptor)]));
    this.#load = load; this.#destroy = destroy;
  }
  load(id) {
    if (this.#closed) return Promise.reject(new Error('AssetManager encerrado.'));
    if (this.#pending.has(id)) return this.#pending.get(id);
    const descriptor = this.#assets.get(id);
    if (!descriptor || descriptor.kind !== 'sprite') return Promise.reject(new Error('Asset de imagem não cadastrado.'));
    const pending = Promise.resolve().then(() => this.#load(descriptor)).then(async resource => {
      if (this.#closed) { await this.#destroy(resource); throw new Error('AssetManager encerrado.'); }
      this.#owned.add(resource);
      return resource;
    }).catch(error => { this.#pending.delete(id); throw error; });
    this.#pending.set(id, pending);
    return pending;
  }
  async loadAll(ids) {
    const unique = [...new Set(ids)];
    const results = await Promise.all(unique.map(id => this.load(id)));
    return new Map(unique.map((id, index) => [id, results[index]]));
  }
  async dispose() {
    if (this.#closed) return;
    this.#closed = true;
    await Promise.allSettled(this.#pending.values());
    const results = await Promise.allSettled([...this.#owned].map(resource => this.#destroy(resource)));
    this.#pending.clear(); this.#owned.clear();
    if (results.some(result => result.status === 'rejected')) throw new Error('Falha ao liberar um recurso gráfico.');
  }
}
