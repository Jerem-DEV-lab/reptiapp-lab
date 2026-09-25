import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
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
    <main className="login">
      <form className="card stack" onSubmit={(event) => void onSubmit(event)}>
        <div>
          <h1>Repti'Lab</h1>
          <p className="muted">Console admin. Le compte doit avoir le rôle admin.</p>
        </div>
        <label>
          URL de l’API
          <input value={apiBase} onChange={(event) => setApiBaseField(event.target.value)} />
        </label>
        <label>
          E-mail
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </main>
  )
}
