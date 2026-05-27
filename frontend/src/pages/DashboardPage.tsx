import { Link } from 'react-router-dom'

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">MiniMax Gen</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/images" className="p-6 border rounded-lg hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Text to Image</h2>
          <p className="text-gray-600">Generate images from text prompts</p>
        </Link>
        <Link to="/images" className="p-6 border rounded-lg hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Image to Image</h2>
          <p className="text-gray-600">Transform images with AI</p>
        </Link>
        <Link to="/videos" className="p-6 border rounded-lg hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Text to Video</h2>
          <p className="text-gray-600">Generate videos from text</p>
        </Link>
        <Link to="/videos" className="p-6 border rounded-lg hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Image to Video</h2>
          <p className="text-gray-600">Animate images into videos</p>
        </Link>
        <Link to="/videos" className="p-6 border rounded-lg hover:bg-gray-50">
          <h2 className="text-xl font-semibold">First + Last Frame Video</h2>
          <p className="text-gray-600">Video from frame transitions</p>
        </Link>
        <Link to="/videos" className="p-6 border rounded-lg hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Subject Reference Video</h2>
          <p className="text-gray-600">Video with subject reference</p>
        </Link>
        <Link to="/history" className="p-6 border rounded-lg hover:bg-gray-50 col-span-full">
          <h2 className="text-xl font-semibold">History</h2>
          <p className="text-gray-600">View all your generations</p>
        </Link>
      </div>
    </div>
  )
}