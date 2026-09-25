import { useEffect, useState } from 'react'
import {
  api,
  type ActivityRow,
  type DeviceRow,
  type ReadingRow,
  type ReminderRow,
  type ReptileRow,
  type TerrariumRow,
} from '../api'
import { useSession } from '../session'

export function OverviewPage() {
  const { acting } = useSession()
  const token = acting?.token
  const [error, setError] = useState<string | null>(null)
  const [reptiles, setReptiles] = useState<ReptileRow[]>([])
  const [terrariums, setTerrariums] = useState<TerrariumRow[]>([])
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [reminders, setReminders] = useState<ReminderRow[]>([])
  const [activities, setActivities] = useState<ActivityRow[]>([])
  const [readings, setReadings] = useState<Record<number, ReadingRow | null>>({})

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setError(null)

    void (async () => {
      try {
        const [reptileRes, terrariumRes, deviceRes, reminderRes, activityRes] = await Promise.all([
          api<{ data: ReptileRow[] }>('/reptiles/all', { token }),
          api<{ data: TerrariumRow[] }>('/terrariums', { token }),
          api<{ data: DeviceRow[] }>('/iot-devices', { token }),
          api<{ data: ReminderRow[] }>('/reminders/all', { token }),
          api<{ data: ActivityRow[] }>('/activity-logs/timeline?limit=8', { token }),
        ])
        if (cancelled) return
        setReptiles(reptileRes.data)
        setTerrariums(terrariumRes.data)
        setDevices(deviceRes.data)
        setReminders(reminderRes.data)
        setActivities(activityRes.data)

        const latestEntries = await Promise.all(
          terrariumRes.data.map(async (terrarium) => {
            const latest = await api<{ data: ReadingRow | null }>(
              `/terrariums/${terrarium.id}/sensor-readings/latest`,
              { token }
            )
            return [terrarium.id, latest.data] as const
          })
        )
        if (!cancelled) setReadings(Object.fromEntries(latestEntries))
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Lecture impossible')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <main className="page stack">
      <h1>Vue du compte</h1>
      {error ? <p className="error">{error}</p> : null}
      <section className="grid">
        <article className="card">
          <div className="muted">Reptiles</div>
          <p className="metric">{reptiles.length}</p>
          <ul>
            {reptiles.map((reptile) => (
              <li key={reptile.id}>
                {reptile.name}
                {reptile.commonName ? ` · ${reptile.commonName}` : ''}
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <div className="muted">Terrariums</div>
          <p className="metric">{terrariums.length}</p>
          <ul>
            {terrariums.map((terrarium) => {
              const reading = readings[terrarium.id]
              return (
                <li key={terrarium.id}>
                  {terrarium.name}
                  {reading
                    ? ` · ${reading.temperatureC}°C / ${reading.humidityPercent}%`
                    : ' · pas de mesure'}
                </li>
              )
            })}
          </ul>
        </article>
        <article className="card">
          <div className="muted">Boîtiers</div>
          <p className="metric">{devices.length}</p>
          <ul>
            {devices.map((device) => (
              <li key={device.id}>
                {device.externalDeviceId} · {device.status}
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <div className="muted">Rappels</div>
          <p className="metric">{reminders.length}</p>
          <ul>
            {reminders.slice(0, 8).map((reminder) => (
              <li key={reminder.id}>{reminder.title || reminder.type}</li>
            ))}
          </ul>
        </article>
      </section>
      <section className="card">
        <h2>Dernières activités</h2>
        {activities.length === 0 ? <p className="muted">Aucune activité.</p> : null}
        <ul>
          {activities.map((activity) => (
            <li key={activity.id}>
              {activity.title} · {activity.actionType}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
