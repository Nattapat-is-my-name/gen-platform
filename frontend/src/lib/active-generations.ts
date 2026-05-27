export type ActiveGenerationStatus = 'pending' | 'processing' | 'success' | 'failed'

export type ActiveGeneration = {
  clientId: string
  generationId?: string
  sessionId: string
  type: 'image' | 'video'
  mode: string
  prompt: string
  model: string
  status: ActiveGenerationStatus
  taskId?: string
  outputs?: { url: string }[]
  errorMessage?: string
  createdAt: string
}

type ActiveGenerationInput = Omit<ActiveGeneration, 'clientId' | 'createdAt'>

export const ACTIVE_GENERATIONS_EVENT = 'minimax-active-generations-change'

const STORAGE_KEY = 'minimax_active_generations'

function readActiveGenerations() {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as ActiveGeneration[] : []
  } catch {
    return []
  }
}

function writeActiveGenerations(generations: ActiveGeneration[]) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(generations))
  window.dispatchEvent(new Event(ACTIVE_GENERATIONS_EVENT))
}

export function listActiveGenerations(sessionId?: string) {
  const generations = readActiveGenerations()

  if (!sessionId) return generations
  return generations.filter((generation) => generation.sessionId === sessionId)
}

export function createActiveGeneration(input: ActiveGenerationInput) {
  const clientId = `local-${crypto.randomUUID()}`
  const generation: ActiveGeneration = {
    ...input,
    clientId,
    createdAt: new Date().toISOString(),
  }

  writeActiveGenerations([generation, ...readActiveGenerations()])
  return clientId
}

export function updateActiveGeneration(clientId: string, patch: Partial<ActiveGeneration>) {
  const generations = readActiveGenerations()
  const next = generations.map((generation) =>
    generation.clientId === clientId ? { ...generation, ...patch } : generation
  )

  writeActiveGenerations(next)
}

export function removeActiveGeneration(clientId: string) {
  writeActiveGenerations(readActiveGenerations().filter((generation) => generation.clientId !== clientId))
}

export function removeActiveGenerationByGenerationId(generationId: string) {
  writeActiveGenerations(readActiveGenerations().filter((generation) => generation.generationId !== generationId))
}

export function removeActiveGenerations(clientIds: string[]) {
  const ids = new Set(clientIds)
  writeActiveGenerations(readActiveGenerations().filter((generation) => !ids.has(generation.clientId)))
}

export function subscribeActiveGenerations(callback: () => void) {
  if (typeof window === 'undefined') return () => undefined

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback()
  }

  window.addEventListener(ACTIVE_GENERATIONS_EVENT, callback)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(ACTIVE_GENERATIONS_EVENT, callback)
    window.removeEventListener('storage', handleStorage)
  }
}
