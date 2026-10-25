import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, Lock, Loader2 } from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'

export default function ResetPassword({ token }: { token?: string }) {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Ligação inválida"
        subtitle="Esta ligação para repor a palavra-passe está incompleta ou é inválida"
        footer={
          <Link to="/forgot-password" className="font-medium text-[#2fe06b] hover:underline">
            Pedir nova ligação
          </Link>
        }
      >
        <p className="text-center text-sm">Pede um novo email para repor a palavra-passe.</p>
      </AuthLayout>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('As palavras-passe não coincidem')
      return
    }
    setLoading(true)
    const { error: resetError } = await authClient.resetPassword({ newPassword, token })
    setLoading(false)
    if (resetError) {
      setError(resetError.message || 'Não foi possível repor a palavra-passe')
      return
    }
    await navigate({ to: '/login' })
  }

  return (
    <AuthLayout icon={Lock} title="Nova palavra-passe" subtitle="Escreve a nova palavra-passe">
      {error && <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nova palavra-passe</Label>
          <Input id="password" type="password" autoComplete="new-password" autoFocus required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar palavra-passe</Label>
          <Input id="confirm" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12" />
        </div>
        <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'A repor...' : 'Repor palavra-passe'}
        </Button>
      </form>
    </AuthLayout>
  )
}
