# Editor de perspectivas, partes, pivôs e anchors

Ampliação da Fase 3 autorizada em 30/09/2026. Mantém Tema A e separação Studio/Engine. Não inclui poses, animações, timeline ou montagem de páginas.

## Roteiro manual

1. Importe PNG/WebP das partes na Biblioteca. Prepare as partes separadamente, preferencialmente com fundo transparente. Não há recorte automático.
2. Abra Biblioteca → Personagens → nome → Perspectivas e partes.
3. Comece na Frente (front). Ajuste largura/altura lógicas se necessário. A raiz root move todo o conjunto.
4. Informe um identificador como body, head ou leftArm e clique Adicionar parte. A nova parte nasce ligada à parte selecionada. Escolha Imagem da parte; Grupo sem imagem organiza filhos.
5. Selecione a parte-pai. Descendentes não aparecem como possíveis pais, impedindo ciclos. Remover parte e filhos pede confirmação e também remove seus anchors do rascunho; não exclui arquivos.
6. Ajuste posição, rotação em graus, escalas, camada, opacidade e visibilidade. A rotação fica em radianos no contrato. Camadas ordenam irmãos, sem achatar a hierarquia.
7. Use Mover parte e arraste para posicionar. Em Posicionar pivô, clique ou arraste na parte selecionada. Pivô fica entre 0 e 1 nas dimensões da imagem; alterar o pivô compensa a posição para preservar imagem e filhos.
8. Adicione um anchor com nome único na perspectiva, selecione-o e use Posicionar anchor. Os anchors novos usam coordenadas normalizadas e podem ficar fora da imagem. Campos numéricos também permitem edição precisa.
9. Crie uma perspectiva vazia ou duplique a atual, usando side (Lateral), back (Costas) ou outro identificador. A cópia é independente e pode usar outras imagens, hierarquia e anchors.
10. Salve a estrutura. Reabra e confirme perspectivas, partes e posições. Recarregar estrutura e sair com alterações pendentes pedem confirmação de descarte.

IDs começam por letra e aceitam letras, números, hífen e sublinhado, até 80 caracteres. Nomes front/side/back recebem rótulos em português. Há até oito perspectivas, 128 partes e 128 anchors por perspectiva. A requisição JSON permanece limitada a 256 KB. Imagens precisam ter dimensões cadastradas; assets legados sem dimensões precisam ser reimportados.

## Persistência e acesso

GET e PUT /api/internal/library/:itemId/rig usam sessão, permissões library:read/write e serializer com validação estrita recursiva. Apenas itens CHARACTER têm estrutura. GET retorna id, revision e definition (null para cadastro ainda sem estrutura). PUT aceita revision e definition.

O manifesto usa definition_json já existente; não há migration nova. Ficha e estrutura compartilham a revisão, impedindo sobrescrita por edição concorrente de qualquer uma delas. Alterar metadados mantém o rig. O id técnico e nome interno são derivados do cadastro ao salvar o rig; o título da interface sempre usa o cadastro atual.

API verifica a hierarquia, limites, existência dos arquivos, MIME, dimensões e escopo de todas as imagens. Só UUIDs de assets cadastrados são persistidos como imagens; URLs e campos extras são recusados. Escalas de módulo menor que 0,001 são recusadas para permitir conversão inversa de coordenadas. Itens de livro em revisão ficam bloqueados para edição. Revisor consulta, alterna perspectivas e seleciona partes, mas não salva nem altera a estrutura.

Dados permanecem em MariaDB: local fornecido pelo serviço “MySQL” do XAMPP, alvo de produção MariaDB 11.4 LTS mantido. MySQL 8 não é equivalente.

## Responsabilidades e recursos

Studio controla formulários, seleção e comandos. createCharacter, resolveAnchor e matrizes do Engine são a fonte de geometria. PixiJS renderiza as imagens; SVG sobreposto contém somente regiões de seleção, contorno, pivô e anchors. Não existe loop de animação React.

O renderer recebe comandos explícitos de load/resize, reaproveitando texturas enquanto o conjunto de imagens não muda. A troca de imagens, perspectivas e saída da tela desmonta os recursos correspondentes. AssetManager é dono das texturas. O loader admite somente imagens registradas, incluindo o endpoint autenticado de conteúdo da aplicação; o manifesto não fornece URLs. API usa o modelo puro do Engine para verificar transforms, sem importar o renderer/PixiJS.

Zoom ajuda a posicionar detalhes. Os campos numéricos continuam disponíveis sem manipulação por mouse. Sem undo/redo, renomeação de identificadores, importação ZIP/pack, recorte, IK, poses, playback ou inserção nas páginas nesta entrega. O aceite visual humano continua necessário para confirmar o comportamento com a arte real.

## Evidências

Teste de geometria: mover pivô preserva a posição de imagem e anchors dos filhos sob parent rotacionado e espelhado. Integração nos dois MariaDBs: persistência, leitura após nova instância da API, exclusividade por livro, proteção editorial, ciclos, campos extras, escala inválida, conflito com metadados e permissões. E2E: pixels do PixiJS, clique no pivô, arraste do anchor, rotação, parte filha, duplicação independente de perspectiva, salvar/reabrir e descarte de rascunho.

Validação em 30/09/2026: lint e build aprovados; 30 testes unitários, 11 testes de integração em MariaDB 10.4.32 e 11 no alvo MariaDB 11.4.13, oito cenários E2E no Edge. Captura local de QA: .local/qa-rig-editor.png. Nenhuma migration nova.
