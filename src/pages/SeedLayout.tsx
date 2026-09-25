import { NavLink, Outlet } from 'react-router-dom'
import { SeedDraftProvider } from '@/seed/draft'
import { entities } from '@/seed/catalog'
import { cn } from '@/lib/utils'

export function SeedLayout() {
  return (
    <SeedDraftProvider>
      <div className="flex flex-col gap-6">
        <nav aria-label="Entités du jeu" className="flex gap-1 overflow-x-auto pb-1">
          <SeedLink to="/jeu" end>
            Résumé
          </SeedLink>
          {entities.map((entity) => (
            <SeedLink key={entity.kind} to={`/jeu/${entity.path}`}>
              {entity.title}
            </SeedLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </SeedDraftProvider>
  )
}

function SeedLink({ to, end, children }: { to: string; end?: boolean; children: string }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
          isActive && 'bg-muted text-foreground',
        )
      }
    >
      {children}
    </NavLink>
  )
}
