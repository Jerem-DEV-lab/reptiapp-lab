import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  ChevronsUpDownIcon,
  ContactRoundIcon,
  DatabaseIcon,
  FlaskConicalIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  ThermometerIcon,
  UsersIcon,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useSession } from '@/session'

const THEME_KEY = 'reptilab.theme'

const accountLinks = [
  { to: '/compte', label: 'Vue du compte', icon: LayoutDashboardIcon },
  { to: '/jeu', label: 'Jeu de données', icon: DatabaseIcon },
  { to: '/capteurs', label: 'Capteurs', icon: ThermometerIcon },
] as const

function initials(value: string) {
  const local = value.split('@')[0] ?? value
  return local.slice(0, 2).toUpperCase()
}

export function AppSidebar() {
  const { adminEmail, acting, logout } = useSession()
  const location = useLocation()
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  )
  const email = adminEmail ?? 'Admin'
  const locked = !acting

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    localStorage.setItem(THEME_KEY, next)
    setTheme(next)
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Repti'Lab">
              <NavLink to="/comptes">
                <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <FlaskConicalIcon />
                </span>
                <span className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Repti'Lab</span>
                  <span className="truncate text-xs text-muted-foreground">Console admin</span>
                </span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/comptes'}
                  tooltip="Comptes"
                >
                  <NavLink to="/comptes">
                    <UsersIcon />
                    <span>Comptes</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/contacts'}
                  tooltip="Contacts"
                >
                  <NavLink to="/contacts">
                    <ContactRoundIcon />
                    <span>Contacts</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Compte actif</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountLinks.map((link) => (
                <SidebarMenuItem key={link.to}>
                  {locked ? (
                    <SidebarMenuButton disabled title="Choisissez un compte" tooltip="Choisissez un compte">
                      <link.icon />
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      isActive={link.to === '/jeu' ? location.pathname.startsWith('/jeu') : location.pathname === link.to}
                      tooltip={link.label}
                    >
                      <NavLink to={link.to}>
                        <link.icon />
                        <span>{link.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip={email}
                >
                  <Avatar size="sm">
                    <AvatarFallback>{initials(email)}</AvatarFallback>
                  </Avatar>
                  <span className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Admin</span>
                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                  </span>
                  <ChevronsUpDownIcon className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="min-w-56">
                <DropdownMenuLabel className="font-normal">
                  <span className="block text-sm font-medium text-foreground">Session admin</span>
                  <span className="block truncate text-xs text-muted-foreground">{email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={toggleTheme}>
                  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                  {theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={logout}>
                  <LogOutIcon />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail aria-label="Réduire ou agrandir le menu" title="Réduire ou agrandir le menu" />
    </Sidebar>
  )
}
