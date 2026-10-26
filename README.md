# Escola Aquática

Ferramenta interna para os instrutores do Clube Fluvial Portuense: preparar as aulas, consultar a biblioteca técnica de exercícios e criar fichas de treino imprimíveis.

**Stack:** TanStack Start (React, Vite), TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL com Drizzle ORM e autenticação com Better Auth.

## Requisitos

Antes de começar, instala:

| Ferramenta                                         | Para quê                      |
| -------------------------------------------------- | ----------------------------- |
| [Node.js 24 (LTS)](https://nodejs.org/)            | Correr a app e os scripts npm |
| [Docker](https://www.docker.com/) + Docker Compose | Postgres local                |
| Git                                                | Clonar o repositório          |

Opcional: [fnm](https://github.com/Schniz/fnm) para gerir a versão do Node (`fnm install --lts && fnm use`).

## Arranque (primeira vez)

1. **Clonar o repositório e entrar na pasta**

```bash
git clone <url-do-repositorio> escola-aquatica
cd escola-aquatica
```

2. **Instalar dependências**

```bash
npm install
```

3. **Criar o ficheiro de ambiente**

```bash
cp .env.example .env
```

Abre o `.env` e preenche pelo menos:

| Variável                                    | O que pôr                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                              | Já vem preenchida para o Postgres do Docker (`postgres://escola:escola@localhost:5432/escola_aquatica`) |
| `BETTER_AUTH_SECRET`                        | Segredo aleatório. Gera com: `openssl rand -base64 32`                                                  |
| `BETTER_AUTH_URL`                           | URL da app em local: `http://localhost:3000`                                                            |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Opcional. Só se quiseres login com Google                                                               |

4. **Subir a base de dados, criar tabelas e carregar dados**

```bash
npm run db:up       # Postgres em localhost:5432 (Docker)
npm run db:migrate  # Cria as tabelas
npm run db:seed     # Níveis + conteúdos por nível (245) + biblioteca (~175 exercícios)
```

5. **Arrancar a app**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) e entra com uma conta de demo (criadas pelo seed):

| Email                    | Palavra-passe  | Papel              |
| ------------------------ | -------------- | ------------------ |
| `instrutor@escola.local` | `instrutor123` | instrutor (`user`) |
| `admin@escola.local`     | `admin1234`    | admin              |

Também podes criar conta nova em **Registar** — não precisa de email real (não há verificação por email).

### Dias seguintes

Se o Postgres já estiver a correr e as migrações/seed já tiverem sido feitos:

```bash
npm run db:up   # só se o contentor estiver parado
npm run dev
```

Para parar o Postgres quando já não precisares dele:

```bash
npm run db:down
```

## Comandos disponíveis

Todos os scripts definidos em `package.json`:

### App

| Comando                   | Para quê                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`             | Arranca o servidor de desenvolvimento em [http://localhost:3000](http://localhost:3000) (Vite + hot reload).                                    |
| `npm run build`           | Faz o build de produção (saída pronta para deploy).                                                                                             |
| `npm run preview`         | Serve localmente o build de produção gerado por `npm run build` (para testar o que vai para produção).                                          |
| `npm run typecheck`       | Corre o TypeScript (`tsc --noEmit`) e reporta erros de tipos sem gerar ficheiros.                                                               |
| `npm run generate-routes` | Regenera as rotas do TanStack Router a partir dos ficheiros em `src/routes/` (`tsr generate`). Útil se as rotas tipadas ficarem desatualizadas. |

### Base de dados

| Comando               | Para quê                                                                                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run db:up`       | Sobe o Postgres com Docker Compose (`docker compose up -d`). Porta `5432`, base `escola_aquatica`.                                                                                |
| `npm run db:down`     | Para e remove os contentores Docker do projeto (os dados no volume `pgdata` mantêm-se).                                                                                           |
| `npm run db:generate` | Gera uma nova migração SQL a partir das alterações em `src/db/schema.ts` (Drizzle Kit).                                                                                           |
| `npm run db:migrate`  | Aplica as migrações pendentes em `drizzle/` à base de dados.                                                                                                                      |
| `npm run db:seed`     | Carrega níveis, conteúdos por nível e a biblioteca de exercícios. É idempotente: podes correr outra vez sem duplicar dados (níveis e conteúdos são atualizados a partir do JSON). |
| `npm run db:reset`    | Apaga todos os dados da base, volta a aplicar as migrações e corre o seed do zero.                                                                                                 |
| `npm run db:studio`   | Abre o Drizzle Studio (UI no browser) para inspecionar e editar dados na base.                                                                                                    |

### Conteúdos por nível (fora do `package.json`)

Os níveis e os conteúdos com a calendarização vêm do Excel do caderno pedagógico (`base_dados_niveis_CFP.xlsx`). Para atualizar depois de alterar o Excel:

```bash
python3 scripts/niveis/xlsx-to-json.py ~/Downloads/base_dados_niveis_CFP.xlsx   # requer openpyxl
npm run db:seed
```

O script gera `scripts/niveis/niveis-cfp.json`, que o seed usa para atualizar as tabelas `level` e `level_content`.

### Biblioteca de exercícios (fora do `package.json`)

| Comando                          | Para quê                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `node scripts/library/build.mjs` | Valida os exercícios em `scripts/library/data/` e gera `scripts/library/seed/exercise-library.json`.                                     |
| `node scripts/cfp/build.mjs`     | Converte a base do clube (`scripts/cfp/data/CFP_extracao.sqlite`) em `scripts/cfp/seed/cfp-program.json` (níveis, conteúdos e exemplos). |

Mais detalhe sobre a biblioteca: [`docs/BIBLIOTECA.md`](docs/BIBLIOTECA.md).

## Estrutura do projeto

| Caminho                  | Conteúdo                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `src/routes/`            | Rotas (TanStack Router). `_authed/` exige login.                                                            |
| `src/pages/`             | Ecrãs: Conteúdos, Níveis (conteúdos por nível e sumário da aula), Biblioteca, Aulas, Painel e autenticação. |
| `src/components/swim/`   | Componentes da app (exercícios, fichas, painel, demo 3D).                                                   |
| `src/components/ui/`     | Componentes shadcn/ui.                                                                                      |
| `src/db/schema.ts`       | Schema Postgres: utilizadores, turmas, exercícios, fichas, sumários.                                        |
| `src/server/entities.ts` | Funções de servidor que leem/escrevem na base.                                                              |
| `src/lib/entities.ts`    | Cliente usado pelos componentes (`list`, `filter`, `create`, `update`, `delete`).                           |
| `src/lib/auth.ts`        | Configuração Better Auth.                                                                                   |
| `scripts/library/`       | Fonte dos exercícios da biblioteca (um ficheiro por nível).                                                 |
| `docs/`                  | Documentação de produto e da biblioteca.                                                                    |
| `.env.example`           | Modelo das variáveis de ambiente (copiar para `.env`).                                                      |

## Notas úteis

- Os dados são só para instrutores. Não há dados pessoais de alunos.
- Offline: a leitura usa cache local (`localStorage`); escritas sem rede ficam numa fila e sincronizam quando a ligação volta.
- Autenticação: registo e login por email/palavra-passe funcionam **sem** serviço de email (não há verificação de email obrigatória).
- Recuperação de palavra-passe: sem provider de email, o link de reposição é escrito no **log do servidor** (`[auth] reposição de palavra-passe para …`). Copia esse URL e abre-o no browser.
- Problemas comuns na primeira vez:
    - Porta `5432` ocupada → para outro Postgres local ou muda a porta no `docker-compose.yml` e no `DATABASE_URL`.
    - `BETTER_AUTH_SECRET` vazio → a autenticação falha; gera um valor com `openssl rand -base64 32`.
    - Docker parado → `npm run db:up` falha; confirma que o Docker Desktop (ou o daemon) está a correr.
