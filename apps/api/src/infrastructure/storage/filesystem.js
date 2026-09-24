import path from "node:path";
import { createReadStream } from "node:fs";
import { mkdir, lstat, writeFile, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";

export class FilesystemStorage {
  constructor(root) {
    this.root = path.resolve(root);
  }
  async resolveKey(key, createParents = false) {
    if (
      typeof key !== "string" ||
      !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(key) ||
      key
        .split("/")
        .some(
          (part) =>
            part === "." ||
            part === ".." ||
            /[. ]$/.test(part) ||
            /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part),
        )
    ) {
      throw new Error("Chave de storage inválida.");
    }
    const destination = path.resolve(this.root, ...key.split("/"));
    if (!destination.startsWith(this.root + path.sep))
      throw new Error("Chave fora do storage.");
    // Check ancestors too: a configured root inside a symlink is rejected.
    const parts = destination
      .slice(path.parse(destination).root.length)
      .split(path.sep);
    let current = path.parse(destination).root;
    for (let index = 0; index < parts.length; index++) {
      current = path.join(current, parts[index]);
      try {
        const stat = await lstat(current);
        if (stat.isSymbolicLink())
          throw new Error("Symlinks não são permitidos no storage.");
        if (index < parts.length - 1 && !stat.isDirectory())
          throw new Error("Diretório de storage inválido.");
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        if (createParents && index < parts.length - 1) await mkdir(current);
        else if (index < parts.length - 1) return destination;
      }
    }
    return destination;
  }
  async put(key, bytes) {
    if (!Buffer.isBuffer(bytes)) throw new Error("Storage requer Buffer.");
    const destination = await this.resolveKey(key, true);
    await writeFile(destination, bytes, { flag: "wx" });
    return {
      key,
      byteSize: bytes.length,
      checksum: createHash("sha256").update(bytes).digest("hex"),
    };
  }
  async exists(key) {
    try {
      return (await lstat(await this.resolveKey(key))).isFile();
    } catch (error) {
      if (error.code === "ENOENT") return false;
      throw error;
    }
  }
  async openRead(key) {
    const destination = await this.resolveKey(key);
    if (!(await lstat(destination)).isFile())
      throw new Error("Asset não é arquivo.");
    return createReadStream(destination);
  }
  async delete(key) {
    await unlink(await this.resolveKey(key));
  }
}
