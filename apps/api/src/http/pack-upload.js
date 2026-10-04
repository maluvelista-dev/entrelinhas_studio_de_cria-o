import multer from 'multer';
import { AppError } from '../errors.js';
let active = false;
export function packUpload(handler, serializer) {
  const parse = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1, fields: 1, parts: 2, fieldSize: 100 } }).single('file');
  return async (req, res) => {
    if (!req.is('multipart/form-data')) throw new AppError(415, 'MULTIPART_REQUIRED', 'Envie o pacote como arquivo.');
    if (active) throw new AppError(429, 'PACK_BUSY', 'Outra importação está em andamento.');
    active = true;
    try {
      await new Promise((resolve, reject) => parse(req, res, error => error ? reject(error) : resolve()));
      if (!req.aborted) res.status(201).json(serializer(await handler(req.body, req.file)));
    } catch (error) {
      if (error instanceof multer.MulterError) throw new AppError(error.code === 'LIMIT_FILE_SIZE' ? 413 : 422, 'INVALID_PACK', 'Envie um pacote de até 25 MB e somente os campos permitidos.');
      throw error;
    } finally { active = false; }
  };
}
