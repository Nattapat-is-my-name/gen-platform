import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ExternalLink, Image as ImageIcon, Loader2, Upload, WandSparkles } from 'lucide-react'
import { useSession } from '@/lib/session'
import { PageShell } from '@/components/app/PageShell'
import { createActiveGeneration, removeActiveGeneration, updateActiveGeneration } from '@/lib/active-generations'

const imageModes = [
  { id: 'text_to_image', label: 'Text' },
  { id: 'image_to_image', label: 'Reference' },
] as const

export default function ImagePage() {
  const sessionId = useSession()
  const [mode, setMode] = useState<'text_to_image' | 'image_to_image'>('text_to_image')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('image-01')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ outputs?: { url: string }[] } | null>(null)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resultUrl = result?.outputs?.[0]?.url

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

    if (mode === 'image_to_image' && !referenceImage) {
      toast.error('Please upload a reference image')
      return
    }

    setLoading(true)
    setResult(null)

    const activeClientId = createActiveGeneration({
      sessionId,
      type: 'image',
      mode,
      prompt,
      model,
      status: 'processing',
    })

    try {
      const body: Record<string, unknown> = { sessionId, mode, prompt, model, aspectRatio }
      if (mode === 'image_to_image' && referenceImage) {
        body.referenceImageObjectKey = referenceImage
      }

      const res = await fetch('/api/v1/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to generate image')
        setLoading(false)
        removeActiveGeneration(activeClientId)
        return
      }

      if (data.generationId) {
        updateActiveGeneration(activeClientId, {
          generationId: data.generationId,
          status: data.status || 'success',
          outputs: data.outputs,
        })
      }

      setResult(data)
      removeActiveGeneration(activeClientId)
      toast.success('Image generated successfully!')
    } catch (err) {
      toast.error('Network error. Please try again.')
      console.error(err)
      removeActiveGeneration(activeClientId)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      setReferenceImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to upload image')
        setReferenceImagePreview(null)
        return
      }

      setReferenceImage(data.objectKey)
      toast.success('Image uploaded successfully!')
    } catch (err) {
      toast.error('Failed to upload image. Please try again.')
      console.error(err)
      setReferenceImagePreview(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <PageShell title="Images" description="Generate from text or use a reference image.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Create image</CardTitle>
            <CardDescription>Choose a mode and prompt the result.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-1 rounded-lg border bg-muted p-1">
              {imageModes.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={mode === item.id ? 'default' : 'ghost'}
                  onClick={() => setMode(item.id)}
                  className="w-full"
                >
                  {item.label}
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
                    placeholder="A quiet product photo on a stone surface, soft window light"
                    required
                    disabled={loading}
                    className="min-h-32 resize-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select value={model} onValueChange={(v) => setModel(v || 'image-01')} disabled={loading}>
                      <SelectTrigger className="w-full">
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
                      <SelectTrigger className="w-full">
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

                {mode === 'image_to_image' && (
                  <div className="space-y-2">
                    <Label>Reference image</Label>
                    <div className="rounded-lg border border-dashed bg-muted/40 p-3">
                      {referenceImagePreview ? (
                        <div className="space-y-3">
                          <img
                            src={referenceImagePreview}
                            alt="Reference"
                            className="max-h-48 w-full rounded-md border bg-background object-contain"
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {uploading && (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Loader2 className="size-4 animate-spin" />
                                Uploading...
                              </span>
                            )}
                            {referenceImage && !uploading && (
                              <span className="text-sm font-medium text-foreground">Uploaded</span>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReferenceImage(null)
                                setReferenceImagePreview(null)
                                if (fileInputRef.current) fileInputRef.current.value = ''
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                          <div className="flex size-10 items-center justify-center rounded-lg border bg-card">
                            <Upload className="size-4 text-muted-foreground" />
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="size-4 animate-spin" />
                                Uploading
                              </>
                            ) : (
                              <>
                                <Upload className="size-4" />
                                Upload reference
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || uploading || !sessionId || (mode === 'image_to_image' && !referenceImage)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Generating
                    </>
                  ) : (
                    <>
                      <WandSparkles className="size-4" />
                      Generate image
                    </>
                  )}
                </Button>
              </form>
          </CardContent>
        </Card>

        <Card className="rounded-lg lg:sticky lg:top-6 lg:self-start">
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>Preview and open the generated asset.</CardDescription>
          </CardHeader>
            <CardContent>
            {loading ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg border bg-card">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Generating image</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  This also appears as loading in History until it finishes.
                </p>
              </div>
            ) : resultUrl ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg border bg-muted">
                  <img src={resultUrl} alt="Generated" className="max-h-[640px] w-full object-contain" />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(resultUrl, '_blank')}
                >
                  <ExternalLink className="size-4" />
                  Open image
                </Button>
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg border bg-card">
                  <ImageIcon className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No image yet</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">Generated images appear here when they finish.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
