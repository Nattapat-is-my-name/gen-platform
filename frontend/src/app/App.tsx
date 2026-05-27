import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardPage from '../pages/DashboardPage'
import ImagePage from '../pages/ImagePage'
import VideoPage from '../pages/VideoPage'
import HistoryPage from '../pages/HistoryPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/images" element={<ImagePage />} />
        <Route path="/videos" element={<VideoPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </BrowserRouter>
  )
}