import { FormEvent, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ErrorAlert, Page, PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api, type ScenarioResult } from '@/api'
import { useSession } from '@/session'
import {
  entities,
  entityByPath,
  recordLabel,
  remindableKind,
  type DraftKind,
  type DraftRecord,
  type FieldDef,
} from '@/seed/catalog'
import { useSeedDraft } from '@/seed/draft'
import { checkRecord, nextRef, toEntities } from '@/seed/payload'

const RESULT_COUNTS: { label: string; value: (result: ScenarioResult) => number }[] = [
  { label: 'Reptiles', value: (result) => result.reptileIds.length },
  { label: 'Terrariums', value: (result) => result.terrariumIds.length },
  { label: 'Racks', value: (result) => result.rackIds.length },
  { label: 'Équipements', value: (result) => result.equipmentIds.length },
  { label: 'Stocks', value: (result) => result.consumableIds.length },
  { label: 'Reproductions', value: (result) => result.breedingEventIds.length },
  { label: 'Mues', value: (result) => result.sheddingCycleIds.length },
  { label: 'Rappels', value: (result) => result.reminderIds.length },
  { label: 'Activités', value: (result) => result.activityLogIds.length },
  { label: 'Mesures', value: (result) => result.readingCount },
]

const COUNTS = [
  { key: 'reptiles', label: 'Reptiles', min: 1, max: 8 },
  { key: 'terrariums', label: 'Terrariums', min: 1, max: 3 },
  { key: 'racks', label: 'Racks', min: 0, max: 3 },
  { key: 'equipment', label: 'Équipements', min: 0, max: 6 },
  { key: 'consumables', label: 'Stocks', min: 0, max: 6 },
  { key: 'sheddingCycles', label: 'Cycles de mue', min: 0, max: 4 },
  { key: 'breedingEvents', label: 'Reproductions', min: 0, max: 2 },
  { key: 'withHistoryHours', label: 'Historique (heures)', min: 0, max: 72 },
] as const

type CountKey = (typeof COUNTS)[number]['key']

const prefixes: Record<DraftKind, string> = {
  reptiles: 'reptile',
  terrariums: 'terrarium',
  racks: 'rack',
  equipment: 'equipement',
  consumables: 'stock',
  breedingEvents: 'repro',
  sheddingCycles: 'mue',
  reminders: 'rappel',
  activities: 'activite',
  devices: 'boitier',
}

export function SeedHubPage() {
  const { acting } = useSession()
  const { draft, result, setResult, loadExample, clearDraft } = useSeedDraft()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [counts, setCounts] = useState<Record<CountKey, number>>({
    reptiles: 2,
    terrariums: 1,
    racks: 1,
    equipment: 2,
    consumables: 2,
    sheddingCycles: 1,
    breedingEvents: 1,
    withHistoryHours: 0,
  })
  const [withDevice, setWithDevice] = useState(true)
  const total = useMemo(() => Object.values(draft).reduce((sum, rows) => sum + rows.length, 0), [draft])

  async function generateDraft() {
    if (!acting) return
    setPending(true)
    setError(null)
    try {
      const created = await api<{ data: ScenarioResult }>('/dev/scenarios/breeder', {
        method: 'POST',
        token: acting.token,
        body: { entities: toEntities(draft) },
      })
      setResult(created.data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Génération impossible')
    } finally {
      setPending(false)
    }
  }

  async function generateVolumes(event: FormEvent) {
    event.preventDefault()
    if (!acting) return
    setPending(true)
    setError(null)
    try {
      const created = await api<{ data: ScenarioResult }>('/dev/scenarios/breeder', {
        method: 'POST',
        token: acting.token,
        body: { ...counts, withDevice },
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
    <Page>
      <PageHeader
        title="Jeu de données"
        description="Compose chaque fiche, puis génère le jeu sur le compte actif. Le raccourci par volumes reste disponible."
        actions={
          <>
            <Button type="button" variant="outline" onClick={loadExample}>
              Préremplir un exemple
            </Button>
            <Button type="button" variant="outline" onClick={clearDraft} disabled={total === 0}>
              Vider le brouillon
            </Button>
          </>
        }
      />
      <ErrorAlert message={error} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {entities.map((entity) => (
          <Link
            key={entity.kind}
            to={`/jeu/${entity.path}`}
            className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
          >
            <p className="text-sm text-muted-foreground">{entity.title}</p>
            <p className="text-2xl font-semibold tabular-nums">{draft[entity.kind].length}</p>
          </Link>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Générer ce brouillon</CardTitle>
          <CardDescription>
            {total === 0
              ? 'Aucune fiche pour le moment. Ouvre une entité ou préremplis un exemple.'
              : `${total} fiche${total > 1 ? 's' : ''} prête${total > 1 ? 's' : ''} à être créée${total > 1 ? 's' : ''}.`}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button type="button" disabled={pending || total === 0} onClick={() => void generateDraft()}>
            {pending ? 'En cours…' : 'Générer le brouillon'}
          </Button>
        </CardFooter>
      </Card>
      <form onSubmit={(event) => void generateVolumes(event)}>
        <Card>
          <CardHeader>
            <CardTitle>Raccourci par volumes</CardTitle>
            <CardDescription>L’API invente les fiches. Un volume à 0 ignore la ressource.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COUNTS.map((field) => (
              <div className="grid gap-2" key={field.key}>
                <Label htmlFor={`seed-${field.key}`}>{field.label}</Label>
                <Input
                  id={`seed-${field.key}`}
                  type="number"
                  min={field.min}
                  max={field.max}
                  value={counts[field.key]}
                  onChange={(event) =>
                    setCounts((current) => ({ ...current, [field.key]: Number(event.target.value) }))
                  }
                />
              </div>
            ))}
            <div className="flex items-end gap-2 pb-2">
              <Checkbox id="seed-device" checked={withDevice} onCheckedChange={(value) => setWithDevice(value === true)} />
              <Label htmlFor="seed-device">Boîtier apparié</Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" variant="secondary" disabled={pending}>
              {pending ? 'En cours…' : 'Générer par volumes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
      {result ? <RunCard result={result} pending={pending} onDelete={() => void remove()} /> : null}
    </Page>
  )
}

function RunCard({ result, pending, onDelete }: { result: ScenarioResult; pending: boolean; onDelete: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jeu créé</CardTitle>
        <CardDescription>
          <code className="text-xs">{result.labRunId}</code>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-5">
          {RESULT_COUNTS.map((item) => (
            <div key={item.label}>
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="text-lg font-semibold tabular-nums">{item.value(result)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
      <CardFooter>
        <Button type="button" variant="destructive" disabled={pending} onClick={onDelete}>
          Supprimer ce jeu
        </Button>
      </CardFooter>
    </Card>
  )
}

export function EntityPage() {
  const { entity: path = '' } = useParams()
  const entity = entityByPath(path)
  const { draft, saveRecord, removeRecord } = useSeedDraft()
  const [editing, setEditing] = useState<DraftRecord | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  if (!entity) return <Navigate to="/jeu" replace />

  const rows = draft[entity.kind]

  function openNew() {
    setFormError(null)
    setEditing({ ref: nextRef(rows, prefixes[entity!.kind]), fields: { ...entity!.defaults } })
  }

  function openExisting(record: DraftRecord) {
    setFormError(null)
    setEditing({ ref: record.ref, fields: { ...entity!.defaults, ...record.fields } })
  }

  function updateField(key: string, value: string) {
    setEditing((current) => {
      if (!current) return current
      const fields = { ...current.fields, [key]: value }
      if (key === 'remindableType') fields.remindableRef = ''
      return { ...current, fields }
    })
  }

  function save() {
    if (!editing || !entity) return
    const message = checkRecord(entity.kind, editing)
    if (message) {
      setFormError(message)
      return
    }
    saveRecord(entity.kind, editing)
    setFormError(null)
  }

  const groups = groupFields(entity.fields)

  return (
    <Page>
      <PageHeader title={entity.title} description={entity.description} actions={<Button onClick={openNew}>Ajouter</Button>} />
      <ErrorAlert message={formError} />
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fiches</CardTitle>
            <CardDescription>{rows.length === 0 ? 'Aucune fiche.' : `${rows.length} dans le brouillon.`}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {rows.map((record) => (
              <div key={record.ref} className="flex items-center justify-between gap-2">
                <button type="button" className="min-w-0 truncate text-left text-sm font-medium hover:underline" onClick={() => openExisting(record)}>
                  {recordLabel(record)}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    removeRecord(entity.kind, record.ref)
                    if (editing?.ref === record.ref) setEditing(null)
                  }}
                >
                  Retirer
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        {editing ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{recordLabel(editing)}</CardTitle>
              <CardDescription>Référence {editing.ref}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {groups.map((group) => (
                <fieldset key={group.name} className="grid gap-4 sm:grid-cols-2">
                  {group.name !== 'Général' ? <legend className="text-sm font-medium sm:col-span-2">{group.name}</legend> : null}
                  {group.fields.map((field) => (
                    <FieldInput
                      key={field.key}
                      field={field}
                      value={editing.fields[field.key] ?? ''}
                      fields={editing.fields}
                      onChange={(value) => updateField(field.key, value)}
                    />
                  ))}
                </fieldset>
              ))}
            </CardContent>
            <CardFooter>
              <Button type="button" onClick={save}>
                Enregistrer dans le brouillon
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aucune fiche ouverte</CardTitle>
              <CardDescription>Ajoute une fiche ou reprends-en une dans la liste.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </Page>
  )
}

function groupFields(fields: FieldDef[]) {
  const groups: { name: string; fields: FieldDef[] }[] = []
  for (const field of fields) {
    const name = field.group ?? 'Général'
    const current = groups.at(-1)
    if (current?.name === name) current.fields.push(field)
    else groups.push({ name, fields: [field] })
  }
  return groups
}

function FieldInput({
  field,
  value,
  fields,
  onChange,
}: {
  field: FieldDef
  value: string
  fields: Record<string, string>
  onChange: (value: string) => void
}) {
  const { draft } = useSeedDraft()
  const id = `field-${field.key}`
  if (field.kind === 'checkbox') {
    return (
      <div className="flex items-center gap-2 sm:col-span-1">
        <Checkbox id={id} checked={value === 'true'} onCheckedChange={(checked) => onChange(checked === true ? 'true' : 'false')} />
        <Label htmlFor={id}>{field.label}</Label>
      </div>
    )
  }
  if (field.kind === 'select') {
    return (
      <div className="grid gap-2">
        <Label htmlFor={id}>{field.label}</Label>
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }
  if (field.kind === 'ref') {
    const collection = field.remindable ? remindableKind[fields.remindableType ?? ''] : field.collection
    const options = collection ? draft[collection] : []
    return (
      <div className="grid gap-2">
        <Label htmlFor={id}>{field.label}</Label>
        <Select value={value || undefined} onValueChange={(next) => onChange(next === '__none__' ? '' : next)}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={options.length ? 'Choisir' : 'Aucune fiche disponible'} />
          </SelectTrigger>
          <SelectContent>
            {!field.required ? <SelectItem value="__none__">Aucun</SelectItem> : null}
            {options.map((record) => (
              <SelectItem key={record.ref} value={record.ref}>
                {recordLabel(record)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {field.hint ? <p className="text-xs text-muted-foreground">{field.hint}</p> : null}
      </div>
    )
  }
  if (field.kind === 'textarea') {
    return (
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor={id}>{field.label}</Label>
        <textarea
          id={id}
          value={value}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
    )
  }
  const inputType = field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : field.kind === 'datetime' ? 'datetime-local' : field.kind === 'time' ? 'time' : 'text'
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{field.label}</Label>
      <Input
        id={id}
        type={inputType}
        value={value}
        min={field.min}
        max={field.max}
        step={field.step}
        required={field.required}
        onChange={(event) => onChange(event.target.value)}
      />
      {field.hint ? <p className="text-xs text-muted-foreground">{field.hint}</p> : null}
    </div>
  )
}
