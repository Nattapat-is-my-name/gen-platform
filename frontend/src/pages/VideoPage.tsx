import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const videoModes = [
  { id: 'text_to_video', label: 'Text to Video' },
  { id: 'image_to_video', label: 'Image to Video' },
  { id: 'first_last_frame_video', label: 'First + Last Frame' },
  { id: 'subject_reference_video', label: 'Subject Reference' },
]

const cameraCommands = [
  'Push in', 'Pull out', 'Pan left', 'Pan right',
  'Tilt up', 'Tilt down', 'Zoom in', 'Zoom out',
  'Tracking shot', 'Static shot', 'Shake'
]

export default function VideoPage() {
  const [mode, setMode] = useState('text_to_video')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('MiniMax-Hailuo-02')
  const [duration, setDuration] = useState('6')
  const [resolution, setResolution] = useState('768P')
  const [promptOptimizer, setPromptOptimizer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ generationId?: string; taskId?: string; status?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/v1/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, prompt, model, duration: parseInt(duration), resolution, promptOptimizer }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create video')
        return
      }

      setResult(data)
      toast.success('Video generation started!')
    } catch (err) {
      toast.error('Network error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const insertCameraCommand = (cmd: string) => {
    setPrompt(prev => prev + (prev ? ' ' : '') + `[${cmd}]`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Video Generation</h1>
          <p className="text-slate-500 mt-1">Create amazing videos with AI</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Create Video</CardTitle>
              <CardDescription>Describe the video you want to generate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-6">
                {videoModes.map((m) => (
                  <Button
                    key={m.id}
                    variant={mode === m.id ? 'default' : 'outline'}
                    onClick={() => setMode(m.id)}
                    size="sm"
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
                    placeholder="A person walking through a city street [Pan left]..."
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Camera Commands</Label>
                  <div className="flex flex-wrap gap-2">
                    {cameraCommands.map((cmd) => (
                      <Button
                        key={cmd}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => insertCameraCommand(cmd)}
                        disabled={loading}
                      >
                        {cmd}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select value={model} onValueChange={(v) => setModel(v || 'MiniMax-Hailuo-02')} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MiniMax-Hailuo-02">Hailuo-02</SelectItem>
                        <SelectItem value="MiniMax-Hailuo-2.3">Hailuo-2.3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={duration} onValueChange={(v) => setDuration(v || '6')} disabled={loading}>
                      <SelectTrigger>
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="768P">768P</SelectItem>
                        <SelectItem value="1080P">1080P</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="promptOptimizer"
                    checked={promptOptimizer}
                    onChange={(e) => setPromptOptimizer(e.target.checked)}
                    disabled={loading}
                    className="rounded"
                  />
                  <Label htmlFor="promptOptimizer" className="text-sm">Enable Prompt Optimizer</Label>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Video'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-3 h-3 rounded-full ${
                        result.status === 'success' ? 'bg-green-500' :
                        result.status === 'processing' ? 'bg-yellow-500' :
                        result.status === 'failed' ? 'bg-red-500' : 'bg-slate-400'
                      }`} />
                      <span className="font-medium capitalize">{result.status}</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Generation ID: {result.generationId}
                    </p>
                    {result.taskId && (
                      <p className="text-sm text-slate-600">
                        Task ID: {result.taskId}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    Check the History page to track progress and view your video when ready.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <span className="text-4xl">🎬</span>
                  </div>
                  <p className="text-center">Your video will be created here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}