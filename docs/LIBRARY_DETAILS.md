# Biblioteca por categoria e fichas editáveis

Ampliação autorizada em 30/09/2026 durante a Fase 3. Preserva o Tema A e não inicia o editor de rig nem as próximas fases.

## Uso

Abra Biblioteca e escolha Personagens, Cenários ou Objetos. Áudios mantém os registros de catálogo existentes; não habilita importação de áudio. Cada área exibe somente seus itens e sua contagem. A importação de ilustração usa o tipo da área selecionada.

Clique no nome de um item para abrir sua ficha. Admin e Editor podem alterar nome, descrição (até 5000 caracteres) e arquivo vinculado. A imagem selecionada tem prévia autenticada. Selecione Sem arquivo vinculado para remover o vínculo sem apagar o arquivo. Para uma nova imagem, volte ao catálogo, importe e selecione-a na ficha. A importação continua criando seu próprio item de Biblioteca.

Salvar cadastro persiste a edição. Recarregar cadastro busca a versão atual. Trocar de área, voltar, recarregar ou sair com edição pendente exige confirmação de descarte. Tipo e disponibilidade permanecem fixos para preservar referências. A edição da ficha não modifica capas que já apontam diretamente para um asset.

Revisores consultam a ficha com campos desabilitados. Itens exclusivos de livros fora de rascunho não podem ser editados. Itens globais permanecem compartilhados entre a equipe; escopo por livro limita reutilização, não a visibilidade entre leitores autorizados.

## API e dados

GET /api/internal/library/:itemId e PUT /api/internal/library/:itemId exigem sessão e library:read ou library:write. PUT aceita somente name, description, assetId e revision. IDs e parâmetros são validados; campos extras são recusados. Não permite alterar kind, ownerBookId, definition_json ou dados de rig.

A atualização bloqueia o registro na transação e compara sua revisão. Uma revisão antiga retorna 409, sem sobrescrever o cadastro. Assets precisam existir, ter o tipo compatível e ser globais ou do mesmo livro. Serializers expõem somente campos permitidos, incluindo descrição e revisão; textos são renderizados pelo React, sem interpretação como HTML.

Migration 005_library_details.sql adiciona description vazia e revision 1 aos registros existentes, preservando nomes, tipos e vínculos. Validada no MariaDB 10.4.32 fornecido pelo serviço “MySQL” do XAMPP e no MariaDB 11.4.13, alvo de produção mantido. MySQL 8 não é tratado como equivalente.

## Limites

Sem exclusão de itens, edição de arquivos originais, mudança de escopo/categoria, rig persistido, poses ou montagem de cenas. Personagens, cenários e objetos compartilham o mesmo contrato de ficha básica.

## Verificação

Integração: criação e leitura da descrição, persistência após nova instância da API, revisão concorrente, campos extras, escopo da imagem, estado editorial, desvinculação sem exclusão e permissões de Editor/Revisor. Navegador: categorias sem mistura, edição de nome/descrição/imagem, recarregamento, confirmação de descarte e consulta por Revisor.

Validação em 30/09/2026: lint e build aprovados; 29 testes unitários, 10 testes de integração em cada MariaDB e sete cenários E2E aprovados no Edge. Migration 005 aplicada ao desenvolvimento.
