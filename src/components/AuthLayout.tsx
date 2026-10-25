import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  icon: LucideIcon
  title: string
  subtitle?: string
  footer?: ReactNode
  children?: ReactNode
}

// Cartão centrado usado pelas páginas de entrar, registo e recuperação.
export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#062b16] px-4 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2fe06b]">
            <Icon className="h-7 w-7 text-[#062b16]" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-[#9bd0a8]">{subtitle}</p>}
        </div>
        <Card className="bg-[#0d3f22] ring-[#186a35]">
          <CardHeader className="sr-only">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">{children}</CardContent>
          {footer && <CardFooter className="justify-center text-sm text-[#9bd0a8]">{footer}</CardFooter>}
        </Card>
      </div>
    </div>
  )
}
