import type { Draft, DraftKind, DraftRecord, FieldDef } from '@/seed/catalog'
import { entities, entityByKind, recordLabel, remindableKind } from '@/seed/catalog'

function text(fields: Record<string, string>, key: string) {
  const value = fields[key]?.trim() ?? ''
  return value.length ? value : undefined
}

function numberValue(fields: Record<string, string>, key: string, label: string) {
  const raw = fields[key]?.trim() ?? ''
  if (!raw.length) return undefined
  const value = Number(raw)
  if (Number.isNaN(value)) throw new Error(`${label} doit être un nombre.`)
  return value
}

function flag(fields: Record<string, string>, key: string) {
  return fields[key] === 'true'
}

function requireText(fields: Record<string, string>, key: string, label: string) {
  const value = text(fields, key)
  if (!value) throw new Error(`${label} est obligatoire.`)
  return value
}

function validateRecord(kindLabel: string, record: DraftRecord, fields: FieldDef[]) {
  const name = recordLabel(record)
  for (const field of fields) {
    const value = record.fields[field.key]?.trim() ?? ''
    if (field.required && !value.length && field.kind !== 'checkbox') {
      throw new Error(`${kindLabel} « ${name} » : ${field.label} est obligatoire.`)
    }
    if (field.minLength && value.length > 0 && value.length < field.minLength) {
      throw new Error(`${kindLabel} « ${name} » : ${field.label} doit faire au moins ${field.minLength} caractères.`)
    }
  }
}

function climate(fields: Record<string, string>, hot: string, cold: string, humidity: string) {
  const targetHotC = numberValue(fields, hot, 'Point chaud')
  const targetColdC = numberValue(fields, cold, 'Point froid')
  const targetHumidity = numberValue(fields, humidity, 'Humidité')
  if (targetHotC === undefined && targetColdC === undefined && targetHumidity === undefined) return undefined
  if (targetHotC === undefined || targetColdC === undefined || targetHumidity === undefined) {
    throw new Error('Les consignes de jour et de nuit se remplissent toutes les trois, ou aucune.')
  }
  return { targetHotC, targetColdC, targetHumidity }
}

function reptile(record: DraftRecord) {
  return {
    ref: record.ref,
    name: requireText(record.fields, 'name', 'Nom'),
    scientificName: text(record.fields, 'scientificName'),
    commonName: text(record.fields, 'commonName'),
    mutation: text(record.fields, 'mutation'),
    gender: text(record.fields, 'gender'),
    birthDate: text(record.fields, 'birthDate'),
    acquisitionDate: text(record.fields, 'acquisitionDate'),
    weight: numberValue(record.fields, 'weight', 'Poids'),
    length: numberValue(record.fields, 'length', 'Longueur'),
    notes: text(record.fields, 'notes'),
    issue: requireText(record.fields, 'issue', 'Origine'),
    status: text(record.fields, 'status'),
  }
}

function terrarium(record: DraftRecord) {
  const equipment = [
    flag(record.fields, 'heatInstalled') ? 'heat' : null,
    flag(record.fields, 'uvInstalled') ? 'uv' : null,
    flag(record.fields, 'mistInstalled') ? 'mist' : null,
  ].filter((item): item is string => item !== null)
  const length = numberValue(record.fields, 'length', 'Longueur')
  const width = numberValue(record.fields, 'width', 'Largeur')
  const height = numberValue(record.fields, 'height', 'Hauteur')
  return {
    ref: record.ref,
    name: requireText(record.fields, 'name', 'Nom'),
    type: text(record.fields, 'type'),
    reptileRef: text(record.fields, 'reptileRef'),
    notes: text(record.fields, 'notes'),
    dimensions: length || width || height ? { length, width, height } : undefined,
    habitatSchedule: {
      lightsOn: requireText(record.fields, 'lightsOn', 'Lumières allumées'),
      lightsOff: requireText(record.fields, 'lightsOff', 'Lumières éteintes'),
      equipment,
      automationEnabled: flag(record.fields, 'automationEnabled'),
      heatEnabled: flag(record.fields, 'heatEnabled'),
      heatFollowCycle: flag(record.fields, 'heatFollowCycle'),
      uvEnabled: flag(record.fields, 'uvEnabled'),
      uvFollowCycle: flag(record.fields, 'uvFollowCycle'),
      mistEnabled: flag(record.fields, 'mistEnabled'),
      mistFollowCycle: flag(record.fields, 'mistFollowCycle'),
      mistTriggerHumidity: numberValue(record.fields, 'mistTriggerHumidity', 'Seuil de brume'),
      targetHotC: numberValue(record.fields, 'targetHotC', 'Point chaud') ?? 32,
      targetColdC: numberValue(record.fields, 'targetColdC', 'Point froid') ?? 26,
      targetHumidity: numberValue(record.fields, 'targetHumidity', 'Humidité') ?? 60,
      dayTargets: climate(record.fields, 'dayHot', 'dayCold', 'dayHumidity'),
      nightTargets: climate(record.fields, 'nightHot', 'nightCold', 'nightHumidity'),
    },
  }
}

function rack(record: DraftRecord) {
  return {
    ref: record.ref,
    name: requireText(record.fields, 'name', 'Nom'),
    capacity: numberValue(record.fields, 'capacity', 'Capacité'),
    notes: text(record.fields, 'notes'),
  }
}

function equipment(record: DraftRecord) {
  return {
    ref: record.ref,
    name: requireText(record.fields, 'name', 'Nom'),
    type: requireText(record.fields, 'type', 'Type'),
    terrariumRef: text(record.fields, 'terrariumRef'),
    installedAt: text(record.fields, 'installedAt'),
    lifespanDays: numberValue(record.fields, 'lifespanDays', 'Durée de vie'),
    nextReplacementAt: text(record.fields, 'nextReplacementAt'),
    brand: text(record.fields, 'brand'),
    model: text(record.fields, 'model'),
    notes: text(record.fields, 'notes'),
  }
}

function consumable(record: DraftRecord) {
  return {
    ref: record.ref,
    type: requireText(record.fields, 'type', 'Type'),
    name: requireText(record.fields, 'name', 'Nom'),
    quantity: numberValue(record.fields, 'quantity', 'Quantité') ?? 1,
    lowStockThreshold: numberValue(record.fields, 'lowStockThreshold', 'Seuil bas'),
    expirationDate: text(record.fields, 'expirationDate'),
    notes: text(record.fields, 'notes'),
  }
}

function breeding(record: DraftRecord) {
  const maleRef = requireText(record.fields, 'maleRef', 'Mâle')
  const femaleRef = requireText(record.fields, 'femaleRef', 'Femelle')
  if (maleRef === femaleRef) throw new Error('Une reproduction demande un mâle et une femelle différents.')
  return {
    ref: record.ref,
    maleRef,
    femaleRef,
    status: text(record.fields, 'status'),
    introductionDate: text(record.fields, 'introductionDate'),
    matingDate: text(record.fields, 'matingDate'),
    separationDate: text(record.fields, 'separationDate'),
    eggsCount: numberValue(record.fields, 'eggsCount', 'Nombre d’œufs'),
    layingDate: text(record.fields, 'layingDate'),
    expectedHatchingDate: text(record.fields, 'expectedHatchingDate'),
    notes: text(record.fields, 'notes'),
  }
}

function shedding(record: DraftRecord) {
  return {
    ref: record.ref,
    reptileRef: requireText(record.fields, 'reptileRef', 'Reptile'),
    startDate: requireText(record.fields, 'startDate', 'Début'),
    completionDate: text(record.fields, 'completionDate'),
    status: text(record.fields, 'status'),
    completeShed: record.fields.completeShed === 'true' ? true : record.fields.completeShed === 'false' ? false : undefined,
    notes: text(record.fields, 'notes'),
  }
}

function reminder(record: DraftRecord) {
  const recurrenceType = requireText(record.fields, 'recurrenceType', 'Récurrence')
  return {
    ref: record.ref,
    remindableType: requireText(record.fields, 'remindableType', 'Rattaché à'),
    remindableRef: requireText(record.fields, 'remindableRef', 'Fiche'),
    type: requireText(record.fields, 'type', 'Type'),
    title: text(record.fields, 'title'),
    recurrenceType,
    intervalValue: recurrenceType === 'interval' ? numberValue(record.fields, 'intervalValue', 'Intervalle') : undefined,
    intervalUnit: recurrenceType === 'interval' ? text(record.fields, 'intervalUnit') : undefined,
    timezone: requireText(record.fields, 'timezone', 'Fuseau'),
    toleranceMinutes: numberValue(record.fields, 'toleranceMinutes', 'Tolérance'),
    startAt: requireText(record.fields, 'startAt', 'Prochaine échéance'),
  }
}

function activity(record: DraftRecord) {
  return {
    ref: record.ref,
    remindableType: requireText(record.fields, 'remindableType', 'Rattaché à'),
    remindableRef: requireText(record.fields, 'remindableRef', 'Fiche'),
    actionType: requireText(record.fields, 'actionType', 'Type d’action'),
    actionCategory: text(record.fields, 'actionCategory'),
    status: text(record.fields, 'status'),
    title: requireText(record.fields, 'title', 'Titre'),
    description: text(record.fields, 'description'),
    weight: numberValue(record.fields, 'weight', 'Poids'),
    actionDate: text(record.fields, 'actionDate'),
  }
}

function device(record: DraftRecord) {
  return {
    ref: record.ref,
    terrariumRef: requireText(record.fields, 'terrariumRef', 'Terrarium'),
    deviceId: requireText(record.fields, 'deviceId', 'Identifiant du boîtier'),
    historyHours: numberValue(record.fields, 'historyHours', 'Historique') ?? 0,
  }
}

function compact<T extends Record<string, unknown>>(row: T) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined)) as T
}

function knownRefs(draft: Draft, kind: DraftKind) {
  return new Set(draft[kind].map((record) => record.ref))
}

function assertLinked(label: string, ref: string | undefined, pool: Set<string>, target: string) {
  if (ref && !pool.has(ref)) throw new Error(`${label} renvoie vers un ${target} absent du jeu (${ref}).`)
}

function assertLinks(draft: Draft) {
  const reptiles = knownRefs(draft, 'reptiles')
  const terrariums = knownRefs(draft, 'terrariums')
  for (const record of draft.terrariums) assertLinked(recordLabel(record), text(record.fields, 'reptileRef'), reptiles, 'reptile')
  for (const record of draft.equipment) assertLinked(recordLabel(record), text(record.fields, 'terrariumRef'), terrariums, 'terrarium')
  for (const record of draft.breedingEvents) {
    assertLinked(recordLabel(record), text(record.fields, 'maleRef'), reptiles, 'reptile')
    assertLinked(recordLabel(record), text(record.fields, 'femaleRef'), reptiles, 'reptile')
  }
  for (const record of draft.sheddingCycles) {
    assertLinked(recordLabel(record), text(record.fields, 'reptileRef'), reptiles, 'reptile')
  }
  for (const record of draft.devices) {
    assertLinked(recordLabel(record), text(record.fields, 'terrariumRef'), terrariums, 'terrarium')
  }
  for (const record of [...draft.reminders, ...draft.activities]) {
    const kind = remindableKind[record.fields.remindableType ?? '']
    if (!kind) continue
    assertLinked(recordLabel(record), text(record.fields, 'remindableRef'), knownRefs(draft, kind), 'enregistrement')
  }
  const deviceIds = draft.devices.map((record) => record.fields.deviceId?.trim()).filter(Boolean)
  if (new Set(deviceIds).size !== deviceIds.length) throw new Error('Chaque boîtier doit avoir un identifiant unique.')
}

export function checkRecord(kind: DraftKind, record: DraftRecord) {
  const entity = entityByKind(kind)
  try {
    validateRecord(entity.title, record, entity.fields)
    return null
  } catch (error) {
    return error instanceof Error ? error.message : 'Fiche incomplète.'
  }
}

export function toEntities(draft: Draft) {
  for (const entity of entities) {
    for (const record of draft[entity.kind]) validateRecord(entity.title, record, entity.fields)
  }
  assertLinks(draft)
  const entitiesPayload = {
    reptiles: draft.reptiles.map((record) => compact(reptile(record))),
    terrariums: draft.terrariums.map((record) => compact(terrarium(record))),
    racks: draft.racks.map((record) => compact(rack(record))),
    equipment: draft.equipment.map((record) => compact(equipment(record))),
    consumables: draft.consumables.map((record) => compact(consumable(record))),
    breedingEvents: draft.breedingEvents.map((record) => compact(breeding(record))),
    sheddingCycles: draft.sheddingCycles.map((record) => compact(shedding(record))),
    reminders: draft.reminders.map((record) => compact(reminder(record))),
    activities: draft.activities.map((record) => compact(activity(record))),
    devices: draft.devices.map((record) => compact(device(record))),
  }
  const filled = Object.fromEntries(Object.entries(entitiesPayload).filter(([, rows]) => rows.length > 0))
  if (Object.keys(filled).length === 0) throw new Error('Ajoute au moins une fiche avant de générer.')
  return filled
}

export function nextRef(kind: Draft['reptiles'], prefix: string) {
  const used = new Set(kind.map((record) => record.ref))
  let index = kind.length + 1
  while (used.has(`${prefix}-${index}`)) index += 1
  return `${prefix}-${index}`
}
