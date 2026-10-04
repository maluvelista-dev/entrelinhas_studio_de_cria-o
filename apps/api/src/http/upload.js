import multer from 'multer';
import { AppError } from '../errors.js';
import { IMAGE_BYTE_LIMIT } from '../modules/assets/image.js';
let active = 0;
export function imageUpload(handler, serialize, { fieldSize = 1024 } = {}) {
  const parse = multer({ storage: multer.memoryStorage(), limits: {
    fileSize: IMAGE_BYTE_LIMIT, files: 1, fields: 3, parts: 4, fieldSize, fieldNameSize: 50,
  } }).single('file');
  return async (req, res) => {
    if (!req.is('multipart/form-data')) throw new AppError(415, 'MULTIPART_REQUIRED', 'Envie a imagem usando multipart/form-data.');
    if (active >= 2) throw new AppError(429, 'UPLOAD_BUSY', 'Há importações em andamento. Tente novamente em instantes.');
    active++;
    try {
      await new Promise((resolve, reject) => parse(req, res, error => error ? reject(error) : resolve()));
      if (req.aborted) return;
      res.status(201).json(serialize(await handler(req.body, req.file, req)));
    } catch (error) {
      if (error instanceof multer.MulterError) throw new AppError(error.code === 'LIMIT_FILE_SIZE' ? 413 : 422,
        'INVALID_UPLOAD', error.code === 'LIMIT_FILE_SIZE' ? 'A imagem deve ter até 10 MB.' : 'Envie um único arquivo e somente os campos permitidos.');
      if (error.message === 'Unexpected end of form') throw new AppError(400, 'INVALID_UPLOAD', 'Envio incompleto. Selecione o arquivo e tente novamente.');
      throw error;
    } finally { active--; }
  };
}
