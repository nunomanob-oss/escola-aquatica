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
- `scripts/library/build.mjs`: valida a biblioteca e gera `base44/seed/exercise-library.json`.
- `scripts/library/import.mjs`: importa o JSON para a Base44. Não duplica, porque ignora os códigos `BIB-…` que já existem.
- `scripts/library/remove-old-examples.mjs`: apaga da Base44 os 120 exemplos antigos (só apareciam na Biblioteca). Não toca no programa das turmas nem nos personalizados. Antes de apagar, guarda uma cópia em `backups/`.
- `base44/entities/Exercise.jsonc`: tem campos novos: `training_block`, `instructions`, `variations`, `distance`, `distance_m`, `rest_interval`, `repetitions`, `duration`, `intensity` e `focus_area`. Tem também novos equipamentos e duas categorias novas.

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

## Publicar

1. Publicar o schema novo (git → painel Base44).
2. `node scripts/library/build.mjs`
3. `BASE44_APP_ID=… BASE44_TOKEN=… node scripts/library/import.mjs`: sem `--apply`, só mostra o que faria. Repetir com `--apply` para gravar.
4. `BASE44_APP_ID=… BASE44_TOKEN=… node scripts/library/remove-old-examples.mjs`: ler a lista primeiro e só depois correr com `--apply`. O script recusa-se a apagar se a biblioteca ainda não estiver importada.

Os exercícios devem ser revistos pela coordenação técnica antes de ficarem visíveis para todos os instrutores.
