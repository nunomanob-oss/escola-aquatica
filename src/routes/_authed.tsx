import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getSessionFn } from '@/lib/session'
import OfflineSync from '@/components/swim/OfflineSync'

// Layout de tudo o que exige login. Sem sessão, envia para /login.
export const Route = createFileRoute('/_authed')({
  ssr: false,
  beforeLoad: async () => {
    const session = await getSessionFn()
    if (!session) throw redirect({ to: '/login' })
    return { session }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  return (
    <>
      <OfflineSync />
      <Outlet />
    </>
  )
}
