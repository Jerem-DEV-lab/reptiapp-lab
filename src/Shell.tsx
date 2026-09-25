import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { actingLabel, useSession } from './session'

export function Shell() {
  const { adminToken, adminEmail, acting, logout, disconnect } = useSession()
  if (!adminToken) return <Navigate to="/login" replace />

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <strong>Repti'Lab</strong>
          <span>{adminEmail}</span>
        </div>
        <nav className="nav">
          <NavLink to="/comptes" className={({ isActive }) => (isActive ? 'active' : '')}>
            Comptes
          </NavLink>
          <NavLink
            to="/compte"
            className={({ isActive }) => (isActive ? 'active' : !acting ? 'disabled' : '')}
          >
            Vue du compte
          </NavLink>
          <NavLink
            to="/jeu"
            className={({ isActive }) => (isActive ? 'active' : !acting ? 'disabled' : '')}
          >
            Jeu de données
          </NavLink>
          <NavLink
            to="/capteurs"
            className={({ isActive }) => (isActive ? 'active' : !acting ? 'disabled' : '')}
          >
            Capteurs
          </NavLink>
          <button className="button-ghost" type="button" onClick={logout}>
            Déconnexion
          </button>
        </nav>
      </header>
      {acting ? (
        <div className="banner">
          <span>Connecté en tant que {actingLabel(acting.user)}</span>
          <button className="button-ghost" type="button" onClick={() => void disconnect()}>
            Quitter
          </button>
        </div>
      ) : null}
      <Outlet />
    </div>
  )
}

export function RequireActing() {
  const { acting } = useSession()
  if (!acting) return <Navigate to="/comptes" replace />
  return <Outlet />
}
