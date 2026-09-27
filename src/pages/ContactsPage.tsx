import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { PlusIcon, SearchIcon, XIcon } from 'lucide-react'
import { ErrorAlert, Page, PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  CONTACT_CHANNELS,
  CONTACT_NETWORKS,
  channelLabel,
  createContact,
  deleteContact,
  fetchContacts,
  networkLabel,
  updateContact,
  type ContactChannel,
  type ContactInput,
  type ContactNetwork,
  type LabContact,
} from '@/contacts'
import { useSession } from '@/session'

type SocialDraft = {
  key: string
  network: ContactNetwork
  url: string
}

type ContactDraft = {
  name: string
  organization: string
  email: string
  phone: string
  website: string
  socialLinks: SocialDraft[]
  channel: ContactChannel
  occasion: string
  metOn: string
  notes: string
}

function todayIso() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function emptyDraft(): ContactDraft {
  return {
    name: '',
    organization: '',
    email: '',
    phone: '',
    website: '',
    socialLinks: [],
    channel: 'rencontre',
    occasion: '',
    metOn: todayIso(),
    notes: '',
  }
}

function draftFrom(contact: LabContact): ContactDraft {
  return {
    name: contact.name,
    organization: contact.organization ?? '',
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    website: contact.website ?? '',
    socialLinks: (contact.socialLinks ?? []).map((link) => ({
      key: crypto.randomUUID(),
      network: link.network,
      url: link.url,
    })),
    channel: contact.channel,
    occasion: contact.occasion,
    metOn: contact.metOn ?? '',
    notes: contact.notes ?? '',
  }
}

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.')
  } catch {
    return false
  }
}

function toInput(draft: ContactDraft): ContactInput {
  const blank = (value: string) => {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return {
    name: draft.name.trim(),
    organization: blank(draft.organization),
    email: blank(draft.email),
    phone: blank(draft.phone),
    website: blank(normalizeUrl(draft.website)),
    socialLinks: draft.socialLinks.flatMap((link) => {
      const url = normalizeUrl(link.url)
      if (!url) return []
      return [{ network: link.network, url }]
    }),
    channel: draft.channel,
    occasion: draft.occasion.trim(),
    metOn: blank(draft.metOn),
    notes: blank(draft.notes),
  }
}

function formatDate(value: string | null) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return '—'
  return `${day}/${month}/${year}`
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

export function ContactsPage() {
  const { adminToken } = useSession()
  const [contacts, setContacts] = useState<LabContact[]>([])
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<ContactDraft>(emptyDraft)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!adminToken) return
    let cancelled = false
    setLoading(true)
    void fetchContacts(adminToken)
      .then((rows) => {
        if (!cancelled) setContacts(rows)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Liste indisponible')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [adminToken])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = needle
      ? contacts.filter((contact) => {
          const blob = [
            contact.name,
            contact.organization,
            contact.email,
            contact.phone,
            contact.website,
            ...(contact.socialLinks ?? []).flatMap((link) => [networkLabel(link.network), link.url]),
            contact.occasion,
            contact.notes,
            channelLabel(contact.channel),
          ]
            .join(' ')
            .toLowerCase()
          return blob.includes(needle)
        })
      : contacts
    return [...filtered].sort((left, right) => {
      const byDate = (right.metOn ?? '').localeCompare(left.metOn ?? '')
      if (byDate !== 0) return byDate
      return right.createdAt.localeCompare(left.createdAt)
    })
  }, [contacts, query])

  function openCreate() {
    setEditingId(null)
    setDraft(emptyDraft())
    setError(null)
    setFormOpen(true)
  }

  function openEdit(contact: LabContact) {
    setEditingId(contact.id)
    setDraft(draftFrom(contact))
    setError(null)
    setPendingDelete(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setDraft(emptyDraft())
    setError(null)
  }

  function update<K extends keyof ContactDraft>(key: K, value: ContactDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function addSocialLink() {
    setDraft((current) => {
      if (current.socialLinks.length >= 8) return current
      return {
        ...current,
        socialLinks: [...current.socialLinks, { key: crypto.randomUUID(), network: 'instagram', url: '' }],
      }
    })
  }

  function updateSocialLink(key: string, patch: Partial<Pick<SocialDraft, 'network' | 'url'>>) {
    setDraft((current) => ({
      ...current,
      socialLinks: current.socialLinks.map((link) => (link.key === key ? { ...link, ...patch } : link)),
    }))
  }

  function removeSocialLink(key: string) {
    setDraft((current) => ({
      ...current,
      socialLinks: current.socialLinks.filter((link) => link.key !== key),
    }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!adminToken) return
    const name = draft.name.trim()
    const occasion = draft.occasion.trim()
    const email = draft.email.trim()
    if (!name) {
      setError('Indique le nom du contact.')
      return
    }
    if (!occasion) {
      setError('Indique la rencontre ou l’échange où tu as obtenu ce contact.')
      return
    }
    if (email && !email.includes('@')) {
      setError('L’e-mail n’est pas valide.')
      return
    }
    const website = normalizeUrl(draft.website)
    if (website && !isHttpUrl(website)) {
      setError('Le site web n’est pas une adresse valide.')
      return
    }
    if (draft.socialLinks.some((link) => normalizeUrl(link.url) && !isHttpUrl(normalizeUrl(link.url)))) {
      setError('Un lien de réseau n’est pas une adresse valide.')
      return
    }

    const payload = toInput(draft)
    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        const saved = await updateContact(adminToken, editingId, payload)
        setContacts((current) => current.map((contact) => (contact.id === saved.id ? saved : contact)))
      } else {
        const saved = await createContact(adminToken, payload)
        setContacts((current) => [saved, ...current])
      }
      closeForm()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number) {
    if (!adminToken) return
    setSaving(true)
    setError(null)
    try {
      await deleteContact(adminToken, id)
      setContacts((current) => current.filter((contact) => contact.id !== id))
      if (editingId === id) closeForm()
      setPendingDelete(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Suppression impossible')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page>
      <PageHeader
        title="Contacts"
        description="Contacts récupérés lors de rencontres, salons ou échanges. Ils sont enregistrés sur ton compte admin, dans la base Repti'App."
        actions={
          <>
            <p className="text-sm text-muted-foreground tabular-nums">
              {loading ? 'Chargement…' : `${visible.length} contact${visible.length > 1 ? 's' : ''}`}
            </p>
            <Button type="button" onClick={formOpen && !editingId ? closeForm : openCreate}>
              <PlusIcon data-icon="inline-start" />
              Ajouter un contact
            </Button>
          </>
        }
      />

      {formOpen ? (
        <form onSubmit={onSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Modifier le contact' : 'Nouveau contact'}</CardTitle>
              <CardDescription>Nom, coordonnées et contexte de la rencontre ou de l’échange.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field id="contact-name" label="Nom">
                <Input
                  id="contact-name"
                  value={draft.name}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder="Prénom et nom"
                  autoComplete="name"
                  required
                />
              </Field>
              <Field id="contact-organization" label="Structure">
                <Input
                  id="contact-organization"
                  value={draft.organization}
                  onChange={(event) => update('organization', event.target.value)}
                  placeholder="Élevage, boutique, association…"
                  autoComplete="organization"
                />
              </Field>
              <Field id="contact-email" label="E-mail">
                <Input
                  id="contact-email"
                  type="email"
                  value={draft.email}
                  onChange={(event) => update('email', event.target.value)}
                  placeholder="nom@exemple.fr"
                  autoComplete="email"
                />
              </Field>
              <Field id="contact-phone" label="Téléphone">
                <Input
                  id="contact-phone"
                  type="tel"
                  value={draft.phone}
                  onChange={(event) => update('phone', event.target.value)}
                  placeholder="06 00 00 00 00"
                  autoComplete="tel"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field id="contact-website" label="Site web">
                  <Input
                    id="contact-website"
                    type="text"
                    inputMode="url"
                    value={draft.website}
                    onChange={(event) => update('website', event.target.value)}
                    placeholder="https://elevage.exemple.fr"
                    autoComplete="url"
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Réseaux</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSocialLink}
                    disabled={draft.socialLinks.length >= 8}
                  >
                    <PlusIcon data-icon="inline-start" />
                    Ajouter un lien
                  </Button>
                </div>
                {draft.socialLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun lien pour le moment. Tu peux en ajouter plusieurs.
                  </p>
                ) : (
                  draft.socialLinks.map((link) => (
                    <div key={link.key} className="grid gap-2 sm:grid-cols-[11rem_1fr_auto]">
                      <Select
                        value={link.network}
                        onValueChange={(value) => updateSocialLink(link.key, { network: value as ContactNetwork })}
                      >
                        <SelectTrigger id={`contact-network-${link.key}`} aria-label="Réseau" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTACT_NETWORKS.map((network) => (
                            <SelectItem key={network.value} value={network.value}>
                              {network.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id={`contact-social-url-${link.key}`}
                        type="text"
                        inputMode="url"
                        value={link.url}
                        onChange={(event) => updateSocialLink(link.key, { url: event.target.value })}
                        placeholder="https://instagram.com/…"
                        aria-label="Adresse du réseau"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Retirer ce lien"
                        onClick={() => removeSocialLink(link.key)}
                      >
                        <XIcon />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <Field id="contact-channel" label="Type">
                <Select value={draft.channel} onValueChange={(value) => update('channel', value as ContactChannel)}>
                  <SelectTrigger id="contact-channel" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_CHANNELS.map((channel) => (
                      <SelectItem key={channel.value} value={channel.value}>
                        {channel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="contact-date" label="Date">
                <Input
                  id="contact-date"
                  type="date"
                  value={draft.metOn}
                  onChange={(event) => update('metOn', event.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field id="contact-occasion" label="Rencontre ou échange">
                  <Input
                    id="contact-occasion"
                    value={draft.occasion}
                    onChange={(event) => update('occasion', event.target.value)}
                    placeholder="Salon de Hamm, bourse de Lyon, échange Instagram…"
                    required
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field id="contact-notes" label="Notes">
                  <Textarea
                    id="contact-notes"
                    value={draft.notes}
                    onChange={(event) => update('notes', event.target.value)}
                    placeholder="Espèces, suite à donner, lien vers une fiche…"
                  />
                </Field>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {editingId ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </CardFooter>
          </Card>
          <div className="mt-4">
            <ErrorAlert message={error} />
          </div>
        </form>
      ) : (
        <ErrorAlert message={error} />
      )}

      <div className="grid max-w-sm gap-2">
        <Label htmlFor="contact-search">Recherche</Label>
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="contact-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom, structure, site, occasion…"
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <caption className="sr-only">Contacts obtenus lors de rencontres ou d’échanges</caption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Contact</TableHead>
              <TableHead scope="col">Coordonnées</TableHead>
              <TableHead scope="col">Origine</TableHead>
              <TableHead scope="col">Date</TableHead>
              <TableHead scope="col">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 4 }, (_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : null}
            {!loading && !error && visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {contacts.length === 0
                    ? 'Aucun contact pour le moment.'
                    : 'Aucun contact ne correspond à cette recherche.'}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <p className="font-medium">{contact.name}</p>
                    {contact.organization ? (
                      <p className="text-muted-foreground">{contact.organization}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {contact.email || contact.phone || contact.website || contact.socialLinks?.length ? (
                      <div className="grid gap-0.5">
                        {contact.email ? <span>{contact.email}</span> : null}
                        {contact.phone ? (
                          <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="underline underline-offset-2">
                            {contact.phone}
                          </a>
                        ) : null}
                        {contact.website ? (
                          <a
                            href={contact.website}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2"
                          >
                            {contact.website.replace(/^https?:\/\//, '')}
                          </a>
                        ) : null}
                        {contact.socialLinks?.map((link) => (
                          <a
                            key={`${link.network}-${link.url}`}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2"
                          >
                            {networkLabel(link.network)}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="grid justify-items-start gap-1">
                      <Badge variant="secondary">{channelLabel(contact.channel)}</Badge>
                      <span>{contact.occasion}</span>
                      {contact.notes ? (
                        <span className="max-w-xs text-muted-foreground">{contact.notes}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatDate(contact.metOn)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {pendingDelete === contact.id ? (
                        <>
                          <Button type="button" size="sm" variant="destructive" onClick={() => remove(contact.id)}>
                            Confirmer
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setPendingDelete(null)}>
                            Annuler
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button type="button" size="sm" variant="outline" onClick={() => openEdit(contact)}>
                            Modifier
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setPendingDelete(contact.id)}
                          >
                            Supprimer
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Page>
  )
}
