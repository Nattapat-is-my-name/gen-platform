import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/v1/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, prompt, model, duration: parseInt(duration), resolution, promptOptimizer }),
      })
      const data = await res.json()
      console.log(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const insertCameraCommand = (cmd: string) => {
    setPrompt(prev => prev + (prev ? ' ' : '') + `[${cmd}]`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Video Generation</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Video</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-6">
              {videoModes.map((m) => (
                <Button
                  key={m.id}
                  variant={mode === m.id ? 'default' : 'outline'}
                  onClick={() => setMode(m.id)}
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
                  placeholder="Describe the video you want to generate..."
                  required
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
                    >
                      {cmd}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select value={model} onValueChange={(v) => setModel(v || 'MiniMax-Hailuo-02')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MiniMax-Hailuo-02">MiniMax-Hailuo-02</SelectItem>
                      <SelectItem value="MiniMax-Hailuo-2.3">MiniMax-Hailuo-2.3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={duration} onValueChange={(v) => setDuration(v || '6')}>
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
                  <Select value={resolution} onValueChange={(v) => setResolution(v || '768P')}>
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
                  className="rounded"
                />
                <Label htmlFor="promptOptimizer">Enable Prompt Optimizer</Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create Video'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}