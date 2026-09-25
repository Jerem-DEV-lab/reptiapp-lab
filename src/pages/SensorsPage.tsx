import { useEffect, useMemo, useRef, useState } from 'react'
import { ErrorAlert, Page, PageHeader } from '@/components/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, type DeviceRow, type ReadingRow, type TerrariumRow } from '../api'
import { useSession } from '../session'

type Mode = 'constant' | 'sine' | 'walk'

type Targets = { hot: number; cold: number; humidity: number }

const modes: { value: Mode; label: string }[] = [
  { value: 'constant', label: 'Constante' },
  { value: 'sine', label: 'Oscillation autour des consignes' },
  { value: 'walk', label: 'Marche aléatoire' },
]

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
  const [loading, setLoading] = useState(true)
  const walk = useRef({ temperature: 30, humidity: 60 })
  const step = useRef(0)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    void Promise.all([
      api<{ data: TerrariumRow[] }>('/terrariums', { token }),
      api<{ data: DeviceRow[] }>('/iot-devices', { token }),
    ])
      .then(([terrariumRes, deviceRes]) => {
        if (cancelled) return
        setTerrariums(terrariumRes.data)
        setDevices(deviceRes.data)
        setTerrariumId((current) => current ?? terrariumRes.data[0]?.id ?? null)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Lecture impossible')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
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
    <Page>
      <PageHeader
        title="Capteurs"
        description={`Consignes ${targets.hot} °C / ${targets.cold} °C · ${targets.humidity} % HR`}
        actions={
          running ? <Badge>Simulation en cours</Badge> : <Badge variant="outline">À l’arrêt</Badge>
        }
      />
      <ErrorAlert message={error} />
      {!loading && terrariums.length === 0 ? (
        <Alert>
          <AlertTitle>Aucun terrarium</AlertTitle>
          <AlertDescription>Générez un jeu de données avant de simuler des mesures.</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Habitat</CardTitle>
            <CardDescription>Le boîtier utilisé doit être apparié à ce terrarium.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sensor-terrarium">Terrarium</Label>
              <Select
                value={terrariumId ? String(terrariumId) : undefined}
                onValueChange={(value) => {
                  setRunning(false)
                  setTerrariumId(Number(value))
                }}
                disabled={terrariums.length === 0}
              >
                <SelectTrigger id="sensor-terrarium" className="w-full">
                  <SelectValue placeholder={loading ? 'Chargement…' : 'Choisir un terrarium'} />
                </SelectTrigger>
                <SelectContent>
                  {terrariums.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Dernière température</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {latest ? `${latest.temperatureC} °C` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Dernière humidité</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {latest ? `${latest.humidityPercent} %` : '—'}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">Source</dt>
                <dd>{latest ? latest.source : device ? 'Aucune mesure' : 'Aucun boîtier apparié'}</dd>
              </div>
            </dl>
            {!loading && !device ? (
              <Alert>
                <AlertTitle>Aucun boîtier apparié</AlertTitle>
                <AlertDescription>
                  La simulation et l’historique nécessitent un boîtier au statut apparié sur ce terrarium.
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Simulation</CardTitle>
            <CardDescription>Fermer cet écran arrête l’envoi des mesures.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="sensor-mode">Mode</Label>
              <Select value={mode} onValueChange={(value) => setMode(value as Mode)}>
                <SelectTrigger id="sensor-mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modes.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sensor-interval">Intervalle (s)</Label>
              <Input
                id="sensor-interval"
                type="number"
                min={2}
                max={120}
                value={intervalSeconds}
                onChange={(event) => setIntervalSeconds(Number(event.target.value))}
              />
            </div>
            {mode === 'constant' ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="sensor-temperature">Température</Label>
                  <Input
                    id="sensor-temperature"
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(event) => setTemperature(Number(event.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sensor-humidity">Humidité</Label>
                  <Input
                    id="sensor-humidity"
                    type="number"
                    step="0.1"
                    value={humidity}
                    onChange={(event) => setHumidity(Number(event.target.value))}
                  />
                </div>
              </>
            ) : null}
          </CardContent>
          <CardFooter className="justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {running ? 'Simulation en cours.' : 'Simulation arrêtée.'}
            </p>
            <Button
              type="button"
              variant={running ? 'destructive' : 'default'}
              disabled={!device}
              onClick={() => {
                walk.current = { temperature: targets.hot, humidity: targets.humidity }
                step.current = 0
                setError(null)
                setRunning((value) => !value)
              }}
            >
              {running ? 'Arrêter la simulation' : 'Démarrer la simulation'}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
          <CardDescription>Injecte une série de mesures espacées de 15 minutes.</CardDescription>
        </CardHeader>
        <CardContent className="grid max-w-xs gap-2">
          <Label htmlFor="sensor-backfill">Backfill (heures)</Label>
          <Input
            id="sensor-backfill"
            type="number"
            min={1}
            max={72}
            value={backfillHours}
            onChange={(event) => setBackfillHours(Number(event.target.value))}
          />
        </CardContent>
        <CardFooter>
          <Button type="button" variant="outline" disabled={!device || pending} onClick={() => void backfill()}>
            {pending ? 'Injection…' : 'Injecter l’historique'}
          </Button>
        </CardFooter>
      </Card>
    </Page>
  )
}
