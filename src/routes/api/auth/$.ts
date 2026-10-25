import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/lib/auth'

// Todas as rotas de autenticação do Better Auth em /api/auth/*.
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(request),
    },
  },
})
