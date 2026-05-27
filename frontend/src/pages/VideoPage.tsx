import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Clapperboard, ExternalLink, Loader2, WandSparkles } from 'lucide-react'
import { useSession } from '@/lib/session'
import { PageShell } from '@/components/app/PageShell'
import {
  createActiveGeneration,
  removeActiveGeneration,
  removeActiveGenerationByGenerationId,
  updateActiveGeneration,
} from '@/lib/active-generations'

const videoModes = [
  { id: 'text_to_video', label: 'Text to Video' },
  { id: 'image_to_video', label: 'Image to Video' },
  { id: 'first_last_frame_video', label: 'First + Last Frame' },
  { id: 'subject_reference_video', label: 'Subject Reference' },
] as const

type VideoMode = typeof videoModes[number]['id']

const cameraCommands = [
  'Push in', 'Pull out', 'Pan left', 'Pan right',
  'Tilt up', 'Tilt down', 'Zoom in', 'Zoom out',
  'Tracking shot', 'Static shot', 'Shake'
]

export default function VideoPage() {
  const sessionId = useSession()
  const [mode, setMode] = useState<VideoMode>('text_to_video')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('MiniMax-Hailuo-2.3')
  const [duration, setDuration] = useState('6')
  const [resolution, setResolution] = useState('768P')
  const [promptOptimizer, setPromptOptimizer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [result, setResult] = useState<{ generationId?: string; taskId?: string; status?: string; outputs?: { url: string }[] } | null>(null)
  const resultUrl = result?.outputs?.[0]?.url

  useEffect(() => {
    if (!result?.generationId || result.status === 'success' || result.status === 'failed') {
      return
    }

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/generations/${result.generationId}`)
        const data = await res.json()
        setResult(data)
        if (data.status === 'success' || data.status === 'failed') {
          setPolling(false)
          removeActiveGenerationByGenerationId(data.id || result.generationId)
          if (data.status === 'success') {
            toast.success('Video generation completed!')
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 5000)

    return () => clearInterval(pollInterval)
  }, [result?.generationId, result?.status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    if (!sessionId) {
      toast.error('Session is still loading. Please try again.')
      return
    }

    setLoading(true)
    setResult(null)

    const activeClientId = createActiveGeneration({
      sessionId,
      type: 'video',
      mode,
      prompt,
      model,
      status: 'pending',
    })

    try {
      const res = await fetch('/api/v1/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, mode, prompt, model, duration: parseInt(duration), resolution, promptOptimizer }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create video')
        removeActiveGeneration(activeClientId)
        return
      }

      if (data.generationId) {
        updateActiveGeneration(activeClientId, {
          generationId: data.generationId,
          taskId: data.taskId,
          status: data.status || 'processing',
        })
      }

      setResult(data)
      if (data.status === 'success' || data.status === 'failed') {
        removeActiveGeneration(activeClientId)
      } else {
        setPolling(true)
      }
      toast.success('Video generation started.')
    } catch (err) {
      toast.error('Network error. Please try again.')
      console.error(err)
      removeActiveGeneration(activeClientId)
    } finally {
      setLoading(false)
    }
  }

  const insertCameraCommand = (cmd: string) => {
    setPrompt(prev => prev + (prev ? ' ' : '') + `[${cmd}]`)
  }

  return (
    <PageShell title="Videos" description="Create short clips with prompt, model, and camera controls.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Create video</CardTitle>
            <CardDescription>Set the mode, prompt, and output options.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-1 rounded-lg border bg-muted p-1 sm:grid-cols-2">
              {videoModes.map((m) => (
                <Button
                  key={m.id}
                  type="button"
                  variant={mode === m.id ? 'default' : 'outline'}
                  onClick={() => setMode(m.id)}
                  className="w-full"
                >
                  {m.label}
                </Button>
              ))}
            </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    placeholder="A calm street scene at dusk [Pan left]"
                    required
                    disabled={loading}
                    className="min-h-32 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Camera commands</Label>
                  <div className="flex flex-wrap gap-2">
                    {cameraCommands.map((cmd) => (
                      <Button
                        key={cmd}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => insertCameraCommand(cmd)}
                        disabled={loading}
                        className="rounded-md"
                      >
                        {cmd}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select value={model} onValueChange={(v) => setModel(v || 'MiniMax-Hailuo-02')} disabled={loading}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MiniMax-Hailuo-2.3">Hailuo-2.3</SelectItem>
                        <SelectItem value="MiniMax-Hailuo-2.3-Fast-6s-768p">Hailuo-2.3 Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={duration} onValueChange={(v) => setDuration(v || '6')} disabled={loading}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 seconds</SelectItem>
                        <SelectItem value="10">10 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <Select value={resolution} onValueChange={(v) => setResolution(v || '768P')} disabled={loading}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="768P">768P</SelectItem>
                        <SelectItem value="1080P">1080P</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <label className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3">
                  <span className="space-y-1">
                    <span className="block text-sm font-medium">Prompt optimizer</span>
                    <span className="block text-sm text-muted-foreground">Let the model refine prompt details.</span>
                  </span>
                  <input
                    type="checkbox"
                    id="promptOptimizer"
                    checked={promptOptimizer}
                    onChange={(e) => setPromptOptimizer(e.target.checked)}
                    disabled={loading}
                    className="size-4 rounded border-input accent-foreground"
                  />
                </label>

                <Button type="submit" className="w-full" disabled={loading || !sessionId}>
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating
                    </>
                  ) : (
                    <>
                      <WandSparkles className="size-4" />
                      Create video
                    </>
                  )}
                </Button>
              </form>
          </CardContent>
        </Card>

        <Card className="rounded-lg lg:sticky lg:top-6 lg:self-start">
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Video jobs update automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg border bg-card">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Starting video</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  This also appears as loading in History until it finishes.
                </p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${
                      result.status === 'success' ? 'bg-emerald-500' :
                      result.status === 'processing' ? 'bg-amber-500 animate-pulse' :
                      result.status === 'failed' ? 'bg-destructive' : 'bg-muted-foreground'
                    }`} />
                    <span className="font-medium capitalize">{result.status || 'queued'}</span>
                    {polling && result.status === 'processing' && (
                      <Loader2 className="ml-2 size-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generation ID: {result.generationId?.slice(0, 8)}...
                  </p>
                  {resultUrl && (
                    <div className="mt-4 space-y-3">
                      <video
                        src={resultUrl}
                        controls
                        className="w-full rounded-lg border bg-background"
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(resultUrl, '_blank')}
                      >
                        <ExternalLink className="size-4" />
                        Open video
                      </Button>
                    </div>
                  )}
                </div>
                {result.status === 'processing' && (
                  <p className="text-sm text-muted-foreground">
                    Video is being generated. This may take a few minutes.
                  </p>
                )}
                {result.status === 'failed' && (
                  <p className="text-sm text-destructive">
                    Generation failed. Please try again.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg border bg-card">
                  <Clapperboard className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No video yet</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">Generated videos appear here when they finish.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
