import { useEffect, useState } from 'react'
import { ErrorAlert, Page, PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  api,
  type ActivityRow,
  type BreedingRow,
  type ConsumableRow,
  type DeviceRow,
  type EquipmentRow,
  type RackRow,
  type ReadingRow,
  type ReminderRow,
  type ReptileRow,
  type SheddingRow,
  type TerrariumRow,
} from '../api'
import { useSession } from '../session'

function deviceStatusLabel(status: string) {
  if (status === 'paired') return 'Apparié'
  if (status === 'unpaired') return 'Non apparié'
  return status
}

const BREEDING_LABELS: Record<string, string> = {
  planning: 'Planifiée',
  introduced: 'Introduite',
  mated: 'Accouplée',
  separated: 'Séparée',
  gravid: 'Gravide',
  laid: 'Ponte',
  hatching: 'Éclosion',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const SHEDDING_LABELS: Record<string, string> = {
  pre_shed: 'Avant mue',
  in_progress: 'En cours',
  completed: 'Terminée',
  incomplete: 'Incomplète',
}

function formatWhen(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

export function OverviewPage() {
  const { acting } = useSession()
  const token = acting?.token
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reptiles, setReptiles] = useState<ReptileRow[]>([])
  const [terrariums, setTerrariums] = useState<TerrariumRow[]>([])
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [reminders, setReminders] = useState<ReminderRow[]>([])
  const [activities, setActivities] = useState<ActivityRow[]>([])
  const [racks, setRacks] = useState<RackRow[]>([])
  const [equipment, setEquipment] = useState<EquipmentRow[]>([])
  const [consumables, setConsumables] = useState<ConsumableRow[]>([])
  const [breeding, setBreeding] = useState<BreedingRow[]>([])
  const [shedding, setShedding] = useState<SheddingRow[]>([])
  const [readings, setReadings] = useState<Record<number, ReadingRow | null>>({})

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setError(null)
    setLoading(true)

    void (async () => {
      try {
        const [reptileRes, terrariumRes, deviceRes, reminderRes, activityRes, rackRes, equipmentRes, consumableRes, breedingRes, sheddingRes] =
          await Promise.all([
            api<{ data: ReptileRow[] }>('/reptiles/all', { token }),
            api<{ data: TerrariumRow[] }>('/terrariums', { token }),
            api<{ data: DeviceRow[] }>('/iot-devices', { token }),
            api<{ data: ReminderRow[] }>('/reminders/all', { token }),
            api<{ data: ActivityRow[] }>('/activity-logs/timeline?limit=8', { token }),
            api<{ data: RackRow[] }>('/racks', { token }),
            api<{ data: EquipmentRow[] }>('/equipments', { token }),
            api<{ data: ConsumableRow[] }>('/consumables', { token }),
            api<{ data: BreedingRow[] }>('/breeding-events', { token }),
            api<{ data: SheddingRow[] }>('/shedding-cycles', { token }),
          ])
        if (cancelled) return
        setReptiles(reptileRes.data)
        setTerrariums(terrariumRes.data)
        setDevices(deviceRes.data)
        setReminders(reminderRes.data)
        setActivities(activityRes.data)
        setRacks(rackRes.data)
        setEquipment(equipmentRes.data)
        setConsumables(consumableRes.data)
        setBreeding(breedingRes.data)
        setShedding(sheddingRes.data)

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
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token])

  const metrics = [
    { label: 'Reptiles', value: reptiles.length, hint: 'Fiches du compte' },
    { label: 'Terrariums', value: terrariums.length, hint: 'Habitats suivis' },
    { label: 'Racks', value: racks.length, hint: 'Structures de rangement' },
    { label: 'Équipements', value: equipment.length, hint: 'Matériel installé' },
    { label: 'Stocks', value: consumables.length, hint: 'Consommables' },
    { label: 'Reproductions', value: breeding.length, hint: 'Événements de reproduction' },
    { label: 'Mues', value: shedding.length, hint: 'Cycles enregistrés' },
    { label: 'Boîtiers', value: devices.length, hint: 'Équipements IoT' },
    { label: 'Rappels', value: reminders.length, hint: 'Planifiés sur le compte' },
  ]

  return (
    <Page>
      <PageHeader
        title="Vue du compte"
        description="Indicateurs du compte : cheptel, matériel, stocks, reproduction et suivi."
      />
      <ErrorAlert message={error} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Indicateurs">
        {metrics.map((metric) => (
          <Card key={metric.label} size="sm">
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {loading ? <Skeleton className="h-8 w-12" /> : metric.value}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{metric.hint}</CardContent>
          </Card>
        ))}
      </section>
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Terrariums</CardTitle>
            <CardDescription>Dernière mesure connue pour chaque habitat.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Nom</TableHead>
                  <TableHead scope="col">Température</TableHead>
                  <TableHead scope="col">Humidité</TableHead>
                  <TableHead scope="col">Relevé</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : terrariums.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                      Aucun terrarium.
                    </TableCell>
                  </TableRow>
                ) : (
                  terrariums.map((terrarium) => {
                    const reading = readings[terrarium.id]
                    return (
                      <TableRow key={terrarium.id}>
                        <TableCell className="font-medium">{terrarium.name}</TableCell>
                        <TableCell className="tabular-nums">
                          {reading ? `${reading.temperatureC} °C` : '—'}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {reading ? `${reading.humidityPercent} %` : '—'}
                        </TableCell>
                        <TableCell>{reading ? formatWhen(reading.recordedAt) : 'Pas de mesure'}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Dernières activités</CardTitle>
            <CardDescription>Huit événements les plus récents.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-24 w-full" /> : null}
            {!loading && activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité.</p>
            ) : null}
            <ul className="grid gap-3">
              {activities.map((activity) => (
                <li key={activity.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{formatWhen(activity.actionDate)}</p>
                  </div>
                  <Badge variant="outline">{activity.actionType}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Reptiles</CardTitle>
            <CardDescription>Fiches présentes sur ce compte.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecordList
              loading={loading}
              empty="Aucun reptile."
              rows={reptiles.map((reptile) => ({
                id: reptile.id,
                title: reptile.name,
                detail: reptile.commonName || reptile.status || '—',
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Boîtiers</CardTitle>
            <CardDescription>Statut d’appairage des équipements.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecordList
              loading={loading}
              empty="Aucun boîtier."
              rows={devices.map((device) => ({
                id: device.id,
                title: device.externalDeviceId,
                detail: deviceStatusLabel(device.status),
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rappels</CardTitle>
            <CardDescription>Les rappels du compte, douze au plus.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecordList
              loading={loading}
              empty="Aucun rappel."
              rows={reminders.slice(0, 12).map((reminder) => ({
                id: reminder.id,
                title: reminder.title || reminder.type,
                detail: reminder.isActive === false ? 'Inactif' : reminder.type,
              }))}
            />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Racks</CardTitle>
            <CardDescription>Structures de rangement du compte.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecordList
              loading={loading}
              empty="Aucun rack."
              rows={racks.map((rack) => ({
                id: rack.id,
                title: rack.name,
                detail: rack.capacity ? `${rack.capacity} places` : '—',
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Équipements</CardTitle>
            <CardDescription>Matériel rattaché aux terrariums.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecordList
              loading={loading}
              empty="Aucun équipement."
              rows={equipment.map((item) => ({
                id: item.id,
                title: item.name,
                detail: item.type,
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Stocks</CardTitle>
            <CardDescription>Consommables disponibles.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecordList
              loading={loading}
              empty="Aucun stock."
              rows={consumables.map((item) => ({
                id: item.id,
                title: item.name,
                detail: `${item.quantity}`,
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reproductions</CardTitle>
            <CardDescription>Événements entre un mâle et une femelle.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecordList
              loading={loading}
              empty="Aucune reproduction."
              rows={breeding.map((event) => ({
                id: event.id,
                title: `Événement ${event.id}`,
                detail: BREEDING_LABELS[event.status] ?? event.status,
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mues</CardTitle>
            <CardDescription>Cycles enregistrés sur les reptiles.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecordList
              loading={loading}
              empty="Aucune mue."
              rows={shedding.map((cycle) => ({
                id: cycle.id,
                title: `Reptile ${cycle.reptileId}`,
                detail: SHEDDING_LABELS[cycle.status] ?? cycle.status,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </Page>
  )
}

function RecordList({
  rows,
  empty,
  loading,
}: {
  rows: { id: number; title: string; detail: string }[]
  empty: string
  loading: boolean
}) {
  if (loading) return <Skeleton className="h-16 w-full" />
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>
  return (
    <ul className="grid gap-2">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="min-w-0 truncate font-medium">{row.title}</span>
          <span className="shrink-0 text-muted-foreground">{row.detail}</span>
        </li>
      ))}
    </ul>
  )
}
