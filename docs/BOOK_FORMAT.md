# Formato de livro — contrato provisório

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

IDs ilustrativos; produção usará UUIDs. Cover/narration referenciam assets por ID, sem caminhos locais. Contrato público será definido na Fase 11 e não exporá automaticamente o DTO interno. Schema desconhecido gera erro explícito; migração de contrato deve ter fixtures e testes de ida e volta. Ainda não implementar preenchimento livre de cenas que o Engine não consiga interpretar.
