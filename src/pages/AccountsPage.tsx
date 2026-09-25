import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, displayName, type LabUser } from '../api'
import { useSession } from '../session'

export function AccountsPage() {
  const { adminToken, acting, connectAs } = useSession()
  const navigate = useNavigate()
  const [users, setUsers] = useState<LabUser[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)

  useEffect(() => {
    if (!adminToken) return
    void api<{ data: LabUser[] }>('/users', { token: adminToken })
      .then((payload) => setUsers(payload.data))
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : 'Liste indisponible')
      )
  }, [adminToken])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return users
    return users.filter((user) => {
      const blob = `${user.email} ${user.firstName ?? ''} ${user.lastName ?? ''}`.toLowerCase()
      return blob.includes(needle)
    })
  }, [query, users])

  async function choose(userId: number) {
    setPendingId(userId)
    setError(null)
    try {
      await connectAs(userId)
      navigate('/compte')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impersonation impossible')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <main className="page stack">
      <div>
        <h1>Comptes</h1>
        <p className="muted">Choisis un éleveur. Les écrans suivants utilisent son jeton.</p>
      </div>
      <label>
        Recherche
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom ou e-mail" />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <div className="stack">
        {visible.map((user) => (
          <article className="card row" key={user.id} style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>{displayName(user)}</strong>
              <div className="muted">{user.email}</div>
            </div>
            <button
              className="button"
              type="button"
              disabled={pendingId === user.id}
              onClick={() => void choose(user.id)}
            >
              {acting?.user.id === user.id ? 'Déjà connecté' : 'Se connecter en tant que'}
            </button>
          </article>
        ))}
      </div>
    </main>
  )
}
