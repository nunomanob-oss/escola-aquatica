import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Toaster } from '@/components/ui/sonner'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Escola Aquática' },
      { name: 'theme-color', content: '#062b16' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  notFoundComponent: () => (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#062b16] p-6 text-center text-white">
      <h1 className="text-4xl font-light text-[#2fe06b]">404</h1>
      <p className="text-[#9bd0a8]">Página não encontrada.</p>
      <a href="/" className="mt-2 rounded-lg bg-[#2fe06b] px-4 py-2 font-semibold text-[#062b16]">
        Voltar ao início
      </a>
    </main>
  ),
  component: () => <Outlet />,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-[#062b16] text-white antialiased">
        {children}
        <Toaster />
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[{ name: 'TanStack Router', render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  )
}
