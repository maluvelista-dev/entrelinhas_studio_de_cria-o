# Importação de ilustrações

Ampliação autorizada pelo usuário durante a Fase 3. Mantém o Tema A; não antecipa montagem de cenas (Fase 6).

## Uso

Em Biblioteca, Admin e Editor podem importar um arquivo PNG ou WebP estático, informar nome, tipo (cenário, personagem ou objeto) e disponibilidade global ou exclusiva de um livro em rascunho. A importação cria o arquivo e o item do catálogo. Selecionar Personagem não cria rig, partes ou poses.

Em Novo livro ou Sobre o livro, selecione a imagem no campo Asset de capa e salve. As miniaturas da Biblioteca e as capas da estante carregam imagens autenticadas. Revisor pode consultar, mas não importar.

## Contrato e segurança

POST /api/internal/assets recebe multipart/form-data: file, name, kind e ownerBookId opcional. É a única exceção à exigência de JSON nas mutações; origem, sessão e permissão library:write continuam obrigatórias antes do processamento. Campos adicionais são recusados.

Limites: um arquivo por envio, 10 MiB antes e depois do processamento, dimensões máximas 4096 × 4096, dois envios simultâneos por processo. Validação de assinatura, extensão, MIME, decodificação completa e recodificação com sharp. Imagens animadas e corrompidas são recusadas. A recodificação remove metadados, aplica orientação e mantém transparência; o arquivo armazenado não é idêntico ao original.

GET /api/internal/assets/:assetId/content exige sessão e library:read. Retorna somente PNG/WebP com no-store, nosniff e política de mesma origem. Arquivos ficam fora da pasta pública. DTOs expõem somente id, nome, escopo, MIME, dimensões e tamanho; não expõem caminho, checksum, credenciais ou token. Escopo por livro limita reutilização, não constitui isolamento entre membros da equipe: leitores autorizados compartilham a Biblioteca.

Arquivo, asset e catálogo são coordenados com transação e compensação: falhas no banco removem o arquivo quando não houve commit. Falha de confirmação do commit exige consulta antes de remover. Falha de reconciliação registra apenas o identificador do asset para operação. Uma interrupção abrupta entre escrita e transação pode deixar arquivo órfão: limpeza automática e quotas não estão implementadas. Backups devem abranger banco e armazenamento.

## Banco e limites atuais

Migration 004_image_dimensions.sql adiciona dimensões opcionais para preservar assets anteriores. Aplicação usa MariaDB, fornecido localmente pelo serviço “MySQL” do XAMPP. Alvo de produção: MariaDB 11.4 LTS mantido; não pressupõe equivalência com MySQL 8. Validar migrations nos dois alvos.

Sem edição, substituição ou exclusão de imagens, importação de áudio, SVG, lotes, character packs ou posicionamento de ilustrações nas páginas. A montagem de cenas permanece na Fase 6.

## Verificação

Testes unitários: PNG/WebP, transparência, remoção de metadados, formatos falsos, corrupção e limites. Integração nos dois MariaDBs: migração, persistência, leitura autenticada, escopo, capa, restrição editorial, perfil Revisor e compensação após falha de banco. E2E: importar, conferir pixels da prévia, selecionar capa, salvar e recarregar.

Validação em 29/09/2026: lint e build aprovados; 29 testes unitários; 9 testes de integração em MariaDB 10.4.32 e outros 9 no alvo MariaDB 11.4.13; seis cenários E2E aprovados no Edge. Migration 004 aplicada ao desenvolvimento. E2E usa banco de teste limpo, pois os arquivos temporários da integração são removidos ao encerrar a suíte.
