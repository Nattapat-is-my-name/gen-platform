import { Link } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  { title: 'Text to Image', desc: 'Generate images from text prompts', path: '/images', icon: '🖼️', gradient: 'from-blue-500 to-blue-600' },
  { title: 'Image to Image', desc: 'Transform images with AI', path: '/images', icon: '✨', gradient: 'from-purple-500 to-purple-600' },
  { title: 'Text to Video', desc: 'Generate videos from text', path: '/videos', icon: '🎬', gradient: 'from-green-500 to-green-600' },
  { title: 'Image to Video', desc: 'Animate images into videos', path: '/videos', icon: '🎥', gradient: 'from-yellow-500 to-orange-500' },
  { title: 'First + Last Frame', desc: 'Video from frame transitions', path: '/videos', icon: '🖼️', gradient: 'from-orange-500 to-red-500' },
  { title: 'Subject Reference', desc: 'Video with subject reference', path: '/videos', icon: '👤', gradient: 'from-pink-500 to-rose-600' },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            MiniMax Gen
          </h1>
          <p className="text-slate-600 mt-3 text-lg">
            AI-powered image and video generation platform
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold text-slate-700 mb-6">Choose a generation type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link key={feature.title} to={feature.path} className="block group">
              <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${feature.gradient}`} />
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="mt-2">{feature.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}

          <Link to="/history" className="block group">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-slate-400 to-slate-500" />
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">
                  📚
                </div>
                <CardTitle className="text-xl">History</CardTitle>
                <CardDescription className="mt-2">View all your generations</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-sm text-slate-500">
        Powered by MiniMax AI
      </footer>
    </div>
  )
}