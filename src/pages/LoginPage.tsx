import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { FlaskConicalIcon } from 'lucide-react'
import { ErrorAlert } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiBase, setApiBase } from '../api'
import { useSession } from '../session'

export function LoginPage() {
  const { adminToken, login } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [apiBase, setApiBaseField] = useState(getApiBase())
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (adminToken) return <Navigate to="/comptes" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setApiBase(apiBase)
    try {
      await login(email, password)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Connexion impossible')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="grid min-h-svh place-items-center bg-muted/40 p-4">
      <form className="w-full max-w-sm" onSubmit={(event) => void onSubmit(event)}>
        <Card>
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FlaskConicalIcon aria-hidden />
            </div>
            <CardTitle className="text-xl">Repti'Lab</CardTitle>
            <CardDescription>Console admin. Le compte doit avoir le rôle admin.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="api-base">URL de l’API</Label>
              <Input
                id="api-base"
                value={apiBase}
                onChange={(event) => setApiBaseField(event.target.value)}
                className="h-9"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-9"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="h-9"
              />
            </div>
            <ErrorAlert message={error} />
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? 'Connexion…' : 'Se connecter'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </main>
  )
}
