import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    // Mostra sempre a mesma mensagem, para não revelar que contas existem.
    await authClient.requestPasswordReset({ email, redirectTo: '/reset-password' }).catch(() => undefined)
    setLoading(false)
    setSent(true)
  }

  return (
    <AuthLayout
      icon={Mail}
      title="Recuperar palavra-passe"
      subtitle="Vamos enviar-te uma ligação para a repores"
      footer={
        <Link to="/login" className="inline-flex items-center font-medium text-[#2fe06b] hover:underline">
          <ArrowLeft className="mr-1 h-3 w-3" />
          Voltar para entrar
        </Link>
      }
    >
      {sent ? (
        <p className="text-center text-sm">
          Se existir uma conta com esse email, vais receber em breve uma ligação para repor a palavra-passe.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Endereço de email</Label>
            <Input id="email" type="email" autoComplete="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@exemplo.pt" className="h-12" />
          </div>
          <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'A enviar...' : 'Enviar ligação'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
