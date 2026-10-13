import { z } from "zod";

export const idSchema = z.uuid();
export const revisionSchema = z.number().int().positive();
export const statusSchema = z.enum([
  "DRAFT",
  "REVIEW",
  "READY_TO_PUBLISH",
  "PUBLISHED",
]);
export const ageRangeSchema = z
  .strictObject({
    min: z.number().int().min(0).max(18),
    max: z.number().int().min(0).max(18),
  })
  .refine((value) => value.min <= value.max, {
    message: "Idade mínima deve ser menor ou igual à máxima.",
  });
export const metadataSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).default(""),
  editorialCategory: z.string().trim().max(100).default(""),
  ageRange: ageRangeSchema.nullable().default(null),
  cover: idSchema.nullable().default(null),
});
export const createBookSchema = metadataSchema.extend({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});
export const updateBookSchema = metadataSchema.extend({
  revision: revisionSchema,
});
export const revisionInputSchema = z.strictObject({ revision: revisionSchema });
export const pageContentSchema = z.strictObject({
  text: z.string().max(30000).default(""),
  narration: z.null().default(null),
});
export const pageDocumentSchema = z.strictObject({
  schemaVersion: z.literal(1),
  content: pageContentSchema,
  scene: z.strictObject({
    schemaVersion: z.literal(1),
    entities: z.array(z.never()).max(0),
  }),
  timeline: z.array(z.never()).max(0),
  automaticAnimations: z.array(z.never()).max(0),
  premiumInteractions: z.array(z.never()).max(0),
});
export function emptyPage(text = "") {
  return {
    schemaVersion: 1,
    content: { text, narration: null },
    scene: { schemaVersion: 1, entities: [] },
    timeline: [],
    automaticAnimations: [],
    premiumInteractions: [],
  };
}
export const createPageSchema = z.strictObject({
  revision: revisionSchema,
  document: pageDocumentSchema,
});
export const reorderSchema = z.strictObject({
  revision: revisionSchema,
  pageIds: z.array(idSchema).max(500),
});
export const transitionSchema = z.strictObject({
  revision: revisionSchema,
  status: statusSchema,
  comment: z.string().trim().max(1000).default(""),
});
export const librarySchema = z.strictObject({
  name: z.string().trim().min(1).max(200),
  kind: z.enum(["CHARACTER", "OBJECT", "BACKGROUND", "AUDIO"]),
  ownerBookId: idSchema.nullable().default(null),
  assetId: idSchema.nullable().default(null),
  schemaVersion: z.literal(1).default(1),
});
export const statusLabels = {
  DRAFT: "Rascunho",
  REVIEW: "Em revisão",
  READY_TO_PUBLISH: "Pronto para publicar",
  PUBLISHED: "Publicado",
};
