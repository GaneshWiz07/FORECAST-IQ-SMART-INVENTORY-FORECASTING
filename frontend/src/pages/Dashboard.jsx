import React, { useState, useEffect } from 'react'
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react'
import { useApi } from '../context/ApiContext'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { inventoryApi, forecastApi } = useApi()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalItems: 0,
      lowStockCount: 0,
      lowStockItems: []
    },
    forecasts: {
      quickForecasts: [],
      totalPredictedDemand: 0,
      trendingSKUs: []
    }
  })
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load inventory stats and forecast summary in parallel
      const [inventoryStats, forecastSummary] = await Promise.all([
        inventoryApi.getStats(),
        forecastApi.getDashboardSummary({ days: 7 })
      ])

      // Calculate total predicted demand from quick forecasts
      const totalPredictedDemand = forecastSummary.data?.quickForecasts?.reduce(
        (sum, forecast) => sum + (forecast.predictedDemand || 0), 0
      ) || 0

      // Get forecast accuracy and trends from real API data
      const forecastAccuracy = forecastSummary.data?.accuracy || 0
      const demandTrend = forecastSummary.data?.demandTrend || 0
      const accuracyTrend = forecastSummary.data?.accuracyTrend || 0

      setDashboardData({
        stats: {
          totalItems: inventoryStats.data?.totalItems || 0,
          lowStockCount: forecastSummary.data?.lowStockCount || inventoryStats.data?.lowStockCount || 0,
          lowStockItems: forecastSummary.data?.lowStockItems || []
        },
        forecasts: {
          quickForecasts: forecastSummary.data?.quickForecasts || [],
          totalPredictedDemand,
          trendingSKUs: forecastSummary.data?.trendingSKUs || [],
          accuracy: forecastAccuracy,
          demandTrend,
          accuracyTrend
        }
      })

      // Generate sample chart data for demo (you can replace this with real data later)
      const sampleChartData = [
        { date: '2024-06-01', actual: 120, predicted: 115 },
        { date: '2024-06-02', actual: 132, predicted: 128 },
        { date: '2024-06-03', actual: 101, predicted: 105 },
        { date: '2024-06-04', actual: 134, predicted: 131 },
        { date: '2024-06-05', actual: 90, predicted: 95 },
        { date: '2024-06-06', actual: 160, predicted: 155 },
        { date: '2024-06-07', actual: 145, predicted: 148 }
      ]
      setChartData(sampleChartData)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Only show error toast if it's not an authentication error
      if (error.message !== 'User not authenticated' && !error.response?.status === 401) {
        toast.error('Failed to load dashboard data')
      }
      
      // Set safe default values on error
      setDashboardData({
        stats: {
          totalItems: 0,
          lowStockCount: 0,
          lowStockItems: []
        },
        forecasts: {
          quickForecasts: [],
          totalPredictedDemand: 0,
          trendingSKUs: [],
          accuracy: 0,
          demandTrend: 0,
          accuracyTrend: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'primary' }) => {
    const colorClasses = {
      primary: 'bg-primary-50 text-primary-600',
      success: 'bg-success-50 text-success-600',
      warning: 'bg-warning-50 text-warning-600',
      danger: 'bg-danger-50 text-danger-600'
    }

    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-gray-900">{value || 0}</p>
              {trend && (
                <div className={`flex items-center text-sm ${
                  trend.direction === 'up' ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {trend.direction === 'up' ? 
                    <ArrowUpRight className="w-4 h-4" /> : 
                    <ArrowDownRight className="w-4 h-4" />
                  }
                  <span className="ml-1">{trend.value}</span>
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your statistical inventory overview</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="btn-primary flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total SKUs"
          value={dashboardData.stats.totalItems}
          subtitle="Active products"
          icon={Package}
          color="primary"
        />
        
        <StatCard
          title="Low Stock Items"
          value={dashboardData.stats.lowStockCount}
          subtitle="Need reordering"
          icon={AlertTriangle}
          color="warning"
        />
        
        <StatCard
          title="7-Day Forecast"
          value={dashboardData.forecasts.totalPredictedDemand}
          subtitle="Predicted demand"
          icon={TrendingUp}
          trend={{
            direction: dashboardData.forecasts.demandTrend >= 0 ? 'up' : 'down',
            value: `${dashboardData.forecasts.demandTrend >= 0 ? '+' : ''}${dashboardData.forecasts.demandTrend}%`
          }}
          color="success"
        />
        
        <StatCard
          title="Forecast Accuracy"
          value={`${dashboardData.forecasts.accuracy}%`}
          subtitle="Last 30 days"
          icon={DollarSign}
          trend={{
            direction: dashboardData.forecasts.accuracyTrend >= 0 ? 'up' : 'down',
            value: `${dashboardData.forecasts.accuracyTrend >= 0 ? '+' : ''}${dashboardData.forecasts.accuracyTrend}%`
          }}
          color="primary"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demand Forecast Chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Demand Forecast</h3>
            <p className="text-sm text-gray-600">Actual vs Predicted sales</p>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  name="Actual Sales"
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Statistical Prediction"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top SKUs Chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top SKUs by Demand</h3>
            <p className="text-sm text-gray-600">Next 7 days forecast</p>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dashboardData.forecasts.quickForecasts?.map((item) => ({
                  sku: item.sku,
                  predicted: item.predictedDemand || 0,
                  historical: item.totalSales || 0
                })) || []}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sku" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="predicted" fill="#2563eb" name="Predicted" />
                <Bar dataKey="historical" fill="#16a34a" name="Historical" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
            <p className="text-sm text-gray-600">Items requiring immediate attention</p>
          </div>
          <span className="px-3 py-1 bg-danger-100 text-danger-800 text-sm font-medium rounded-full">
            {dashboardData.stats.lowStockCount} items
          </span>
        </div>
        
        {dashboardData.stats.lowStockItems && dashboardData.stats.lowStockItems.length > 0 ? (
          <div className="space-y-3">
            {dashboardData.stats.lowStockItems.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">
                    {item.quantity} / {item.reorder_level} units
                  </p>
                  <p className="text-xs text-gray-500">Current / Reorder Level</p>
                </div>
                <button className="ml-4 btn-danger">
                  Reorder
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">All items are well stocked!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard 