import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { UserPlus, Loader2 } from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUp } from '@/lib/auth-client'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem')
      return
    }
    setLoading(true)
    const { error: signUpError } = await signUp.email({ name, email, password })
    setLoading(false)
    if (signUpError) {
      setError(signUpError.message || 'Não foi possível criar a conta')
      return
    }
    await navigate({ to: '/' })
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Cria a tua conta"
      subtitle="Regista-te para começar"
      footer={
        <>
          Já tens conta?{' '}
          <Link to="/login" className="font-medium text-[#2fe06b] hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      {error && <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@exemplo.pt" className="h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Palavra-passe</Label>
          <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar palavra-passe</Label>
          <Input id="confirm" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12" />
        </div>
        <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'A criar conta...' : 'Criar conta'}
        </Button>
      </form>
    </AuthLayout>
  )
}
