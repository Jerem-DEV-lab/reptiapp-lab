const DEFAULT_BASE = 'http://localhost:3333/api/v1'

export function getApiBase() {
  return (localStorage.getItem('reptilab.apiBase') || DEFAULT_BASE).replace(/\/$/, '')
}

export function setApiBase(value: string) {
  localStorage.setItem('reptilab.apiBase', value.replace(/\/$/, ''))
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(
  path: string,
  options: { method?: string; token?: string | null; body?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  const response = await fetch(`${getApiBase()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const text = await response.text()
  const payload = text ? (JSON.parse(text) as { message?: string }) : null
  if (!response.ok) {
    throw new ApiError(response.status, payload?.message || `Erreur ${response.status}`)
  }
  return payload as T
}

export type LabUser = {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  roles?: { name: string }[]
}

export function displayName(user: Pick<LabUser, 'firstName' | 'lastName' | 'email'>) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.email
}

export type ReptileRow = { id: number; name: string; commonName?: string | null; status?: string }
export type TerrariumRow = {
  id: number
  name: string
  habitatSchedule?: {
    lightsOn?: string
    lightsOff?: string
    targetHotC?: number
    targetColdC?: number
    targetHumidity?: number
    dayTargets?: { targetHotC: number; targetColdC: number; targetHumidity: number }
    nightTargets?: { targetHotC: number; targetColdC: number; targetHumidity: number }
  } | null
}
export type DeviceRow = {
  id: number
  externalDeviceId: string
  terrariumId: number | null
  status: string
}
export type ReminderRow = { id: number; title: string | null; type: string; isActive?: boolean }
export type ActivityRow = { id: number; title: string; actionType: string; actionDate?: string }
export type ReadingRow = {
  id: number
  temperatureC: number
  humidityPercent: number
  recordedAt: string
  source: string
}

export type ScenarioResult = {
  labRunId: string
  reptileIds: number[]
  terrariumIds: number[]
  reminderId: number
  activityLogId: number
  iotDeviceId: number | null
  readingCount: number
}
