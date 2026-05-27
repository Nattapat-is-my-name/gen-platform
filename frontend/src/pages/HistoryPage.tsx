import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, RefreshCw, Trash2, Download, Eye } from 'lucide-react'

interface Generation {
  id: string
  type: string
  mode: string
  prompt: string
  status: string
  taskId?: string
  outputs?: { url: string }[]
  createdAt: string
  errorMessage?: string
}

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchGenerations = async () => {
    try {
      const res = await fetch('/api/v1/generations')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setGenerations(data)
    } catch (err) {
      toast.error('Failed to load history')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGenerations()
  }, [])

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
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      processing: 'bg-yellow-100 text-yellow-700',
      pending: 'bg-slate-100 text-slate-700',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Generation History</h1>
            <p className="text-slate-500 mt-1">View all your image and video generations</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchGenerations} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : generations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📭</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No generations yet</h3>
              <p className="text-slate-500">Create your first image or video to see it here!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generations.map((gen) => (
              <Card key={gen.id} className="overflow-hidden">
                {gen.outputs?.[0]?.url && (
                  <div className="aspect-video bg-slate-100">
                    <img
                      src={gen.outputs[0].url}
                      alt={gen.prompt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    {getStatusBadge(gen.status)}
                    <span className="text-xs text-slate-400">
                      {new Date(gen.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-medium capitalize">
                    {gen.mode.replace(/_/g, ' ')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4">{gen.prompt}</p>
                  {gen.errorMessage && (
                    <p className="text-xs text-red-500 mb-4">Error: {gen.errorMessage}</p>
                  )}
                  <div className="flex gap-2">
                    {gen.outputs?.[0]?.url && (
                      <Button variant="outline" size="sm" onClick={() => window.open(gen.outputs?.[0]?.url, '_blank')}>
                        <Eye className="mr-1 h-3 w-3" />
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
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(gen.id)}
                      disabled={deletingId === gen.id}
                    >
                      {deletingId === gen.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}