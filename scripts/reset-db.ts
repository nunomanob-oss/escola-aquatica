// Apaga todos os dados da base, volta a aplicar as migrações e corre o seed.
// Uso: npm run db:reset
import "dotenv/config"
import { spawnSync } from "node:child_process"
import postgres from "postgres"

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error("DATABASE_URL não está definida. Copia .env.example para .env.")
}

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

async function wipe() {
  const sql = postgres(url!, { max: 1 })
  try {
    console.log("A limpar a base de dados…")
    await sql.unsafe("DROP SCHEMA IF EXISTS drizzle CASCADE")
    await sql.unsafe("DROP SCHEMA public CASCADE")
    await sql.unsafe("CREATE SCHEMA public")
    await sql.unsafe("GRANT ALL ON SCHEMA public TO public")
    console.log("Base limpa.")
  } finally {
    await sql.end({ timeout: 5 })
  }
}

await wipe()
run("npm", ["run", "db:migrate"])
run("npm", ["run", "db:seed"])
console.log("Reset concluído.")
