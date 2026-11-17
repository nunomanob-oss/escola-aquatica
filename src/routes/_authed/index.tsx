import { createFileRoute, redirect } from '@tanstack/react-router'

// A página inicial é Níveis (a antiga aba Conteúdos foi removida).
export const Route = createFileRoute('/_authed/')({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: '/niveis' })
  },
})
