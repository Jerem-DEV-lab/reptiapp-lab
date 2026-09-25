import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ScenarioResult } from '@/api'
import { emptyDraft, exampleDraft, type Draft, type DraftKind, type DraftRecord } from '@/seed/catalog'

const storageKey = 'reptilab.seedDraft'

type SeedDraftContextValue = {
  draft: Draft
  result: ScenarioResult | null
  setResult: (result: ScenarioResult | null) => void
  saveRecord: (kind: DraftKind, record: DraftRecord) => void
  removeRecord: (kind: DraftKind, ref: string) => void
  loadExample: () => void
  clearDraft: () => void
}

const SeedDraftContext = createContext<SeedDraftContextValue | null>(null)

function readDraft(): Draft {
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return emptyDraft()
    const parsed = JSON.parse(raw) as Partial<Draft>
    return { ...emptyDraft(), ...parsed }
  } catch {
    return emptyDraft()
  }
}

export function SeedDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(readDraft)
  const [result, setResult] = useState<ScenarioResult | null>(null)

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(draft))
  }, [draft])

  const value = useMemo<SeedDraftContextValue>(
    () => ({
      draft,
      result,
      setResult,
      saveRecord(kind, record) {
        setDraft((current) => {
          const rows = current[kind]
          const next = rows.some((row) => row.ref === record.ref)
            ? rows.map((row) => (row.ref === record.ref ? record : row))
            : [...rows, record]
          return { ...current, [kind]: next }
        })
      },
      removeRecord(kind, ref) {
        setDraft((current) => ({ ...current, [kind]: current[kind].filter((row) => row.ref !== ref) }))
      },
      loadExample() {
        setDraft(exampleDraft())
        setResult(null)
      },
      clearDraft() {
        setDraft(emptyDraft())
        setResult(null)
      },
    }),
    [draft, result],
  )

  return <SeedDraftContext.Provider value={value}>{children}</SeedDraftContext.Provider>
}

export function useSeedDraft() {
  const value = useContext(SeedDraftContext)
  if (!value) throw new Error('Le brouillon du jeu de données est indisponible.')
  return value
}
