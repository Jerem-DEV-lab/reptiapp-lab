import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { UserRoundIcon } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { entityByPath } from '@/seed/catalog'
import { actingLabel, useSession } from './session'

const pages: Record<string, string> = {
  '/comptes': 'Comptes',
  '/contacts': 'Contacts',
  '/compte': 'Vue du compte',
  '/jeu': 'Jeu de données',
  '/capteurs': 'Capteurs',
}

export function Shell() {
  const { adminToken, acting, disconnect } = useSession()
  const location = useLocation()
  if (!adminToken) return <Navigate to="/login" replace />

  const seedEntity = location.pathname.startsWith('/jeu/') ? entityByPath(location.pathname.slice('/jeu/'.length)) : undefined
  const current = seedEntity?.title ?? pages[location.pathname] ?? 'Console'
  const nested = location.pathname !== '/comptes' && location.pathname !== '/contacts'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger aria-label="Ouvrir ou fermer le menu" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {nested ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/comptes">Comptes</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  {seedEntity ? (
                    <>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link to="/jeu">Jeu de données</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{seedEntity.title}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbPage>{current}</BreadcrumbPage>
                    </BreadcrumbItem>
                  )}
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage>{current}</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        {acting ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted px-4 py-2 text-sm">
            <p className="flex min-w-0 items-center gap-2">
              <UserRoundIcon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">Session du compte {actingLabel(acting.user)}</span>
            </p>
            <Button variant="outline" size="sm" type="button" onClick={() => void disconnect()}>
              Quitter le compte
            </Button>
          </div>
        ) : null}
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function RequireActing() {
  const { acting } = useSession()
  if (!acting) return <Navigate to="/comptes" replace />
  return <Outlet />
}
