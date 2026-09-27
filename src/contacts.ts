import { api } from './api'

export const CONTACT_CHANNELS = [
  { value: 'rencontre', label: 'Rencontre' },
  { value: 'echange', label: 'Échange' },
  { value: 'salon', label: 'Salon' },
  { value: 'autre', label: 'Autre' },
] as const

export type ContactChannel = (typeof CONTACT_CHANNELS)[number]['value']

export const CONTACT_NETWORKS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'x', label: 'X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'autre', label: 'Autre' },
] as const

export type ContactNetwork = (typeof CONTACT_NETWORKS)[number]['value']

export type ContactSocialLink = {
  network: ContactNetwork
  url: string
}

export type LabContact = {
  id: number
  name: string
  organization: string | null
  email: string | null
  phone: string | null
  website: string | null
  socialLinks: ContactSocialLink[] | null
  channel: ContactChannel
  occasion: string
  metOn: string | null
  notes: string | null
  createdAt: string
}

export type ContactInput = {
  name: string
  organization: string | null
  email: string | null
  phone: string | null
  website: string | null
  socialLinks: ContactSocialLink[] | null
  channel: ContactChannel
  occasion: string
  metOn: string | null
  notes: string | null
}

export function channelLabel(channel: ContactChannel) {
  return CONTACT_CHANNELS.find((item) => item.value === channel)?.label ?? 'Autre'
}

export function networkLabel(network: ContactNetwork) {
  return CONTACT_NETWORKS.find((item) => item.value === network)?.label ?? 'Autre'
}

function normalize(contact: LabContact): LabContact {
  return {
    ...contact,
    metOn: contact.metOn ? contact.metOn.slice(0, 10) : null,
  }
}

export async function fetchContacts(token: string) {
  const payload = await api<{ data: LabContact[] }>('/contacts', { token })
  return payload.data.map(normalize)
}

export async function createContact(token: string, input: ContactInput) {
  const payload = await api<{ data: LabContact }>('/contacts', {
    method: 'POST',
    token,
    body: input,
  })
  return normalize(payload.data)
}

export async function updateContact(token: string, id: number, input: ContactInput) {
  const payload = await api<{ data: LabContact }>(`/contacts/${id}`, {
    method: 'PUT',
    token,
    body: input,
  })
  return normalize(payload.data)
}

export async function deleteContact(token: string, id: number) {
  await api(`/contacts/${id}`, { method: 'DELETE', token })
}
