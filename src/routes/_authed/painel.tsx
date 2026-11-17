import { createFileRoute, redirect } from '@tanstack/react-router'

// A aba Painel foi removida; endereços antigos vão para Níveis.
export const Route = createFileRoute('/_authed/painel')({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: '/niveis' })
  },
})
