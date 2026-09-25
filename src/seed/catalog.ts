export type DraftKind =
  | 'reptiles'
  | 'terrariums'
  | 'racks'
  | 'equipment'
  | 'consumables'
  | 'breedingEvents'
  | 'sheddingCycles'
  | 'reminders'
  | 'activities'
  | 'devices'

export type DraftRecord = { ref: string; fields: Record<string, string> }

export type Draft = Record<DraftKind, DraftRecord[]>

export type FieldKind = 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'time' | 'select' | 'checkbox' | 'ref'

export type FieldDef = {
  key: string
  label: string
  kind: FieldKind
  required?: boolean
  minLength?: number
  min?: number
  max?: number
  step?: string
  options?: { value: string; label: string }[]
  collection?: DraftKind
  remindable?: boolean
  group?: string
  hint?: string
}

export type EntityDef = {
  kind: DraftKind
  path: string
  title: string
  description: string
  fields: FieldDef[]
  defaults: Record<string, string>
}

const gender = [
  { value: 'female', label: 'Femelle' },
  { value: 'male', label: 'Mâle' },
  { value: 'unknown', label: 'Inconnu' },
]

const issue = [
  { value: 'purchase', label: 'Achat' },
  { value: 'birth', label: 'Naissance' },
  { value: 'capture', label: 'Capture' },
  { value: 'transfer', label: 'Transfert' },
  { value: 'sale', label: 'Vente' },
  { value: 'gift', label: 'Don' },
  { value: 'unknown', label: 'Inconnu' },
]

const reptileStatus = [
  { value: 'alive', label: 'Vivant' },
  { value: 'sick', label: 'Malade' },
  { value: 'hibernation', label: 'Hibernation' },
  { value: 'death', label: 'Décédé' },
  { value: 'sold', label: 'Vendu' },
  { value: 'transfer', label: 'Transféré' },
]

const equipmentType = [
  { value: 'heating_mat', label: 'Tapis chauffant' },
  { value: 'uv_bulb', label: 'Tube UV' },
  { value: 'led_light', label: 'Rampe LED' },
  { value: 'thermostat', label: 'Thermostat' },
  { value: 'hygrometer', label: 'Hygromètre' },
  { value: 'thermometer', label: 'Thermomètre' },
  { value: 'humidifier', label: 'Brumisateur' },
  { value: 'other', label: 'Autre' },
]

const consumableType = [
  { value: 'frozen_prey', label: 'Proies congelées' },
  { value: 'substrate', label: 'Substrat' },
  { value: 'uv_bulb', label: 'Ampoule UV' },
  { value: 'supplements', label: 'Compléments' },
  { value: 'medication', label: 'Médicament' },
  { value: 'feeders', label: 'Proies vivantes' },
  { value: 'other', label: 'Autre' },
]

const breedingStatus = [
  { value: 'planning', label: 'Planifiée' },
  { value: 'introduced', label: 'Introduite' },
  { value: 'mated', label: 'Accouplée' },
  { value: 'separated', label: 'Séparée' },
  { value: 'gravid', label: 'Gravide' },
  { value: 'laid', label: 'Ponte' },
  { value: 'hatching', label: 'Éclosion' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' },
]

const sheddingStatus = [
  { value: 'pre_shed', label: 'Avant mue' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminée' },
  { value: 'incomplete', label: 'Incomplète' },
]

export const remindableTypes = [
  { value: 'Reptile', label: 'Reptile' },
  { value: 'Terrarium', label: 'Terrarium' },
  { value: 'Rack', label: 'Rack' },
  { value: 'Equipment', label: 'Équipement' },
  { value: 'ConsumableInventory', label: 'Stock' },
  { value: 'BreedingEvent', label: 'Reproduction' },
  { value: 'SheddingCycle', label: 'Mue' },
]

export const remindableKind: Record<string, DraftKind> = {
  Reptile: 'reptiles',
  Terrarium: 'terrariums',
  Rack: 'racks',
  Equipment: 'equipment',
  ConsumableInventory: 'consumables',
  BreedingEvent: 'breedingEvents',
  SheddingCycle: 'sheddingCycles',
}

const reminderType = [
  { value: 'feeding', label: 'Repas' },
  { value: 'hydration', label: 'Hydratation' },
  { value: 'handling', label: 'Manipulation' },
  { value: 'cleaning', label: 'Nettoyage' },
  { value: 'equipment_check', label: 'Contrôle équipement' },
  { value: 'equipment_replacement', label: 'Remplacement équipement' },
  { value: 'stock_check', label: 'Stock' },
  { value: 'weighing', label: 'Pesée' },
  { value: 'vet_appointment', label: 'Vétérinaire' },
  { value: 'deworming', label: 'Vermifuge' },
  { value: 'shedding', label: 'Mue' },
  { value: 'observation', label: 'Observation' },
  { value: 'breeding_introduction', label: 'Introduction' },
  { value: 'breeding_separation', label: 'Séparation' },
  { value: 'breeding_laying', label: 'Ponte' },
  { value: 'breeding_incubation', label: 'Incubation' },
  { value: 'breeding_hatching', label: 'Éclosion' },
  { value: 'breeding_post_hatch', label: 'Après éclosion' },
  { value: 'custom', label: 'Personnalisé' },
]

const recurrence = [
  { value: 'none', label: 'Une fois' },
  { value: 'interval', label: 'Intervalle' },
  { value: 'custom_days', label: 'Jours précis' },
]

const intervalUnit = [
  { value: 'days', label: 'Jours' },
  { value: 'weeks', label: 'Semaines' },
  { value: 'months', label: 'Mois' },
  { value: 'years', label: 'Années' },
]

const activityStatus = [
  { value: 'completed', label: 'Faite' },
  { value: 'pending', label: 'En attente' },
  { value: 'skipped', label: 'Ignorée' },
  { value: 'snoozed', label: 'Reportée' },
]

export const entities: EntityDef[] = [
  {
    kind: 'reptiles',
    path: 'reptiles',
    title: 'Reptiles',
    description: 'Identité, mensurations et statut. Le nom fait au moins 3 caractères.',
    defaults: { gender: 'female', issue: 'purchase', status: 'alive' },
    fields: [
      { key: 'name', label: 'Nom', kind: 'text', required: true, minLength: 3, group: 'Identité' },
      { key: 'scientificName', label: 'Nom scientifique', kind: 'text', minLength: 3, group: 'Identité' },
      { key: 'commonName', label: 'Nom commun', kind: 'text', minLength: 3, group: 'Identité' },
      { key: 'mutation', label: 'Mutation', kind: 'text', minLength: 3, group: 'Identité' },
      { key: 'gender', label: 'Sexe', kind: 'select', options: gender, group: 'Identité' },
      { key: 'issue', label: 'Origine', kind: 'select', required: true, options: issue, group: 'Identité' },
      { key: 'status', label: 'Statut', kind: 'select', options: reptileStatus, group: 'Identité' },
      { key: 'birthDate', label: 'Date de naissance', kind: 'date', group: 'Suivi' },
      { key: 'acquisitionDate', label: 'Date d’acquisition', kind: 'date', group: 'Suivi' },
      { key: 'weight', label: 'Poids (g)', kind: 'number', min: 0, max: 500000, step: '0.1', group: 'Suivi' },
      { key: 'length', label: 'Longueur (cm)', kind: 'number', min: 0, max: 1000, step: '0.1', group: 'Suivi' },
      { key: 'notes', label: 'Notes', kind: 'textarea', minLength: 3, group: 'Suivi' },
    ],
  },
  {
    kind: 'terrariums',
    path: 'terrariums',
    title: 'Terrariums',
    description: 'Habitat, dimensions et consignes de climat.',
    defaults: {
      lightsOn: '08:00',
      lightsOff: '20:00',
      targetHotC: '32',
      targetColdC: '26',
      targetHumidity: '60',
      heatEnabled: 'false',
      uvEnabled: 'false',
      mistEnabled: 'false',
      automationEnabled: 'true',
    },
    fields: [
      { key: 'name', label: 'Nom', kind: 'text', required: true, group: 'Habitat' },
      { key: 'type', label: 'Type', kind: 'text', group: 'Habitat', hint: 'Ex. tub, terrarium, rack.' },
      { key: 'reptileRef', label: 'Reptile', kind: 'ref', collection: 'reptiles', group: 'Habitat' },
      { key: 'notes', label: 'Notes', kind: 'textarea', group: 'Habitat' },
      { key: 'length', label: 'Longueur (cm)', kind: 'number', min: 0, max: 1000, group: 'Dimensions' },
      { key: 'width', label: 'Largeur (cm)', kind: 'number', min: 0, max: 1000, group: 'Dimensions' },
      { key: 'height', label: 'Hauteur (cm)', kind: 'number', min: 0, max: 1000, group: 'Dimensions' },
      { key: 'lightsOn', label: 'Lumières allumées', kind: 'time', required: true, group: 'Cycle' },
      { key: 'lightsOff', label: 'Lumières éteintes', kind: 'time', required: true, group: 'Cycle' },
      { key: 'automationEnabled', label: 'Cycle automatique', kind: 'checkbox', group: 'Cycle' },
      { key: 'heatEnabled', label: 'Chauffage armé', kind: 'checkbox', group: 'Équipement installé' },
      { key: 'uvEnabled', label: 'UV armé', kind: 'checkbox', group: 'Équipement installé' },
      { key: 'mistEnabled', label: 'Brume armée', kind: 'checkbox', group: 'Équipement installé' },
      { key: 'heatInstalled', label: 'Chauffage installé', kind: 'checkbox', group: 'Équipement installé' },
      { key: 'uvInstalled', label: 'UV installé', kind: 'checkbox', group: 'Équipement installé' },
      { key: 'mistInstalled', label: 'Brume installée', kind: 'checkbox', group: 'Équipement installé' },
      { key: 'heatFollowCycle', label: 'Chauffage suit le cycle', kind: 'checkbox', group: 'Équipement installé' },
      { key: 'uvFollowCycle', label: 'UV suit le cycle', kind: 'checkbox', group: 'Équipement installé' },
      { key: 'mistFollowCycle', label: 'Brume suit le cycle', kind: 'checkbox', group: 'Équipement installé' },
      { key: 'mistTriggerHumidity', label: 'Seuil de brume (%)', kind: 'number', min: 20, max: 100, group: 'Consignes' },
      { key: 'targetHotC', label: 'Point chaud (°C)', kind: 'number', required: true, min: 8, max: 70, step: '0.1', group: 'Consignes' },
      { key: 'targetColdC', label: 'Point froid (°C)', kind: 'number', required: true, min: 8, max: 70, step: '0.1', group: 'Consignes' },
      { key: 'targetHumidity', label: 'Humidité (%)', kind: 'number', required: true, min: 20, max: 100, step: '0.1', group: 'Consignes' },
      { key: 'dayHot', label: 'Jour · point chaud', kind: 'number', min: 8, max: 70, step: '0.1', group: 'Consignes de jour' },
      { key: 'dayCold', label: 'Jour · point froid', kind: 'number', min: 8, max: 70, step: '0.1', group: 'Consignes de jour' },
      { key: 'dayHumidity', label: 'Jour · humidité', kind: 'number', min: 20, max: 100, step: '0.1', group: 'Consignes de jour' },
      { key: 'nightHot', label: 'Nuit · point chaud', kind: 'number', min: 8, max: 70, step: '0.1', group: 'Consignes de nuit' },
      { key: 'nightCold', label: 'Nuit · point froid', kind: 'number', min: 8, max: 70, step: '0.1', group: 'Consignes de nuit' },
      { key: 'nightHumidity', label: 'Nuit · humidité', kind: 'number', min: 20, max: 100, step: '0.1', group: 'Consignes de nuit' },
    ],
  },
  {
    kind: 'racks',
    path: 'racks',
    title: 'Racks',
    description: 'Structure de rangement.',
    defaults: {},
    fields: [
      { key: 'name', label: 'Nom', kind: 'text', required: true },
      { key: 'capacity', label: 'Capacité', kind: 'number', min: 0, max: 500 },
      { key: 'notes', label: 'Notes', kind: 'textarea' },
    ],
  },
  {
    kind: 'equipment',
    path: 'equipements',
    title: 'Équipements',
    description: 'Matériel, éventuellement rattaché à un terrarium du jeu.',
    defaults: { type: 'heating_mat' },
    fields: [
      { key: 'name', label: 'Nom', kind: 'text', required: true },
      { key: 'type', label: 'Type', kind: 'select', required: true, options: equipmentType },
      { key: 'terrariumRef', label: 'Terrarium', kind: 'ref', collection: 'terrariums' },
      { key: 'brand', label: 'Marque', kind: 'text' },
      { key: 'model', label: 'Modèle', kind: 'text' },
      { key: 'installedAt', label: 'Installé le', kind: 'date' },
      { key: 'lifespanDays', label: 'Durée de vie (jours)', kind: 'number', min: 1, max: 36500 },
      { key: 'nextReplacementAt', label: 'Prochain remplacement', kind: 'date' },
      { key: 'notes', label: 'Notes', kind: 'textarea' },
    ],
  },
  {
    kind: 'consumables',
    path: 'stocks',
    title: 'Stocks',
    description: 'Consommables et seuils.',
    defaults: { type: 'frozen_prey', quantity: '1' },
    fields: [
      { key: 'name', label: 'Nom', kind: 'text', required: true },
      { key: 'type', label: 'Type', kind: 'select', required: true, options: consumableType },
      { key: 'quantity', label: 'Quantité', kind: 'number', required: true, min: 1, max: 1000000 },
      { key: 'lowStockThreshold', label: 'Seuil bas', kind: 'number', min: 1, max: 1000000 },
      { key: 'expirationDate', label: 'Date de péremption', kind: 'date' },
      { key: 'notes', label: 'Notes', kind: 'textarea' },
    ],
  },
  {
    kind: 'breedingEvents',
    path: 'reproductions',
    title: 'Reproductions',
    description: 'Un mâle et une femelle déjà présents dans le jeu.',
    defaults: { status: 'planning' },
    fields: [
      { key: 'maleRef', label: 'Mâle', kind: 'ref', required: true, collection: 'reptiles' },
      { key: 'femaleRef', label: 'Femelle', kind: 'ref', required: true, collection: 'reptiles' },
      { key: 'status', label: 'Statut', kind: 'select', options: breedingStatus },
      { key: 'introductionDate', label: 'Introduction', kind: 'date' },
      { key: 'matingDate', label: 'Accouplement', kind: 'date' },
      { key: 'separationDate', label: 'Séparation', kind: 'date' },
      { key: 'eggsCount', label: 'Nombre d’œufs', kind: 'number', min: 1, max: 1000 },
      { key: 'layingDate', label: 'Ponte', kind: 'date' },
      { key: 'expectedHatchingDate', label: 'Éclosion prévue', kind: 'date' },
      { key: 'notes', label: 'Notes', kind: 'textarea' },
    ],
  },
  {
    kind: 'sheddingCycles',
    path: 'mues',
    title: 'Mues',
    description: 'Cycle de mue d’un reptile du jeu.',
    defaults: { status: 'pre_shed' },
    fields: [
      { key: 'reptileRef', label: 'Reptile', kind: 'ref', required: true, collection: 'reptiles' },
      { key: 'startDate', label: 'Début', kind: 'date', required: true },
      { key: 'completionDate', label: 'Fin', kind: 'date' },
      { key: 'status', label: 'Statut', kind: 'select', options: sheddingStatus },
      { key: 'completeShed', label: 'Mue complète', kind: 'checkbox' },
      { key: 'notes', label: 'Notes', kind: 'textarea' },
    ],
  },
  {
    kind: 'reminders',
    path: 'rappels',
    title: 'Rappels',
    description: 'Rappel rattaché à une fiche déjà ajoutée au jeu.',
    defaults: { remindableType: 'Reptile', type: 'feeding', recurrenceType: 'interval', intervalValue: '7', intervalUnit: 'days', timezone: 'Europe/Paris' },
    fields: [
      { key: 'title', label: 'Titre', kind: 'text' },
      { key: 'type', label: 'Type', kind: 'select', required: true, options: reminderType },
      { key: 'remindableType', label: 'Rattaché à', kind: 'select', required: true, options: remindableTypes },
      { key: 'remindableRef', label: 'Fiche', kind: 'ref', required: true, remindable: true },
      { key: 'recurrenceType', label: 'Récurrence', kind: 'select', required: true, options: recurrence },
      { key: 'intervalValue', label: 'Intervalle', kind: 'number', min: 1, max: 365 },
      { key: 'intervalUnit', label: 'Unité', kind: 'select', options: intervalUnit },
      { key: 'timezone', label: 'Fuseau', kind: 'text', required: true },
      { key: 'startAt', label: 'Prochaine échéance', kind: 'datetime', required: true },
      { key: 'toleranceMinutes', label: 'Tolérance (min)', kind: 'number', min: 1, max: 1440 },
    ],
  },
  {
    kind: 'activities',
    path: 'activites',
    title: 'Activités',
    description: 'Journal. Le poids n’est pris en compte que pour une pesée.',
    defaults: { remindableType: 'Reptile', actionType: 'feeding', actionCategory: 'feeding', status: 'completed' },
    fields: [
      { key: 'title', label: 'Titre', kind: 'text', required: true },
      { key: 'actionType', label: 'Type d’action', kind: 'text', required: true, hint: 'Ex. feeding, weight_recorded, shedding, cleaning.' },
      { key: 'actionCategory', label: 'Catégorie', kind: 'text' },
      { key: 'status', label: 'Statut', kind: 'select', options: activityStatus },
      { key: 'remindableType', label: 'Rattaché à', kind: 'select', required: true, options: remindableTypes },
      { key: 'remindableRef', label: 'Fiche', kind: 'ref', required: true, remindable: true },
      { key: 'actionDate', label: 'Date', kind: 'datetime' },
      { key: 'weight', label: 'Poids (g)', kind: 'number', min: 0, max: 500000, step: '0.1', hint: 'Renseigne-le pour une pesée.' },
      { key: 'description', label: 'Description', kind: 'textarea' },
    ],
  },
  {
    kind: 'devices',
    path: 'boitiers',
    title: 'Boîtiers',
    description: 'Boîtier apparié à un terrarium. L’identifiant doit être unique.',
    defaults: { historyHours: '0' },
    fields: [
      { key: 'deviceId', label: 'Identifiant du boîtier', kind: 'text', required: true },
      { key: 'terrariumRef', label: 'Terrarium', kind: 'ref', required: true, collection: 'terrariums' },
      { key: 'historyHours', label: 'Historique à injecter (heures)', kind: 'number', min: 0, max: 72 },
    ],
  },
]

export function entityByPath(path: string) {
  return entities.find((entity) => entity.path === path)
}

export function entityByKind(kind: DraftKind) {
  const entity = entities.find((item) => item.kind === kind)
  if (!entity) throw new Error(`Entité inconnue : ${kind}`)
  return entity
}

export function emptyDraft(): Draft {
  return {
    reptiles: [],
    terrariums: [],
    racks: [],
    equipment: [],
    consumables: [],
    breedingEvents: [],
    sheddingCycles: [],
    reminders: [],
    activities: [],
    devices: [],
  }
}

export function recordLabel(record: DraftRecord) {
  return record.fields.name || record.fields.title || record.fields.deviceId || record.ref
}

export function exampleDraft(): Draft {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16)
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 16)
  return {
    reptiles: [
      {
        ref: 'female',
        fields: {
          name: 'Noodle',
          scientificName: 'Python regius',
          commonName: 'Python royal',
          gender: 'female',
          issue: 'purchase',
          status: 'alive',
          weight: '420',
          length: '90',
        },
      },
      {
        ref: 'male',
        fields: {
          name: 'Kernel',
          scientificName: 'Pantherophis guttatus',
          commonName: 'Serpent des blés',
          gender: 'male',
          issue: 'birth',
          status: 'alive',
          weight: '180',
        },
      },
    ],
    terrariums: [
      {
        ref: 'tub',
        fields: {
          name: 'Bac Noodle',
          type: 'tub',
          reptileRef: 'female',
          lightsOn: '08:00',
          lightsOff: '20:00',
          heatEnabled: 'true',
          heatInstalled: 'true',
          mistEnabled: 'true',
          mistInstalled: 'true',
          automationEnabled: 'true',
          targetHotC: '31',
          targetColdC: '25',
          targetHumidity: '55',
          length: '80',
          width: '40',
          height: '20',
        },
      },
    ],
    racks: [{ ref: 'rack', fields: { name: 'Mur nord', capacity: '12' } }],
    equipment: [
      {
        ref: 'heat',
        fields: { name: 'Tapis Noodle', type: 'heating_mat', terrariumRef: 'tub', brand: 'Habistat', lifespanDays: '180' },
      },
    ],
    consumables: [
      {
        ref: 'mice',
        fields: { name: 'Souris congelées', type: 'frozen_prey', quantity: '40', lowStockThreshold: '10' },
      },
    ],
    breedingEvents: [{ ref: 'pair', fields: { maleRef: 'male', femaleRef: 'female', status: 'planning' } }],
    sheddingCycles: [{ ref: 'shed', fields: { reptileRef: 'female', startDate: new Date().toISOString().slice(0, 10), status: 'pre_shed' } }],
    reminders: [
      {
        ref: 'feed',
        fields: {
          title: 'Repas Noodle',
          type: 'feeding',
          remindableType: 'Reptile',
          remindableRef: 'female',
          recurrenceType: 'interval',
          intervalValue: '7',
          intervalUnit: 'days',
          timezone: 'Europe/Paris',
          startAt: tomorrow,
        },
      },
    ],
    activities: [
      {
        ref: 'weigh',
        fields: {
          title: 'Pesée Noodle',
          actionType: 'weight_recorded',
          actionCategory: 'health',
          status: 'completed',
          remindableType: 'Reptile',
          remindableRef: 'female',
          actionDate: yesterday,
          weight: '420',
        },
      },
    ],
    devices: [{ ref: 'box', fields: { deviceId: `labo-${Date.now()}`, terrariumRef: 'tub', historyHours: '2' } }],
  }
}
