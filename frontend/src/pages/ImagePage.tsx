import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function ImagePage() {
  const [mode, setMode] = useState<'text_to_image' | 'image_to_image'>('text_to_image')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('image-01')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ outputs?: { url: string }[] } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/v1/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, prompt, model, aspectRatio }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to generate image')
        return
      }

      setResult(data)
      toast.success('Image generated successfully!')
    } catch (err) {
      toast.error('Network error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Image Generation</h1>
          <p className="text-slate-500 mt-1">Create stunning images with AI</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Create Image</CardTitle>
              <CardDescription>Describe the image you want to generate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Button
                  variant={mode === 'text_to_image' ? 'default' : 'outline'}
                  onClick={() => setMode('text_to_image')}
                  className="flex-1"
                >
                  Text to Image
                </Button>
                <Button
                  variant={mode === 'image_to_image' ? 'default' : 'outline'}
                  onClick={() => setMode('image_to_image')}
                  className="flex-1"
                >
                  Image to Image
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    placeholder="A beautiful sunset over the ocean with golden light..."
                    required
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select value={model} onValueChange={(v) => setModel(v || 'image-01')} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image-01">image-01</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v || '1:1')} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                        <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                        <SelectItem value="3:2">3:2 (Photo)</SelectItem>
                        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Image'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              {result?.outputs?.[0]?.url ? (
                <div className="space-y-4">
                  <img
                    src={result.outputs[0].url}
                    alt="Generated"
                    className="w-full rounded-lg shadow-lg"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(result.outputs?.[0]?.url, '_blank')}
                  >
                    Open Image
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <span className="text-4xl">🖼️</span>
                  </div>
                  <p className="text-center">Your generated image will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}