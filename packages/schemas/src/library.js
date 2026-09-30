import { z } from 'zod';
import { librarySchema, idSchema, revisionSchema } from './index.js';
export const createLibrarySchema = librarySchema.extend({ description: z.string().trim().max(5000).default('') });
// Kind and scope remain fixed: changing them can invalidate existing references.
export const updateLibrarySchema = z.strictObject({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000),
  assetId: idSchema.nullable(),
  revision: revisionSchema,
});
