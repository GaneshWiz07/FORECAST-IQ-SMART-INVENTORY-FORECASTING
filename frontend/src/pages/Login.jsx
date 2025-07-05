import React from 'react'
import { SignIn } from '@clerk/clerk-react'
import { BarChart3, Package, TrendingUp, Upload, Brain } from 'lucide-react'

const Login = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Left side - Branding and Features */}
        <div className="bg-primary-600 text-white p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md">
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-white/20 p-3 rounded-lg relative">
                <div className="relative">
                  <TrendingUp className="w-8 h-8" />
                  <Brain className="w-4 h-4 absolute -top-1 -right-1 opacity-90" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold">ForecastIQ</h1>
                <p className="text-primary-100">Smart Inventory Forecasting</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold mb-4">
              Smart Inventory Management with AI-Powered Forecasting
            </h2>
            
            <p className="text-primary-100 mb-8">
              Transform your inventory management with intelligent demand forecasting, 
              automated reorder alerts, and real-time analytics.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span>AI-powered demand forecasting</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded">
                  <Package className="w-5 h-5" />
                </div>
                <span>Smart reorder alerts</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded">
                  <Upload className="w-5 h-5" />
                </div>
                <span>Easy CSV data upload</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span>Real-time analytics dashboard</span>
              </div>
            </div>
            

          </div>
        </div>
        
        {/* Right side - Sign In Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h3>
              <p className="text-gray-600">
                Sign in to access your inventory dashboard
              </p>
            </div>
            
            <div className="flex justify-center">
              <SignIn 
                appearance={{
                  elements: {
                    formButtonPrimary: 
                      'bg-primary-600 hover:bg-primary-700 text-sm normal-case',
                    card: 'shadow-none',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                    socialButtonsIconButton: 
                      'border-gray-200 hover:border-gray-300',
                    formFieldInput: 
                      'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
                    footerActionLink: 'text-primary-600 hover:text-primary-700',
                    footer: 'hidden',
                    footerAction: 'hidden',
                    footerActionText: 'hidden'
                  }
                }}
                redirectUrl="/"
                signUpUrl="/sign-up"
              />
            </div>
            

          </div>
        </div>
      </div>
    </div>
  )
}

export default Login 