import { createFileRoute, redirect } from '@tanstack/react-router'

// Nome antigo da secção Aulas.
export const Route = createFileRoute('/_authed/treinos')({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: '/aulas' })
  },
})
