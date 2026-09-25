import { useEffect, useMemo, useRef, useState } from 'react'
import { api, type DeviceRow, type ReadingRow, type TerrariumRow } from '../api'
import { useSession } from '../session'

type Mode = 'constant' | 'sine' | 'walk'

type Targets = { hot: number; cold: number; humidity: number }

function targetsFor(terrarium: TerrariumRow | undefined, now = new Date()): Targets {
  const schedule = terrarium?.habitatSchedule
  const flat = {
    hot: schedule?.targetHotC ?? 32,
    cold: schedule?.targetColdC ?? 26,
    humidity: schedule?.targetHumidity ?? 60,
  }
  if (!schedule?.lightsOn || !schedule.lightsOff) return flat
  const minutes = now.getHours() * 60 + now.getMinutes()
  const on = toMinutes(schedule.lightsOn)
  const off = toMinutes(schedule.lightsOff)
  const day = on <= off ? minutes >= on && minutes < off : minutes >= on || minutes < off
  const cycle = day ? schedule.dayTargets : schedule.nightTargets
  if (!cycle) return flat
  return { hot: cycle.targetHotC, cold: cycle.targetColdC, humidity: cycle.targetHumidity }
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function SensorsPage() {
  const { acting } = useSession()
  const token = acting?.token
  const [terrariums, setTerrariums] = useState<TerrariumRow[]>([])
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [terrariumId, setTerrariumId] = useState<number | null>(null)
  const [latest, setLatest] = useState<ReadingRow | null>(null)
  const [mode, setMode] = useState<Mode>('sine')
  const [intervalSeconds, setIntervalSeconds] = useState(10)
  const [temperature, setTemperature] = useState(30)
  const [humidity, setHumidity] = useState(60)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backfillHours, setBackfillHours] = useState(24)
  const [pending, setPending] = useState(false)
  const walk = useRef({ temperature: 30, humidity: 60 })
  const step = useRef(0)

  useEffect(() => {
    if (!token) return
    void Promise.all([
      api<{ data: TerrariumRow[] }>('/terrariums', { token }),
      api<{ data: DeviceRow[] }>('/iot-devices', { token }),
    ]).then(([terrariumRes, deviceRes]) => {
      setTerrariums(terrariumRes.data)
      setDevices(deviceRes.data)
      setTerrariumId((current) => current ?? terrariumRes.data[0]?.id ?? null)
    })
  }, [token])

  const device = useMemo(
    () => devices.find((item) => item.terrariumId === terrariumId && item.status === 'paired'),
    [devices, terrariumId]
  )
  const terrarium = terrariums.find((item) => item.id === terrariumId)
  const targets = targetsFor(terrarium)

  async function refreshLatest(id: number) {
    if (!token) return
    const payload = await api<{ data: ReadingRow | null }>(`/terrariums/${id}/sensor-readings/latest`, {
      token,
    })
    setLatest(payload.data)
  }

  useEffect(() => {
    if (!terrariumId) return
    void refreshLatest(terrariumId).catch((cause: unknown) =>
      setError(cause instanceof Error ? cause.message : 'Lecture impossible')
    )
    // refreshLatest closes over token; terrariumId change is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terrariumId, token])

  useEffect(() => {
    if (!running || !token || !device || !terrariumId) return
    let stopped = false

    const tick = async () => {
      const point = nextPoint()
      try {
        await api('/dev/sensor-readings', {
          method: 'POST',
          token,
          body: {
            iotDeviceId: device.id,
            temperatureC: point.temperatureC,
            humidityPercent: point.humidityPercent,
          },
        })
        if (!stopped) await refreshLatest(terrariumId)
      } catch (cause) {
        if (!stopped) setError(cause instanceof Error ? cause.message : 'Envoi impossible')
        setRunning(false)
      }
    }

    void tick()
    const timer = window.setInterval(() => void tick(), Math.max(2, intervalSeconds) * 1000)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [running, token, device, terrariumId, intervalSeconds, mode, temperature, humidity, targets.hot, targets.cold, targets.humidity])

  function nextPoint() {
    step.current += 1
    if (mode === 'constant') {
      return { temperatureC: temperature, humidityPercent: humidity }
    }
    if (mode === 'sine') {
      const mid = (targets.hot + targets.cold) / 2
      const wave = Math.sin(step.current / 4)
      return {
        temperatureC: Number((mid + wave * 1.2).toFixed(1)),
        humidityPercent: Number((targets.humidity + Math.sin(step.current / 5) * 4).toFixed(1)),
      }
    }
    walk.current = {
      temperature: clamp(walk.current.temperature + (Math.random() - 0.5) * 0.8, 18, 40),
      humidity: clamp(walk.current.humidity + (Math.random() - 0.5) * 2, 25, 95),
    }
    return {
      temperatureC: Number(walk.current.temperature.toFixed(1)),
      humidityPercent: Number(walk.current.humidity.toFixed(1)),
    }
  }

  async function backfill() {
    if (!token || !device) return
    setPending(true)
    setError(null)
    try {
      const count = Math.min(2000, Math.max(1, Math.floor((backfillHours * 60) / 15)))
      const points = Array.from({ length: count }, (_, index) => {
        const minutesAgo = (count - index) * 15
        const wave = Math.sin(index / 6)
        const mid = (targets.hot + targets.cold) / 2
        return {
          iotDeviceId: device.id,
          temperatureC: Number((mid + wave * 1.2).toFixed(1)),
          humidityPercent: Number((targets.humidity + wave * 4).toFixed(1)),
          recordedAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
        }
      })
      await api('/dev/sensor-readings/batch', { method: 'POST', token, body: { points } })
      if (terrariumId) await refreshLatest(terrariumId)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Backfill impossible')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="page stack">
      <div>
        <h1>Capteurs</h1>
        <p className="muted">
          Consignes {targets.hot}°C / {targets.cold}°C · {targets.humidity}% HR
        </p>
      </div>
      <div className="card row">
        <label>
          Terrarium
          <select
            value={terrariumId ?? ''}
            onChange={(event) => {
              setRunning(false)
              setTerrariumId(Number(event.target.value))
            }}
          >
            {terrariums.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <div>
          <div className="muted">Dernière mesure</div>
          <strong>
            {latest
              ? `${latest.temperatureC}°C · ${latest.humidityPercent}% · ${latest.source}`
              : device
                ? 'Aucune'
                : 'Aucun boîtier apparié'}
          </strong>
        </div>
      </div>
      <section className="card stack">
        <div className="row">
          <label>
            Mode
            <select value={mode} onChange={(event) => setMode(event.target.value as Mode)}>
              <option value="constant">Constante</option>
              <option value="sine">Oscillation autour des consignes</option>
              <option value="walk">Marche aléatoire</option>
            </select>
          </label>
          <label>
            Intervalle (s)
            <input
              type="number"
              min={2}
              max={120}
              value={intervalSeconds}
              onChange={(event) => setIntervalSeconds(Number(event.target.value))}
            />
          </label>
          {mode === 'constant' ? (
            <>
              <label>
                Température
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(event) => setTemperature(Number(event.target.value))}
                />
              </label>
              <label>
                Humidité
                <input
                  type="number"
                  step="0.1"
                  value={humidity}
                  onChange={(event) => setHumidity(Number(event.target.value))}
                />
              </label>
            </>
          ) : null}
        </div>
        <div className="row">
          <button
            className="button"
            type="button"
            disabled={!device}
            onClick={() => {
              walk.current = { temperature: targets.hot, humidity: targets.humidity }
              step.current = 0
              setError(null)
              setRunning((value) => !value)
            }}
          >
            {running ? 'Arrêter la simulation' : 'Démarrer la simulation'}
          </button>
          <label>
            Backfill (heures)
            <input
              type="number"
              min={1}
              max={72}
              value={backfillHours}
              onChange={(event) => setBackfillHours(Number(event.target.value))}
            />
          </label>
          <button className="button-ghost" type="button" disabled={!device || pending} onClick={() => void backfill()}>
            Injecter l’historique
          </button>
        </div>
        {running ? <p className="ok">Simulation en cours. Fermer cet écran l’arrête.</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </section>
    </main>
  )
}
