# Formato de livro — contrato inicial, schemaVersion 1

O DTO do Studio reúne Book e sua workingVersion. `version` identifica revisão editorial; `schemaVersion` identifica contrato de serialização; `revision` controla edições concorrentes. São conceitos independentes.

```json
{
  "schemaVersion": 1,
  "id": "book-id",
  "slug": "a-floresta",
  "workingVersion": 1,
  "publishedVersion": null,
  "version": 1,
  "revision": 1,
  "title": "A floresta",
  "description": "",
  "ageRange": null,
  "cover": null,
  "status": "DRAFT",
  "pages": [
    {
      "schemaVersion": 1,
      "id": "page-id",
      "position": 1,
      "content": { "text": "", "narration": null },
      "scene": { "schemaVersion": 1, "entities": [] },
      "timeline": [],
      "automaticAnimations": [],
      "premiumInteractions": []
    }
  ],
  "createdAt": "2026-09-23T12:00:00.000Z",
  "updatedAt": "2026-09-23T12:00:00.000Z"
}
```

IDs ilustrativos; a implementação usa UUIDs. Cover/narration referenciam assets por ID, sem caminhos locais. Contrato público será definido na Fase 11 e não exporá automaticamente o DTO interno. Schema desconhecido gera erro explícito; migração de contrato deve ter fixtures e testes de ida e volta. Ainda não implementar preenchimento livre de cenas que o Engine não consiga interpretar.

## Página v2 — personagens persistidos

O livro continua schemaVersion 1; suas páginas admitem versões 1 e 2. O módulo @studio/schemas/page é a entrada para validar documentos de páginas. Página v2 mantém content, timeline, automaticAnimations e premiumInteractions, com estes três arrays ainda vazios. scene agora tem schemaVersion=2, width, height e characters. Cada instância informa id, characterId, rigRevision, perspective, x, y, rotation, scaleX, scaleY, poseId e animationId. IDs de modelos podem ser null.

Referências são resolvidas e validadas na API. A gravação captura o rig por revisão; os arquivos são imutáveis. Salvar texto preserva a cena. Documentos v1 permanecem legíveis e são promovidos pelo editor ao salvar. Ver [guia e limites](CHARACTER_PACKS_AND_MOTION.md).
