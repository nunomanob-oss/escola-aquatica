import { createFileRoute } from '@tanstack/react-router'
import ResetPassword from '@/pages/auth/ResetPassword'

export const Route = createFileRoute('/reset-password')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: ResetPasswordRoute,
})

function ResetPasswordRoute() {
  const { token } = Route.useSearch()
  return <ResetPassword token={token} />
}
