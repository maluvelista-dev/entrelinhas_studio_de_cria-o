# Fase 1 — fechamento editorial de 11/10/2026

Estado: implementado, validações em fechamento; aguarda aceite manual antes da Fase 2.

## Escopo aprovado

Após aceitar a Fase 0, o usuário definiu concluir a Fase 1 primeiro. Workflow até **Pronto para publicar**; **Publicado** e publicação efetiva continuam na Fase 10. Exclusão de personagens/cenários/objetos solicitada **somente na Biblioteca**, com bloqueio de itens em uso. A implementação preexistente de remoção de instâncias da página não foi ampliada.

## Entrega

- Categoria editorial em Novo livro e Sobre o livro: texto livre de até 100 caracteres, opcional para preservar livros anteriores; persistência, validação estrita e serializer explícito.
- Duplicar página: copia o documento salvo completo, incluindo texto, cena, instâncias, poses/animações e interações, para uma nova página ao final do mesmo livro. IDs locais da cena são preservados dentro de cada página independente; ID da página é novo. Assets e snapshots continuam compartilhados e imutáveis. Edição da cópia não altera o original.
- Excluir página: confirmação, validação de perfil/revisão/rascunho, exclusão transacional e numeração contínua. Não exclui personagens nem arquivos da Biblioteca.
- Excluir livro: disponível em Sobre o livro para administrador/editor, somente em rascunho, com confirmação. Remove páginas, versões e histórico atomicamente. **Bloqueado se houver publicação, assets, itens da Biblioteca ou modelos de movimento exclusivos desse livro**, para não apagar conteúdo dependente. Não transforma arquivos exclusivos em globais. Esta entrega não oferece limpeza geral de assets/modelos nem contorna esse bloqueio.
- Excluir da Biblioteca: disponível na ficha de personagem/cenário/objeto para administrador/editor. Verifica revisão e, quando exclusivo de livro, estado rascunho. Qualquer página/versionamento que ainda referencie o item impede a exclusão. Revisor não pode excluir; áudio está fora do pedido.
- Remoção do cadastro elimina snapshots sem referências atuais e metadados de imagens internas daquele personagem. Arquivos privados são removidos somente após commit. Assets compartilhados (incluindo a imagem de identificação) permanecem disponíveis e não são apagados. Falha de limpeza gera ASSET_DELETE_RECONCILIATION_REQUIRED com ID para reconciliação operacional; não desfaz o cadastro já excluído. Não há lixeira/restauração nesta entrega.
- Workflow: DRAFT → REVIEW pelo administrador/editor; REVIEW → READY_TO_PUBLISH pelo administrador/revisor; REVIEW ou READY_TO_PUBLISH → DRAFT pelo administrador/revisor. Sem salto direto de rascunho para aprovado. Livro aprovado continua privado e bloqueado para edição.
- Aprovação exige pelo menos uma página e valida capa, documentos e referências de cenas/arquivos existentes. Não representa a validação final de publicação das fases futuras. Transição/histórico/revisão são atômicos; PUBLISHED é recusado e publishedVersion permanece nulo.

## Contratos

Todos os endpoints exigem sessão, Origin, permissão, UUID válido e corpo estrito. DELETE aceita JSON com revision; não há parâmetros de força ou exclusão em cascata fornecidos pelo cliente.

| Endpoint | Resultado |
| --- | --- |
| DELETE /api/internal/library/:itemId | { deleted: true }; 409 LIBRARY_IN_USE quando referenciado |
| DELETE /api/internal/books/:bookId | { deleted: true }; 409 BOOK_IN_USE quando há dependências |
| DELETE /api/internal/books/:bookId/pages/:pageId | Livro serializado atualizado; 404 se página não pertence ao livro |
| POST /api/internal/books/:bookId/pages/:pageId/duplicate | 201 e livro atualizado; respeita limite de 500 páginas |
| POST /api/internal/books/:bookId/transitions | REVIEW → READY_TO_PUBLISH exige books:approve |

A categoria fica em editorialCategory no contrato e editorial_category no banco. Migration aditiva 009_editorial_category.sql validada no MariaDB 10.4.32 do serviço “MySQL” do XAMPP e no MariaDB 11.4.13 isolado; aplicada ao desenvolvimento em 11/10. MySQL 8 não é equivalente.

## Evidências

- 178 testes unitários/componentes aprovados.
- 20 testes de integração aprovados em cada MariaDB (local e alvo de produção isolado).
- Integrações incluem atualização de schema preservando dados/categoria padrão, reconexão, dois livros independentes, cópia de cena completa, renumeração, revisão desatualizada, IDs de outro livro, campos extras, permissões, bloqueio de item referenciado inclusive pela cópia, imagens internas versus compartilhadas, rollback da exclusão quando reordenação falha, concorrência entre salvar cena e excluir cadastro, aprovação e histórico atômicos.
- Lint e build: conferência final registrada ao término.
- E2E Opera/dev: conferência final registrada ao término; banco exclusivo de testes, sem exclusão de conteúdo real do usuário.
- Alterações locais não commitadas. Nenhuma VPS implantada nem fase seguinte iniciada.

## Aceite manual

Com o serviço “MySQL” do XAMPP ativo, executar npm.cmd run dev; a migration 009 já foi aplicada nesta máquina. Se a sessão não mostrar a nova permissão de aprovação, recarregar o Studio.

1. Criar um livro descartável, preencher Categoria editorial, salvar e recarregar.
2. Criar uma página, salvar texto, duplicar e editar a cópia; confirmar que a original permanece igual.
3. Cancelar uma exclusão de página, depois confirmar e verificar a ordem das restantes.
4. Enviar para revisão e, como administrador/revisor, Aprovar para publicação. Conferir histórico, edição bloqueada e retorno a rascunho. Publicação ainda indisponível.
5. Na Biblioteca, abrir um cadastro descartável em cada categoria e usar Excluir da Biblioteca. Cancelar deve preservar o cadastro. Item usado em página salva deve apresentar bloqueio e continuar disponível.
6. Em um livro descartável sem conteúdo exclusivo, usar Excluir livro e conferir a remoção da estante. Livro com dependências deve exibir bloqueio.
7. Aprovar a Fase 1 antes de iniciar o fechamento da Fase 2.
