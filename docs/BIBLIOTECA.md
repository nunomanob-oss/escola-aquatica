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
