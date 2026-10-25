# Escola Aquática

Ferramenta interna para os instrutores do Clube Fluvial Portuense: preparar as aulas, consultar a biblioteca técnica de exercícios e criar fichas de treino imprimíveis.

Stack: TanStack Start (React, Vite), TypeScript, Tailwind CSS e componentes shadcn/ui (tema neutro), Postgres com Drizzle ORM e autenticação com Better Auth.

## Requisitos

- Node.js 24 (LTS). Recomendado com [fnm](https://github.com/Schniz/fnm): `fnm install --lts`
- Docker (para o Postgres local)

## Primeira vez

```bash
npm install
cp .env.example .env        # e preenche BETTER_AUTH_SECRET (openssl rand -base64 32)
npm run db:up              # sobe o Postgres em localhost:5432
npm run db:migrate         # cria as tabelas
npm run db:seed            # carrega as turmas e a biblioteca (175 exercícios)
npm run dev                # http://localhost:3000
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run typecheck` | Verificação de tipos |
| `npm run db:up` / `db:down` | Arranca / para o Postgres (Docker) |
| `npm run db:generate` | Gera uma migração a partir de `src/db/schema.ts` |
| `npm run db:migrate` | Aplica as migrações |
| `npm run db:seed` | Carrega turmas e biblioteca (idempotente) |
| `npm run db:studio` | Interface para ver a base de dados |
| `node scripts/library/build.mjs` | Valida a biblioteca e gera `base44/seed/exercise-library.json` |

## Estrutura

- `src/routes/`: rotas (ficheiros do TanStack Router). `_authed/` exige login.
- `src/pages/`: ecrãs (Conteúdos, Biblioteca, Aulas, Painel e as páginas de autenticação).
- `src/components/swim/`: componentes da app (exercícios, fichas, painel, demonstração 3D).
- `src/components/ui/`: componentes shadcn/ui.
- `src/db/schema.ts`: tabelas (Postgres) de utilizadores, turmas, exercícios, fichas e sumários.
- `src/server/entities.ts`: funções de servidor que leem e escrevem na base de dados.
- `src/lib/entities.ts`: cliente com a mesma forma de chamadas usada pelos componentes (`list`, `filter`, `create`, `update`, `delete`).
- `src/lib/auth.ts`: configuração do Better Auth.
- `scripts/library/`: os exercícios da biblioteca, um ficheiro por nível.
- `docs/`: documentação de produto e da biblioteca.

## Notas

- Os dados são só para instrutores. Não há dados pessoais de alunos.
- Offline: a leitura usa cache local (`localStorage`) e as escritas sem rede ficam numa fila que é enviada quando a ligação volta.
- Por omissão, a recuperação de palavra-passe escreve o link no log do servidor (ainda não há serviço de email).
