# Prompt de handoff — Escola Aquática

Copia tudo o que está abaixo da linha para o Claude Code.

---

## Contexto

Quero desenvolver (ou continuar) a aplicação **Escola Aquática**, uma ferramenta para instrutores de natação de um clube (Clube Fluvial Portuense). Serve para preparar aulas, consultar uma biblioteca técnica de exercícios e criar fichas de treino imprimíveis. Uso principal: telemóvel, no piso da piscina, muitas vezes sem rede — o offline é um requisito, não um extra.

Não é uma app para alunos: é uma ferramenta interna do instrutor.

## Regras de produto

- **Idioma**: exclusivamente português de Portugal (pt-PT). Nada de inglês na interface.
- **Terminologia técnica correta**: `crol` (não "crawl"), `costas`, `bruços`, `mariposa`, `estilos`, `anca` (não "quadril"), `braçada`, `ação dos MI/MS`, `deslize`, `viragens`, `chegadas`, `partidas`, `sustentação`.
- **Mobile-first**: alvos de toque grandes, texto legível ao sol, nada de tabelas apertadas.
- **Sem dados pessoais de alunos** nesta fase: a app gere conteúdos e planos, não avaliações nominais.

## Stack

- TanStack Start (React, Vite), TypeScript/JSX, Tailwind CSS, componentes shadcn/ui, lucide-react para ícones, TanStack Router.
- Persistência: PostgreSQL com Drizzle ORM. Autenticação com Better Auth.
- **Offline-first**: cache local em `localStorage` (chaves `swim_cache_levels`, `swim_cache_exercises`, `swim_selection_<TURMA>`, `swim_active_level`) com fallback para dados em cache quando a rede falha. A seleção de exercícios da aula tem de sobreviver a recarregamentos e a falta de rede.

## Identidade visual

Paleta verde do clube, modo escuro:

| Uso | Cor |
|---|---|
| Fundo | `#062b16` |
| Cartões / superfícies | `#0d3f22` |
| Destaque / ativo | `#2fe06b` |
| Texto secundário | `#9bd0a8` |
| Bordas | `#186a35` |
| Texto principal | `#ffffff` / `#d8f0da` |

- Tipografia: sans-serif sóbria; títulos em `font-semibold`, corpo pequeno e denso (app de trabalho).
- Fichas de treino e infográficos de exercício seguem um estilo de **infografia em prancheta azul técnica**: ícones, setas de movimento, numeração de passos, blocos bem delimitados — pensado para impressão a preto e branco.
- Ilustrações de demonstração: nadadores **crianças (8–11 anos)**, nunca adultos, e o movimento ilustrado tem de corresponder exatamente ao exercício descrito e ao equipamento usado.

## Modelo de dados

### `Level` (turma)
`code` (ex.: A1, A1+, A2, A2+, B1, B2, C, D), `name`, `duration_min`, `max_students`, `age_range`, `order_index`.

Turmas atuais (todas com 45 min e máximo de 8 alunos):
A1 (Adaptação ao Meio Aquático, 7–15 anos), A1+ (Introdução às técnicas de Crol e Costas, 7–15), A2 (Adaptação, 7–15), A2+ (Introdução Crol/Costas, 7–15), B1 (8–15), B2 (8–15), C (9–16), D (9–16).

### `Exercise` (exercício)
- `title`, `code` (ex.: `DRILL-BR-004`), `description`
- `style[]`: Crawl, Costas, Bruços, Mariposa, Quatro Estilos (IM), Genérico → **corrigir para pt-PT: Crol**
- `category`: Técnica / Drills, Pernas (Kick), Braços (Pull), Partidas e Viragens, Posição do Corpo / Flutuação, Respiração, Resistência / Aeróbico, Velocidade / Potência
- `level[]`: Iniciação / Adaptação, Aprendizagem / Média, Aperfeiçoamento, Alto Rendimento, Master
- `primary_objective`, `focus_points[]`, `equipment_required[]` (Nenhum, Prancha, PULL-BUOY, Barbatanas, Pás, Tubo Frontal (Snorkel), Elástico, Cinto de Tração)
- `difficulty_rating` (1–5), `common_mistakes`, `coaching_cues`
- `video_url`, `image_diagram` (infográfico técnico)
- `tags[]`, `is_custom` (criado pelo instrutor), `is_example` (exemplo de aula, não pertence a uma turma)
- `level_id` (código da turma; `ALL` para exemplos aplicáveis a todas)
- `content` (grande área: Crol, Costas, Bruços, Mariposa, Estilos, Partidas e Viragens, Adaptação ao Meio Aquático, Remadas e Sustentação, Pólo Aquático, Natação Sincronizada)
- `subcategory` (texto livre criado pelo instrutor, ex.: "Ação dos MI", "Viragens", "Posições")
- `period_type`: SEPT_JAN, FEB_JUL, FULL_YEAR, FIRST_WEEK_ONLY + `period_label` (rótulo visível)
- `order_index` (ordem cronológica no programa)

### `WorkoutSheet` (ficha de treino)
`title`, `level_id`, `session_date`, `focus`, `sections[]` (`title`, `rest`, `items[]`), `total_distance`, `notes`.
Blocos típicos: Aquecimento, Técnica, Série Principal, Retorno à Calma. As séries são texto livre (`4 x 50 m — Deslize dos dedos`).

### `ClassSummary` (registo da aula)
`date`, `level_id`, `exercise_ids[]`, `notes`.

### `ExerciseCategory`
`name` — subcategorias personalizadas criadas pelo instrutor.

## Hierarquia da biblioteca

Três níveis, do mais amplo ao mais específico:

**Conteúdo → Turma → Época → Exercícios**

Dentro de cada conteúdo, os exercícios de programa aparecem agrupados por turma (acordeão) e, dentro da turma, por época (acordeão). Os **exemplos de aula** ficam numa área separada, com borda tracejada e etiqueta "Exemplo", agrupados por subcategoria.

## Conteúdo atual da biblioteca (para referência e para não duplicar)

377 exercícios, todos com infográfico. 120 marcados como exemplo. Só 40 têm vídeo.

| Conteúdo | Nº |
|---|---|
| Crol | 49 |
| Adaptação ao Meio Aquático | 48 |
| Pólo Aquático | 47 |
| Natação Sincronizada | 46 |
| Partidas e Viragens | 45 |
| Costas | 43 |
| Remadas e Sustentação | 32 |
| Bruços | 26 |
| Mariposa | 24 |
| Estilos | 17 |

Subcategorias já usadas (exemplos): Adaptação → Equilíbrio horizontal e deslize, Equilíbrio vertical, Imersão e respiração, Rotação, Deslocamento, Entradas na água, Ritmo e esquema corporal. Crol → Técnica / Drills, Ação dos MI e respiração, Coordenação MI/MS e respiração, Braços (Pull), Pernas (Kick), Respiração, Posição do Corpo / Flutuação, Técnica completa, Velocidade / Potência. Costas → Ação dos MI, Coordenação, Técnica completa, Braços, Pernas, Partidas e Viragens, Posição do Corpo. Bruços → Ação dos MI, Apneia e impulsos, Coordenação, Técnica completa, Pernas, Braços. Mariposa → Movimento ondulatório, Ação dos MI, Técnica completa, Técnica / Drills, Pernas, Braços, Resistência. Partidas e Viragens → Partidas, Viragens, Chegadas, Estafetas. Remadas e Sustentação → Remadas de resgate, Remadas de sustentação. Pólo Aquático → Nado e deslocamentos, Retropedalagem, Bola: pega/passe/lançamento, Jogos. Estilos → Kick pull, Nados alternativos, Capacidades funcionais, Provas de estilos. Natação Sincronizada → Posições, Movimentos, Remadas de sustentação e deslocamentos, Expressão artística.

## Ecrãs

### 1. Aulas (`/`)
Lista de verificação do treino do dia. Abas horizontais com as turmas (A1 → D). Para a turma ativa mostra idade, duração e lotação, e a lista dos exercícios dessa turma agrupados por categoria, com caixa de seleção. A seleção é guardada por turma no dispositivo. No fundo, um painel fixo com o resumo da aula: nº de exercícios escolhidos, lista, e ações **Copiar**, **Guardar** (cria um `ClassSummary` com a data de hoje) e **Limpar**.

### 2. Biblioteca (`/biblioteca`)
A área principal. Cabeçalho com o título e um botão **Adicionar exercício**. Barra de filtros (pesquisa livre, estilo, categoria, equipamento, nível, turma). Chips horizontais de turma ("Todas" + cada código, com contagem). Sem filtros ativos: vista hierárquica por conteúdo → turma → época → exercícios. Com filtros ativos: grelha de resultados.

Cartões de exercício mostram o infográfico, badges (turma ou "Exemplo", época), a categoria e o título. Cartões com vídeo têm uma etiqueta **"Vídeo"** sobre a imagem.

Tocar num cartão abre a **ficha do exercício**:
- Vídeo em destaque quando existe, a reproduzir automaticamente (sem som, em ciclo, com controlos).
- Infográfico técnico.
- Objetivo principal, pontos de foco, erros comuns, coaching cues, equipamento, dificuldade (1–5), tags.
- Ações: **adicionar à aula** (escolhe turma e data e grava em `ClassSummary`) e **duplicar como exercício próprio** (`is_custom: true`).

Criar exercício: formulário com todos os campos técnicos, escolha de conteúdo, turma, época e subcategoria (com possibilidade de escrever uma nova).

### 3. Treinos (`/treinos`)
Fichas de treino por turma. Criar ficha (título, turma, data, foco, blocos com séries e descanso, distância total, notas). Ver, editar, imprimir (folha limpa em A4, só a ficha, via área `print-area`) e apagar.

### Autenticação
Login, registo, recuperação e reposição de palavra-passe. Todo o conteúdo da app fica atrás de login; instrutores entram com conta própria.

## Estado atual e trabalho pendente

1. **Vídeos**: só 40 de 377 exercícios têm vídeo. Faltam 337. Gerar demonstrações curtas (4–6 s, 16:9) de crianças a executar o exercício descrito, coerentes com o título e o equipamento.
2. **Terminologia**: o enum `style` ainda tem "Crawl"; tem de passar a "Crol". Verificar todo o texto por estrangeirismos e por "quadril" em vez de "anca".
3. **Fichas de treino**: ainda não há fichas guardadas — validar o fluxo completo (criar → imprimir → editar).
4. **Offline**: a leitura da biblioteca e das turmas já usa cache; falta cache de escrita para fichas e resumos criados sem rede, com sincronização quando a ligação volta.
5. **Filtros**: garantir que os filtros se combinam bem com a vista hierárquica e que a contagem por turma reflete os filtros ativos.

## Como quero que trabalhes

- Antes de alterar, lê o código existente e segue o padrão dos componentes em `src/components/swim/`.
- Componentes pequenos e focados (menos de ~50 linhas), um ficheiro por componente, exportação `default` com o mesmo nome do ficheiro.
- Não inventes dados de natação: respeita os níveis da Federação Portuguesa de Natação (adaptação e iniciação) e a terminologia acima.
- Não mudes o comportamento de nada que não esteja no pedido.
- Se um requisito for ambíguo, pergunta antes de implementar em grande escala.
- Depois de cada conjunto de alterações, confirma que a app compila e que os ecrãs continuam a funcionar em telemóvel e em desktop.

Começa por dizer o que entendeste e por listar os ficheiros que vais tocar.