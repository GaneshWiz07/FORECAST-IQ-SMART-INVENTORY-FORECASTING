import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Toaster } from 'react-hot-toast'

// Layout Components
import Navbar from './components/Layout/Navbar'
import Sidebar from './components/Layout/Sidebar'
import LoadingSpinner from './components/UI/LoadingSpinner'

// Page Components
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Upload from './pages/Upload'
import Forecast from './pages/Forecast'
import Login from './pages/Login'

// API Context
import { ApiProvider } from './context/ApiContext'

function App() {
  const { isLoaded, isSignedIn } = useAuth()

  // Show loading spinner while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isSignedIn) {
    return (
      <>
        <Login />
        <Toaster position="top-right" />
      </>
    )
  }

  // Main authenticated app
  return (
    <ApiProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex pt-20">
          <Sidebar />
          <main className="flex-1 p-6 ml-64">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/forecast" element={<Forecast />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <Toaster position="top-right" />
      </div>
    </ApiProvider>
  )
}

export default App
