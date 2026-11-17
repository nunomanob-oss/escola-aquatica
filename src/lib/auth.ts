import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db, schema } from '@/db'

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined

export const auth = betterAuth({
  appName: 'Escola Aquática',
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // A recuperação de palavra-passe precisa de um serviço de email; por agora o link vai para o log.
    sendResetPassword: async ({ user, url }) => {
      console.info(`[auth] reposição de palavra-passe para ${user.email}: ${url}`)
    },
  },
  socialProviders: google,
  session: {
    // A sessão fica também num cookie assinado durante 5 min: as chamadas à API deixam de ir à BD (sessão +
    // utilizador) em cada pedido. Contrapartida: um logout noutro dispositivo ou uma sessão revogada só deixam
    // de valer aqui ao fim de, no máximo, 5 min.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'user', input: false },
    },
  },
  plugins: [tanstackStartCookies()],
})
