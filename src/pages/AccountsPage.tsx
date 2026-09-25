import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchIcon } from 'lucide-react'
import { ErrorAlert, Page, PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api, displayName, type LabUser } from '../api'
import { useSession } from '../session'

export function AccountsPage() {
  const { adminToken, acting, connectAs } = useSession()
  const navigate = useNavigate()
  const [users, setUsers] = useState<LabUser[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!adminToken) return
    let cancelled = false
    setLoading(true)
    void api<{ data: LabUser[] }>('/users', { token: adminToken })
      .then((payload) => {
        if (!cancelled) setUsers(payload.data)
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
    <Page>
      <PageHeader
        title="Comptes"
        description="Choisis un éleveur. Les écrans suivants utilisent son jeton."
        actions={
          <p className="text-sm text-muted-foreground tabular-nums">
            {loading ? 'Chargement…' : error ? null : `${visible.length} compte${visible.length > 1 ? 's' : ''}`}
          </p>
        }
      />
      <div className="grid max-w-sm gap-2">
        <Label htmlFor="account-search">Recherche</Label>
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="account-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom ou e-mail"
            className="pl-8"
          />
        </div>
      </div>
      <ErrorAlert message={error} />
      <div className="rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <caption className="sr-only">Comptes éleveurs</caption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Éleveur</TableHead>
              <TableHead scope="col">E-mail</TableHead>
              <TableHead scope="col">Rôles</TableHead>
              <TableHead scope="col">Session</TableHead>
              <TableHead scope="col">
                <span className="sr-only">Action</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 6 }, (_, index) => (
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
                  {users.length === 0
                    ? 'Aucun compte à afficher.'
                    : 'Aucun compte ne correspond à cette recherche.'}
                </TableCell>
              </TableRow>
            ) : null}
            {!loading
              ? visible.map((user) => {
                  const active = acting?.user.id === user.id
                  return (
                    <TableRow key={user.id} data-state={active ? 'selected' : undefined}>
                      <TableCell className="font-medium">{displayName(user)}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(user.roles ?? []).length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            user.roles?.map((role) => (
                              <Badge key={role.name} variant="secondary">
                                {role.name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {active ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant={active ? 'outline' : 'default'}
                          disabled={pendingId === user.id}
                          onClick={() => void choose(user.id)}
                        >
                          {pendingId === user.id
                            ? 'Connexion…'
                            : active
                              ? 'Session active'
                              : 'Se connecter en tant que'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              : null}
          </TableBody>
        </Table>
      </div>
    </Page>
  )
}
