import { Link } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  { title: 'Text to Image', desc: 'Generate images from text prompts', path: '/images', color: 'bg-blue-500 hover:bg-blue-600' },
  { title: 'Image to Image', desc: 'Transform images with AI', path: '/images', color: 'bg-purple-500 hover:bg-purple-600' },
  { title: 'Text to Video', desc: 'Generate videos from text', path: '/videos', color: 'bg-green-500 hover:bg-green-600' },
  { title: 'Image to Video', desc: 'Animate images into videos', path: '/videos', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { title: 'First + Last Frame', desc: 'Video from frame transitions', path: '/videos', color: 'bg-orange-500 hover:bg-orange-600' },
  { title: 'Subject Reference', desc: 'Video with subject reference', path: '/videos', color: 'bg-red-500 hover:bg-red-600' },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-slate-900">MiniMax Gen</h1>
          <p className="text-slate-600 mt-2">AI Image & Video Generation Platform</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link key={feature.title} to={feature.path} className="block">
              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                    <span className="text-white text-xl font-bold">+</span>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}

          <Link to="/history" className="block">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-slate-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white text-xl font-bold">H</span>
                </div>
                <CardTitle className="text-xl">History</CardTitle>
                <CardDescription>View all your generations</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}