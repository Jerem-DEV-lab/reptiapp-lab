import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, displayName, getApiBase, type LabUser } from './api'

type ActingSession = {
  token: string
  tokenId: string
  user: LabUser
}

type SessionValue = {
  adminToken: string | null
  adminEmail: string | null
  acting: ActingSession | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  connectAs: (userId: number) => Promise<void>
  disconnect: () => Promise<void>
}

const SessionContext = createContext<SessionValue | null>(null)

const ADMIN_TOKEN = 'reptilab.adminToken'
const ADMIN_EMAIL = 'reptilab.adminEmail'
const ACTING = 'reptilab.acting'

function readActing(): ActingSession | null {
  const raw = sessionStorage.getItem(ACTING)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ActingSession
  } catch {
    return null
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [adminToken, setAdminToken] = useState<string | null>(sessionStorage.getItem(ADMIN_TOKEN))
  const [adminEmail, setAdminEmail] = useState<string | null>(sessionStorage.getItem(ADMIN_EMAIL))
  const [acting, setActing] = useState<ActingSession | null>(readActing)

  useEffect(() => {
    const revoke = () => {
      const token = sessionStorage.getItem(ADMIN_TOKEN)
      const current = readActing()
      if (!token || !current) return
      sessionStorage.removeItem(ACTING)
      void fetch(`${getApiBase()}/dev/impersonate`, {
        method: 'DELETE',
        keepalive: true,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ userId: current.user.id, tokenId: current.tokenId }),
      })
    }
    window.addEventListener('pagehide', revoke)
    return () => window.removeEventListener('pagehide', revoke)
  }, [])

  const value = useMemo<SessionValue>(
    () => ({
      adminToken,
      adminEmail,
      acting,
      async login(email, password) {
        const logged = await api<{ data: { accessToken: string } }>('/auth/login', {
          method: 'POST',
          body: { email, password },
        })
        const token = logged.data.accessToken
        const me = await api<{ data: { email: string; roles?: { name: string }[] } }>('/auth/me', {
          token,
        })
        const isAdmin = (me.data.roles ?? []).some((role) => role.name === 'admin')
        if (!isAdmin) {
          throw new Error('Ce compte n’a pas le rôle admin.')
        }
        sessionStorage.setItem(ADMIN_TOKEN, token)
        sessionStorage.setItem(ADMIN_EMAIL, me.data.email)
        setAdminToken(token)
        setAdminEmail(me.data.email)
      },
      logout() {
        sessionStorage.removeItem(ADMIN_TOKEN)
        sessionStorage.removeItem(ADMIN_EMAIL)
        sessionStorage.removeItem(ACTING)
        setAdminToken(null)
        setAdminEmail(null)
        setActing(null)
      },
      async connectAs(userId) {
        if (!adminToken) throw new Error('Session admin absente')
        if (acting) {
          await api('/dev/impersonate', {
            method: 'DELETE',
            token: adminToken,
            body: { userId: acting.user.id, tokenId: acting.tokenId },
          }).catch(() => undefined)
        }
        const opened = await api<{
          data: { token: string; tokenId: string; user: LabUser }
        }>('/dev/impersonate', {
          method: 'POST',
          token: adminToken,
          body: { userId },
        })
        const next = { token: opened.data.token, tokenId: opened.data.tokenId, user: opened.data.user }
        sessionStorage.setItem(ACTING, JSON.stringify(next))
        setActing(next)
      },
      async disconnect() {
        if (adminToken && acting) {
          await api('/dev/impersonate', {
            method: 'DELETE',
            token: adminToken,
            body: { userId: acting.user.id, tokenId: acting.tokenId },
          })
        }
        sessionStorage.removeItem(ACTING)
        setActing(null)
      },
    }),
    [adminToken, adminEmail, acting]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('Session hors provider')
  return value
}

export function actingLabel(user: LabUser) {
  return `${displayName(user)} · ${user.email}`
}
