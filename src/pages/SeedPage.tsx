import { FormEvent, useState } from 'react'
import { api, type ScenarioResult } from '../api'
import { useSession } from '../session'

export function SeedPage() {
  const { acting } = useSession()
  const [terrariums, setTerrariums] = useState(1)
  const [reptiles, setReptiles] = useState(2)
  const [withDevice, setWithDevice] = useState(true)
  const [withHistoryHours, setWithHistoryHours] = useState(0)
  const [result, setResult] = useState<ScenarioResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!acting) return
    setPending(true)
    setError(null)
    try {
      const created = await api<{ data: ScenarioResult }>('/dev/scenarios/breeder', {
        method: 'POST',
        token: acting.token,
        body: { terrariums, reptiles, withDevice, withHistoryHours },
      })
      setResult(created.data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Génération impossible')
    } finally {
      setPending(false)
    }
  }

  async function remove() {
    if (!acting || !result) return
    setPending(true)
    setError(null)
    try {
      await api(`/dev/scenarios/${result.labRunId}`, { method: 'DELETE', token: acting.token })
      setResult(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Suppression impossible')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="page stack">
      <div>
        <h1>Jeu de données</h1>
        <p className="muted">Crée reptiles, terrariums, un rappel, une activité et un boîtier sur ce compte.</p>
      </div>
      <form className="card stack" onSubmit={(event) => void onSubmit(event)}>
        <div className="row">
          <label>
            Terrariums
            <input
              type="number"
              min={1}
              max={3}
              value={terrariums}
              onChange={(event) => setTerrariums(Number(event.target.value))}
            />
          </label>
          <label>
            Reptiles
            <input
              type="number"
              min={1}
              max={8}
              value={reptiles}
              onChange={(event) => setReptiles(Number(event.target.value))}
            />
          </label>
          <label>
            Historique (heures)
            <input
              type="number"
              min={0}
              max={72}
              value={withHistoryHours}
              onChange={(event) => setWithHistoryHours(Number(event.target.value))}
            />
          </label>
          <label>
            Boîtier apparié
            <input
              type="checkbox"
              checked={withDevice}
              onChange={(event) => setWithDevice(event.target.checked)}
            />
          </label>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'En cours…' : 'Générer'}
        </button>
      </form>
      {result ? (
        <article className="card stack">
          <p>
            Run <code>{result.labRunId}</code>
          </p>
          <p className="muted">
            {result.reptileIds.length} reptiles · {result.terrariumIds.length} terrariums ·{' '}
            {result.readingCount} mesures
          </p>
          <button className="button-ghost" type="button" disabled={pending} onClick={() => void remove()}>
            Supprimer ce jeu
          </button>
        </article>
      ) : null}
    </main>
  )
}
