# Biblioteca técnica de exercícios

A Biblioteca mostra apenas estes 175 exercícios (e os personalizados que os instrutores criarem). São organizados por **nível do atleta** e por **bloco de treino**, e ficam gravados com `level_id: "ALL"` e a lista de `turmas` a que se destinam.

O **ecrã Conteúdos não muda**: continua a mostrar o programa original de cada turma, que não é apagado.

| Nível do atleta | Aquec. | Técnica | Série Princ. | Pernas | Braços | Veloc. | Calma | Jogos | Total |
|---|---|---|---|---|---|---|---|---|---|
| Iniciação / Adaptação | 5 | 8 | 11 | 5 | 3 | – | 3 | 5 | 40 |
| Aprendizagem / Média | 3 | 7 | 8 | 3 | 3 | – | 2 | 4 | 30 |
| Aperfeiçoamento | 4 | 8 | 10 | 4 | 3 | 3 | 3 | – | 35 |
| Alto Rendimento | 4 | 8 | 12 | 5 | 5 | 4 | 2 | – | 40 |
| Master | 3 | 7 | 8 | 3 | 3 | 3 | 3 | – | 30 |

## O que aparece em cada turma

- **Conteúdos:** o programa original da turma (não muda).
- **Biblioteca:** os exercícios da biblioteca atribuídos a essa turma em `scripts/library/turmas.mjs`.

| Turma | Exercícios da biblioteca | Foco |
|---|---|---|
| A1 | 13 | Adaptação ao meio aquático: confiança, imersão, flutuação |
| A2 | 11 | Adaptação: deslizes, rotações, remadas, nado espontâneo |
| A1+ | 11 | Introdução ao crol e às costas: educativos |
| A2+ | 10 | Crol e costas: nado completo |
| B1 | 17 | Crol e costas, introdução ao bruços, viragens, partidas |
| B2 | 13 | Mariposa, bruços, estafetas, pirâmide |
| C | 19 | Bruços, viragem de bruços, base aeróbia, velocidade |
| D | 16 | Mariposa, estilos, ritmo, viragens de estilos |

Alto Rendimento e Master não correspondem a nenhuma turma. Aparecem em "Todas" e no filtro "Nível do atleta".

## Onde está cada coisa

- `scripts/library/data/*.mjs`: os exercícios, um ficheiro por nível. É aqui que se editam.
- `scripts/library/exercise-schema.json`: enums e campos usados na validação (estilo, categoria, equipamento, blocos, etc.).
- `scripts/library/build.mjs`: valida a biblioteca e gera `scripts/library/seed/exercise-library.json`.
- `scripts/library/seed/exercise-library.json`: JSON de seed consumido por `npm run db:seed`.
- `scripts/seed.ts`: importa turmas e a biblioteca para o Postgres (idempotente: ignora códigos `BIB-…` já existentes).

## Regras que o build verifica

- Título único.
- Descrição com 2 frases ou mais.
- Pelo menos 3 passos, 2 dicas, 2 erros, 1 variação e 2 tags.
- Formato completo: série, descanso, duração e repetições.
- Distância máxima por nível: 200 / 400 / 1200 / 3200 / 1500 m.
- Equipamento adequado ao nível (por exemplo, sem pás na Iniciação).
- Intensidade coerente com o bloco: o Retorno à Calma é sempre Baixa e a Velocidade é Alta ou Máxima.
- Estilo coerente com o conteúdo.
- Quantidade por bloco dentro dos limites.
- Pelo menos 15 exercícios lúdicos na Iniciação.
- Nenhum termo fora do pt-PT (crawl, quadril, nadadeira, placa…).

## Publicar na base local

1. Editar os exercícios em `scripts/library/data/`.
2. `node scripts/library/build.mjs` — valida e regenera o JSON de seed.
3. `npm run db:seed` — carrega turmas e biblioteca no Postgres (não duplica códigos `BIB-…` já existentes).

Os exercícios devem ser revistos pela coordenação técnica antes de ficarem visíveis para todos os instrutores.

## Programa do clube (CFP): conteúdos e exemplos

O programa de cada turma vem da base de dados do clube (`scripts/cfp/data/CFP_extracao.sqlite`): 11 níveis (Bebés 1 … Avançado), 245 conteúdos e 151 exercícios exemplo (`EX-001` … `EX-151`).

- Cada conteúdo fica na tabela `level_content` (turma, bloco, número, período e meses) com os códigos dos seus exercícios exemplo.
- Os exemplos entram na tabela `exercise` com `source: "CFP"` e as turmas onde são usados; aparecem também na Biblioteca.
- No ecrã **Conteúdos**, cada turma mostra a árvore Bloco → Conteúdo → Exercício exemplo → Regressão / Progressão. Marca-se o conteúdo para o sumário da aula e, dentro da árvore, junta-se o exemplo à aula ou abre-se a ficha.

Para atualizar depois de mudar a base do clube:

1. Substituir `scripts/cfp/data/CFP_extracao.sqlite`.
2. `node scripts/cfp/build.mjs` — valida e regenera `scripts/cfp/seed/cfp-program.json` (corrige "quadril" → "anca").
3. `npm run db:migrate && npm run db:seed` — atualiza níveis, conteúdos e exemplos `EX-…` com a versão nova.

## Ilustrações dos exercícios

As imagens ficam em `public/exercicios/`, com o código do exercício como nome (`EX-001.png`, `BIB-INI-001.png`; também `.webp`, `.jpg` ou `.svg`).

1. Copiar as imagens para `public/exercicios/` (por exemplo, as de `biblioteca/imagens/` do `CFP_entrega.zip`). Uma imagem com o mesmo código noutro formato (por exemplo `.png` em vez de `.jpg`) deve substituir a anterior, e não ficar ao lado dela.
2. `npm run db:seed` — liga cada imagem ao exercício com o mesmo código.

A imagem aparece na ficha do exercício e, no ecrã Conteúdos, em cada exemplo da árvore. O formato esperado é horizontal 3:2.

As 151 imagens atuais dos exemplos `EX-…` (`.jpg`, 320 px de largura) vêm da aba "Ilustrações" de `biblioteca_exercicios_CFP.xlsx`. Quando houver os PNG em tamanho real, substituem-nas: apagar o `.jpg` com o mesmo código antes de correr o seed.

### Esquemas dos exercícios da biblioteca

Os 175 exercícios `BIB-…` têm um esquema em SVG (`BIB-….svg`), desenhado por `scripts/library/illustrations.mjs`: piscina em corte lateral, instrutor no cais, o aluno na posição do exercício, o material e uma seta com o sentido do deslocamento.

- A cena de cada exercício está em `scripts/library/illustrations.json`, por exemplo `"crol breath pb lane"` (crol a respirar, com pull-buoy e corda de pista). Ao criar um exercício novo, acrescentar a linha dele e correr `node scripts/library/illustrations.mjs`.
- Uma ilustração a sério com o mesmo código (`.png`, `.webp` ou `.jpg`) substitui o esquema: apagar o `.svg` antes de correr o seed.

### Padrão de cores

Todas as imagens, novas e refeitas, seguem as mesmas cores:

| Elemento | Cor |
|---|---|
| Pele fora de água | tom natural (clara `#F2B48C`, escura `#8D5A3B`) |
| Pele dentro de água | a mesma pele com véu turquesa a 35% (clara `#B1B29C`, escura `#707868`), nunca cinzenta nem verde forte |
| Água · superfície · fundo | `#3AAEBB` · `#6CC9CE` com linha branca · `#2A8C99` |
| Azulejos do cais · contorno | `#CFEFEC` · `#123B4A` |
| Toucas e fatos de banho | `#1B3A5C` |
| Instrutor | polo `#1F3B57` e calções, no cais (nunca de fato de treino dentro de água) |
