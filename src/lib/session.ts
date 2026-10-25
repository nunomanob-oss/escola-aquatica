import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

// Sessão atual (ou null), lida dos cookies do pedido.
export const getSessionFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { auth } = await import('./auth')
  const session = await auth.api.getSession({ headers: getRequest().headers })
  return session
    ? { user: { id: session.user.id, name: session.user.name, email: session.user.email, role: session.user.role } }
    : null
})
