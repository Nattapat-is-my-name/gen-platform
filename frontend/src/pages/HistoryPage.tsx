import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Clapperboard, Download, Eye, History as HistoryIcon, Image as ImageIcon, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { useSession } from '@/lib/session'
import { PageShell } from '@/components/app/PageShell'
import { cn } from '@/lib/utils'
import {
  type ActiveGeneration,
  listActiveGenerations,
  removeActiveGenerations,
  removeActiveGenerationByGenerationId,
  subscribeActiveGenerations,
} from '@/lib/active-generations'

interface Generation {
  id: string
  sessionId?: string
  type: string
  mode: string
  prompt: string
  model?: string
  status: string
  taskId?: string
  outputs?: { url: string }[]
  createdAt: string
  errorMessage?: string
  isLocalOnly?: boolean
}

const formatMode = (mode: string) => mode.replace(/_/g, ' ')
const isVideoGeneration = (gen: Generation) => gen.type === 'video' || gen.mode.includes('video')
const isInProgress = (gen: Generation) => gen.status === 'pending' || gen.status === 'processing'
const formatCreatedDate = (createdAt?: string) => {
  if (!createdAt) return 'Just now'

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return 'Just now'

  return date.toLocaleDateString()
}
const isSameRequest = (active: ActiveGeneration, generation: Generation, sessionId: string) => {
  return active.sessionId === sessionId
    && active.type === generation.type
    && active.mode === generation.mode
    && active.prompt === generation.prompt
    && (!generation.model || active.model === generation.model)
    && isInProgress(generation)
}

export default function HistoryPage() {
  const sessionId = useSession()
  const [generations, setGenerations] = useState<Generation[]>([])
  const [activeGenerations, setActiveGenerations] = useState<ActiveGeneration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchGenerations = useCallback(async (options?: { silent?: boolean }) => {
    if (!sessionId) return

    if (!options?.silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const res = await fetch(`/api/v1/generations?sessionId=${encodeURIComponent(sessionId)}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setGenerations(data)
    } catch (err) {
      setError('History unavailable')
      toast.error('Failed to load history')
      console.error(err)
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }, [sessionId])

  useEffect(() => {
    fetchGenerations()
  }, [fetchGenerations])

  useEffect(() => {
    if (!sessionId) return

    const syncActiveGenerations = () => {
      setActiveGenerations(listActiveGenerations(sessionId))
    }

    syncActiveGenerations()
    return subscribeActiveGenerations(syncActiveGenerations)
  }, [sessionId])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/v1/generations/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setGenerations(prev => prev.filter(g => g.id !== id))
      toast.success('Deleted successfully')
    } catch (err) {
      toast.error('Failed to delete')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      failed: 'border-red-200 bg-red-50 text-red-700',
      processing: 'border-amber-200 bg-amber-50 text-amber-700',
      pending: 'border-border bg-muted text-muted-foreground',
    }
    return (
      <span className={cn('inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium capitalize', styles[status as keyof typeof styles] || styles.pending)}>
        {status}
      </span>
    )
  }

  const displayedGenerations = useMemo(() => {
    const backendIds = new Set(generations.map((generation) => generation.id))
    const localGenerations = activeGenerations
      .filter((generation) => {
        if (generation.generationId && backendIds.has(generation.generationId)) return false
        return !generations.some((backendGeneration) => isSameRequest(generation, backendGeneration, sessionId))
      })
      .map((generation): Generation => ({
        id: generation.generationId || generation.clientId,
        sessionId: generation.sessionId,
        type: generation.type,
        mode: generation.mode,
        prompt: generation.prompt,
        status: generation.status,
        taskId: generation.taskId,
        outputs: generation.outputs,
        createdAt: generation.createdAt,
        errorMessage: generation.errorMessage,
        isLocalOnly: !generation.generationId,
      }))

    return [...localGenerations, ...generations].sort(
      (a, b) => {
        const aTime = new Date(a.createdAt).getTime()
        const bTime = new Date(b.createdAt).getTime()

        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime)
      }
    )
  }, [activeGenerations, generations, sessionId])

  useEffect(() => {
    const staleClientIds = activeGenerations
      .filter((generation) => {
        if (generation.generationId) {
          return generations.some((backendGeneration) => backendGeneration.id === generation.generationId)
        }

        return generations.some((backendGeneration) => isSameRequest(generation, backendGeneration, sessionId))
      })
      .map((generation) => generation.clientId)

    if (staleClientIds.length > 0) {
      removeActiveGenerations(staleClientIds)
    }
  }, [activeGenerations, generations, sessionId])

  useEffect(() => {
    const pollableGenerations = displayedGenerations.filter(
      (generation) => isInProgress(generation) && !generation.isLocalOnly
    )

    if (pollableGenerations.length === 0) return

    const pollGenerations = async () => {
      await Promise.all(
        pollableGenerations.map(async (generation) => {
          try {
            const res = await fetch(`/api/v1/generations/${generation.id}`)
            if (!res.ok) return

            const data = await res.json()
            setGenerations((current) => {
              const exists = current.some((item) => item.id === data.id)
              if (!exists) return [data, ...current]

              return current.map((item) => item.id === data.id ? data : item)
            })

            if (data.status === 'success' || data.status === 'failed') {
              removeActiveGenerationByGenerationId(data.id)
            }
          } catch (err) {
            console.error('Failed to poll generation:', err)
          }
        })
      )
    }

    pollGenerations()
    const interval = window.setInterval(pollGenerations, 5000)

    return () => window.clearInterval(interval)
  }, [displayedGenerations])

  return (
    <PageShell
      title="History"
      description="Review generated images and videos from this session."
      actions={
        <Button variant="outline" size="sm" onClick={() => fetchGenerations()} disabled={loading || !sessionId}>
          <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      }
    >
      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed bg-muted/30">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
          <Card className="rounded-lg">
            <CardContent className="py-14 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg border bg-card">
                <HistoryIcon className="size-5 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium text-foreground">{error}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Check the API connection and refresh.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => fetchGenerations()}>
                <RefreshCw className="size-4" />
                Refresh
              </Button>
            </CardContent>
          </Card>
      ) : displayedGenerations.length === 0 ? (
          <Card className="rounded-lg">
            <CardContent className="py-14 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg border bg-card">
                <HistoryIcon className="size-5 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium text-foreground">No generations yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Create an image or video to see it here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedGenerations.map((gen) => (
              <Card key={gen.id} className="h-full rounded-lg">
                <div className="aspect-video border-b bg-muted">
                  {gen.outputs?.[0]?.url ? (
                    isVideoGeneration(gen) ? (
                      <video
                        src={gen.outputs[0].url}
                        className="h-full w-full object-cover"
                        preload="metadata"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={gen.outputs[0].url}
                        alt={gen.prompt}
                        className="h-full w-full object-cover"
                      />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      {isInProgress(gen) ? (
                        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="size-6 animate-spin" />
                          {gen.status === 'pending' ? 'Starting' : 'Generating'}
                        </div>
                      ) : isVideoGeneration(gen) ? (
                        <Clapperboard className="size-6 text-muted-foreground" />
                      ) : (
                        <ImageIcon className="size-6 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  </div>
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    {getStatusBadge(gen.status)}
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatCreatedDate(gen.createdAt)}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-1 text-sm capitalize">
                    {formatMode(gen.mode)}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{gen.prompt}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  {gen.errorMessage && (
                    <p className="rounded-md border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
                      {gen.errorMessage}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {gen.outputs?.[0]?.url && (
                      <Button variant="outline" size="sm" onClick={() => window.open(gen.outputs?.[0]?.url, '_blank')}>
                        <Eye className="size-3.5" />
                        View
                      </Button>
                    )}
                    {gen.status === 'success' && gen.outputs?.[0]?.url && (
                      <Button variant="outline" size="sm" onClick={() => {
                        const a = document.createElement('a')
                        a.href = gen.outputs?.[0]?.url || ''
                        a.download = ''
                        a.click()
                      }}>
                        <Download className="size-3.5" />
                        Download
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto text-destructive hover:text-destructive"
                      onClick={() => handleDelete(gen.id)}
                      disabled={deletingId === gen.id || gen.isLocalOnly}
                      title={gen.isLocalOnly ? 'Available after the request starts' : 'Delete'}
                    >
                      {deletingId === gen.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </PageShell>
  )
}
