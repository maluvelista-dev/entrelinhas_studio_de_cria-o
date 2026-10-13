import { programSchema, sceneObjectSchema } from '@studio/schemas/actions';
import { pageSceneSchema } from '@studio/schemas/page';
import { templateSchema } from '@studio/schemas/motion';
import { characterSchema } from '@studio/schemas/character';
import { permissionsFor } from "../modules/auth/permissions.js";

// Output allowlists: adding a database field must never automatically expand the API.
export function serializeUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    active: Boolean(user.active),
    permissions: permissionsFor(user.role),
  };
}
export function serializeBookSummary(book) {
  return {
    id: book.id,
    slug: book.slug,
    title: book.title,
    status: book.status,
    revision: book.revision,
    version: book.version,
    pageCount: book.pageCount,
    cover: book.cover ?? null,
    updatedAt: book.updatedAt,
  };
}
export function serializePage(page) {
  return {
    id: page.id,
    position: page.position,
    schemaVersion: page.schemaVersion,
    content: { text: page.content.text, narration: null },
    scene: page.scene.schemaVersion >= 2 ? pageSceneSchema.parse(page.scene) : { schemaVersion: page.scene.schemaVersion, entities: [] },
    timeline: [],
    automaticAnimations: [],
    premiumInteractions: [],
  };
}
export function serializeBook(book) {
  return {
    id: book.id,
    slug: book.slug,
    title: book.title,
    description: book.description,
    editorialCategory: book.editorialCategory ?? '',
    ageRange: book.ageRange
      ? { min: book.ageRange.min, max: book.ageRange.max }
      : null,
    cover: book.cover,
    status: book.status,
    schemaVersion: book.schemaVersion,
    version: book.version,
    workingVersion: book.workingVersion,
    publishedVersion: book.publishedVersion,
    revision: book.revision,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
    pages: book.pages.map(serializePage),
    history: book.history.map((item) => ({
      id: item.id,
      fromStatus: item.fromStatus,
      toStatus: item.toStatus,
      actorId: item.actorId,
      actorName: item.actorName,
      comment: item.comment,
      createdAt: item.createdAt,
    })),
  };
}
export function serializeLibraryItem(item) {
  return {
    id: item.id,
    name: item.name,
    kind: item.kind,
    ownerBookId: item.ownerBookId,
    assetId: item.assetId,
    schemaVersion: item.schemaVersion,
    description: item.description ?? '',
    revision: item.revision ?? 1,
  };
}
export function serializeAsset(asset) {
  return {
    id: asset.id,
    name: asset.name,
    mediaType: asset.mediaType,
    ownerBookId: asset.ownerBookId,
    width: asset.width ?? null,
    height: asset.height ?? null,
    byteSize: asset.byteSize ?? null,
  };
}

// Strict schema is a recursive allowlist; no raw database JSON leaves this endpoint.
export function serializeRig(value) {
  return { id: value.id, revision: value.revision, assets: (value.assets || []).map(asset => ({ ...serializeAsset(asset), ownerCharacterId: asset.ownerCharacterId, perspectiveId: asset.perspectiveId, partId: asset.partId })), definition: value.definition === null ? null : characterSchema.parse(value.definition) };
}

export function serializeTemplate(value) { return { id: value.id, ...templateSchema.parse({ name: value.name, kind: value.kind, ownerBookId: value.ownerBookId, definition: value.definition }) }; }
export function serializePagePreview(value) { return { ...(value.program ? { program: programSchema.parse(value.program), objects: value.objects.map(item => ({ instance: sceneObjectSchema.parse(item.instance), kind: item.kind, asset: { id:item.asset.id,width:item.asset.width,height:item.asset.height } })) } : {}), width: value.width, height: value.height, characters: value.characters.map(actor => ({
  instance: pageSceneSchema.parse({ schemaVersion: 2, width: value.width, height: value.height, characters: [actor.instance] }).characters[0],
  definition: characterSchema.parse(actor.definition), assets: actor.assets.map(asset => ({ id: asset.id, width: asset.width, height: asset.height })),
  pose: actor.pose ? templateSchema.parse({ name: 'preview', kind: 'POSE', definition: actor.pose }).definition : null,
  animation: actor.animation ? templateSchema.parse({ name: 'preview', kind: 'ANIMATION', definition: actor.animation }).definition : null,
})) }; }
