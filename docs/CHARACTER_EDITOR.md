# Editor de perspectivas, partes, pivôs e anchors

Ampliação da Fase 3 autorizada em 30/09/2026. Mantém Tema A e separação Studio/Engine. Não inclui poses, animações, timeline ou montagem de páginas.

## Roteiro manual

1. Prepare PNG/WebP das partes separadamente, preferencialmente com fundo transparente. O upload agora é direto na estrutura; não há recorte automático.
2. Abra Biblioteca → Personagens → nome → Perspectivas e partes.
3. Comece na Frente (front). Ajuste largura/altura lógicas se necessário. A raiz root move todo o conjunto.
4. Informe um identificador como body, head ou leftArm e clique Adicionar parte. A nova parte nasce ligada à parte selecionada. Use Enviar imagem desta parte → Enviar e vincular imagem. O envio salva a estrutura atual e vincula o arquivo à parte e perspectiva selecionadas, sem criar outro item no catálogo. Grupo sem imagem organiza filhos. Para uma imagem inteira da perspectiva, envie pela raiz.
5. Selecione a parte-pai. Descendentes não aparecem como possíveis pais, impedindo ciclos. Remover parte e filhos pede confirmação e também remove seus anchors do rascunho; não exclui arquivos.
6. Ajuste posição, rotação em graus, escalas, camada, opacidade e visibilidade. A rotação fica em radianos no contrato. Camadas ordenam irmãos, sem achatar a hierarquia.
7. Use Mover parte e arraste para posicionar. Em Posicionar pivô, clique ou arraste na parte selecionada. Pivô fica entre 0 e 1 nas dimensões da imagem; alterar o pivô compensa a posição para preservar imagem e filhos.
8. Adicione um anchor com nome único na perspectiva, selecione-o e use Posicionar anchor. Os anchors novos usam coordenadas normalizadas e podem ficar fora da imagem. Campos numéricos também permitem edição precisa.
9. Crie uma perspectiva vazia ou duplique a atual, usando side (Lateral), back (Costas) ou outro identificador. A cópia é independente e pode usar outras imagens, hierarquia e anchors.
10. Salve a estrutura. Reabra e confirme perspectivas, partes e posições. Recarregar estrutura e sair com alterações pendentes pedem confirmação de descarte.

IDs começam por letra e aceitam letras, números, hífen e sublinhado, até 80 caracteres. Nomes front/side/back recebem rótulos em português. Há até oito perspectivas, 128 partes e 128 anchors por perspectiva. A requisição JSON permanece limitada a 256 KB. Imagens precisam ter dimensões cadastradas; assets legados sem dimensões precisam ser reimportados.

## Persistência e acesso

GET e PUT /api/internal/library/:itemId/rig usam sessão, permissões library:read/write e serializer com validação estrita recursiva. Apenas itens CHARACTER têm estrutura. GET retorna id, revision, assets internos do personagem e definition (null para cadastro ainda sem estrutura). PUT aceita revision e definition.

O manifesto usa definition_json. A migration 006_character_images.sql adiciona vínculo do asset ao personagem e os identificadores da perspectiva/parte de origem. Ficha e estrutura compartilham a revisão, impedindo sobrescrita por edição concorrente de qualquer uma delas. Alterar metadados mantém o rig. O id técnico e nome interno são derivados do cadastro ao salvar o rig; o título da interface sempre usa o cadastro atual.

API verifica a hierarquia, limites, existência dos arquivos, MIME, dimensões e escopo de todas as imagens. Só UUIDs de assets cadastrados são persistidos como imagens; URLs e campos extras são recusados. Escalas de módulo menor que 0,001 são recusadas para permitir conversão inversa de coordenadas. Itens de livro em revisão ficam bloqueados para edição. Revisor consulta, alterna perspectivas e seleciona partes, mas não salva nem altera a estrutura.

Dados permanecem em MariaDB: local fornecido pelo serviço “MySQL” do XAMPP, alvo de produção MariaDB 11.4 LTS mantido. MySQL 8 não é equivalente.

## Responsabilidades e recursos

Studio controla formulários, seleção e comandos. createCharacter, resolveAnchor e matrizes do Engine são a fonte de geometria. PixiJS renderiza as imagens; SVG sobreposto contém somente regiões de seleção, contorno, pivô e anchors. Não existe loop de animação React.

O renderer recebe comandos explícitos de load/resize, reaproveitando texturas enquanto o conjunto de imagens não muda. A troca de imagens, perspectivas e saída da tela desmonta os recursos correspondentes. AssetManager é dono das texturas. O loader admite somente imagens registradas, incluindo o endpoint autenticado de conteúdo da aplicação; o manifesto não fornece URLs. API usa o modelo puro do Engine para verificar transforms, sem importar o renderer/PixiJS.

Zoom ajuda a posicionar detalhes. Os campos numéricos continuam disponíveis sem manipulação por mouse. Sem undo/redo, renomeação de identificadores, importação ZIP/pack, recorte, IK, poses, playback ou inserção nas páginas nesta entrega. O aceite visual humano continua necessário para confirmar o comportamento com a arte real.

## Evidências

Teste de geometria: mover pivô preserva a posição de imagem e anchors dos filhos sob parent rotacionado e espelhado. Integração nos dois MariaDBs: persistência, leitura após nova instância da API, exclusividade por livro, proteção editorial, ciclos, campos extras, escala inválida, conflito com metadados e permissões. E2E: pixels do PixiJS, clique no pivô, arraste do anchor, rotação, parte filha, duplicação independente de perspectiva, salvar/reabrir e descarte de rascunho.

Validação em 30/09/2026: lint e build aprovados; 30 testes unitários, 11 testes de integração em MariaDB 10.4.32 e 11 no alvo MariaDB 11.4.13, oito cenários E2E no Edge. Captura local de QA: .local/qa-rig-editor.png. Nenhuma migration nova.

## Upload direto da estrutura — correção de fluxo

POST /api/internal/library/:itemId/rig/:perspectiveId/:partId/image recebe multipart com file, revision e definition (JSON). Exige sessão, origem autorizada e library:write. Limites PNG/WebP estático: 10 MiB e 4096 × 4096; normalização remove metadados. O limite de dois uploads simultâneos é compartilhado entre rotas no processo. O campo definition admite até 256 KiB.

Um único commit de banco insere o asset com owner_character_id, perspective_id e part_id, vincula seu ID à parte e grava toda a estrutura enviada, incrementando a revisão. Falha de gravação/conflito compensa o arquivo; falha de confirmação é reconciliada antes de excluir. O envio portanto salva também os demais ajustes pendentes, conforme aviso na tela.

Imagens internas não aparecem no catálogo geral de assets, não criam library_items e não podem ser vinculadas a outro personagem, capa ou cadastro geral. Podem ser reutilizadas entre perspectivas do mesmo personagem; duplicar perspectiva mantém referências até a substituição. Imagem da parte lista imagens deste personagem e referências legadas já usadas no rig. Reenvio cria um asset imutável novo; arquivos anteriores continuam internos, sem exclusão automática. Assets e cadastros legados não são convertidos automaticamente, pois podem ser compartilhados.

A migration 006 foi validada em MariaDB 10.4.32 (serviço “MySQL” do XAMPP) e MariaDB 11.4.13, e aplicada localmente. Testes cobrem ausência de itens extras, vínculo frente/lateral, persistência após reabrir, bloqueio entre personagens, capa e revisão editorial, permissões e compensação em falha de banco.

Validação do upload direto em 30/09/2026: lint/build, 30 testes unitários, 12 integrações em cada MariaDB e oito cenários E2E aprovados. Migration 006 aplicada ao desenvolvimento.

Rechecagem do fluxo de upload e troca de parte em 03/10/2026: cenário E2E específico aprovado após o ajuste para limpar a seleção de arquivo ao trocar de parte.

## Evolução em 03/10/2026

As exclusões anteriores registram a entrega de setembro. Pacote portátil, poses/animações e inserção nas páginas agora estão implementados no escopo solicitado: ver [guia de uso e aceite](CHARACTER_PACKS_AND_MOTION.md). A edição de pivôs/anchors e upload direto continuam nesta mesma tela.
