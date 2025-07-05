import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  Upload, 
  TrendingUp
} from 'lucide-react'
import { useApi } from '../../context/ApiContext'

const Sidebar = () => {
  const { inventoryApi, forecastApi } = useApi()
  const [stats, setStats] = useState({
    totalSkus: '--',
    lowStock: '--',
    reorderAlerts: '--',
    loading: true
  })
  const navItems = [
    {
      path: '/',
      icon: LayoutDashboard,
      label: 'Dashboard',
      description: 'Overview & KPIs'
    },
    {
      path: '/inventory',
      icon: Package,
      label: 'Inventory',
      description: 'Manage products'
    },
    {
      path: '/upload',
      icon: Upload,
      label: 'Upload Data',
      description: 'Import sales CSV'
    },
    {
      path: '/forecast',
      icon: TrendingUp,
      label: 'Forecast',
      description: 'Demand predictions'
    }
  ]

  // Load quick stats
  const loadQuickStats = async () => {
    try {
      // Get inventory stats (this is the primary data we need)
      const inventoryStats = await inventoryApi.getStats().catch(() => ({ 
        data: { totalItems: 0, lowStockCount: 0 } 
      }))

      // For reorder alerts, use low stock count as a simple fallback
      // since the forecast dashboard might not have the priority data we expect
      const totalSkus = inventoryStats?.data?.totalItems || 0
      const lowStock = inventoryStats?.data?.lowStockCount || 0
      
      // Use low stock count as reorder alerts (items below reorder level need attention)
      const reorderAlerts = lowStock

      setStats({
        totalSkus: totalSkus,
        lowStock: lowStock,
        reorderAlerts: reorderAlerts,
        loading: false
      })
    } catch (error) {
      console.error('Error loading sidebar stats:', error)
      setStats({
        totalSkus: 0,
        lowStock: 0,
        reorderAlerts: 0,
        loading: false
      })
    }
  }

  // Load stats on mount and set up interval for updates
  useEffect(() => {
    loadQuickStats()
    
    // Refresh stats every 5 minutes
    const interval = setInterval(loadQuickStats, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const NavItem = ({ path, icon: Icon, label, description, isActive }) => (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `group flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon 
            className={`w-5 h-5 mr-3 transition-colors ${
              isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
            }`} 
          />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              isActive ? 'text-white' : 'text-gray-900'
            }`}>
              {label}
            </p>
            <p className={`text-xs ${
              isActive ? 'text-primary-100' : 'text-gray-500'
            }`}>
              {description}
            </p>
          </div>
        </>
      )}
    </NavLink>
  )

  return (
    <div className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-white border-r border-gray-200 z-40">
      <div className="flex flex-col h-full">
        {/* Main Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Main Menu
            </h2>
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavItem key={item.path} {...item} />
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4 mt-6">
            <h3 className="text-sm font-semibold text-primary-900 mb-2">
              Quick Stats
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-primary-700">Total SKUs</span>
                <span className="font-medium text-primary-900">
                  {stats.loading ? '...' : stats.totalSkus}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-primary-700">Low Stock</span>
                <span className={`font-medium ${stats.lowStock > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.loading ? '...' : stats.lowStock}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-primary-700">Reorder Alerts</span>
                <span className={`font-medium ${stats.reorderAlerts > 0 ? 'text-warning-600' : 'text-green-600'}`}>
                  {stats.loading ? '...' : stats.reorderAlerts}
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Version Info */}
        <div className="px-4 pb-4">
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Version 1.0.0
            </p>
            <p className="text-xs text-gray-400">
              Statistical Inventory System
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar 