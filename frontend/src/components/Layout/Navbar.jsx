import React from 'react'
import { UserButton, useUser } from '@clerk/clerk-react'
import { TrendingUp, Brain } from 'lucide-react'

const Navbar = () => {
  const { user } = useUser()

  return (
    <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg relative">
              <div className="relative">
                <TrendingUp className="w-6 h-6 text-white" />
                <Brain className="w-3 h-3 text-white absolute -top-1 -right-1 opacity-80" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ForecastIQ</h1>
              <p className="text-xs text-gray-500">Smart Inventory Forecasting</p>
            </div>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-4">
            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
              
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: 'w-10 h-10',
                  }
                }}
                afterSignOutUrl="/login"
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 