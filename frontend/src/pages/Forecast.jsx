import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Calculator, 
  Calendar, 
  Package, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { useApi } from '../context/ApiContext'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

const Forecast = () => {
  const { forecastApi, inventoryApi, uploadApi } = useApi()
  
  // State management
  const [loading, setLoading] = useState(true)
  const [forecasting, setForecasting] = useState(false)
  const [forecasts, setForecasts] = useState([])
  const [selectedSku, setSelectedSku] = useState('')
  const [forecastDays, setForecastDays] = useState(30)
  const [forecastMethod, setForecastMethod] = useState('combined')
  const [skuForecast, setSkuForecast] = useState(null)
  const [inventory, setInventory] = useState([])
  const [chartData, setChartData] = useState([])
  const [salesData, setSalesData] = useState([])
  const [showSalesData, setShowSalesData] = useState(false)
  const [salesChartData, setSalesChartData] = useState([])
  const [salesDateRange, setSalesDateRange] = useState(30) // days

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true)
      const [forecastResponse, inventoryResponse] = await Promise.all([
        forecastApi.generateAll({ days: 7 }),
        inventoryApi.getAll()
      ])
      
      setForecasts(forecastResponse.data.forecasts || [])
      setInventory(inventoryResponse.data || [])
    } catch (error) {
      console.error('Error loading forecast data:', error)
      // Only show error toast if it's not an authentication error
      if (error.message !== 'User not authenticated' && !error.response?.status === 401) {
        toast.error('Failed to load forecast data')
      }
    } finally {
      setLoading(false)
    }
  }

  // Load sales data for specific SKU
  const loadSalesData = async (sku) => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - salesDateRange)
      
      const response = await uploadApi.getSummary({
        sku: sku,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      })
      
      const sales = response.data.records || []
      setSalesData(sales)
      
      // Prepare sales chart data
      const salesChart = sales.map(item => ({
        date: new Date(item.date).toLocaleDateString(),
        actual: item.units_sold,
        sku: item.sku
      }))
      setSalesChartData(salesChart)
      
    } catch (error) {
      console.error('Error loading sales data:', error)
      setSalesData([])
      setSalesChartData([])
    }
  }

  // Generate forecast for specific SKU
  const generateSkuForecast = async () => {
    if (!selectedSku) {
      toast.error('Please select a SKU')
      return
    }

    try {
      setForecasting(true)
      const response = await forecastApi.generate(selectedSku, {
        days: forecastDays,
        method: forecastMethod
      })
      
      setSkuForecast(response.data)
      
      // Prepare chart data
      const chartData = response.data.forecast.map((item, index) => ({
        date: new Date(item.date).toLocaleDateString(),
        predicted: item.predicted_demand,
        day: index + 1
      }))
      setChartData(chartData)
      
      // Load sales data for this SKU
      await loadSalesData(selectedSku)
      
      toast.success(`Forecast generated for ${selectedSku}`)
    } catch (error) {
      console.error('Error generating forecast:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred'
      const errorDetails = error.response?.data?.error || ''
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: errorMessage
      })
      toast.error(`Failed to generate forecast: ${errorMessage}`)
    } finally {
      setForecasting(false)
    }
  }

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4" />
      case 'medium': return <Package className="w-4 h-4" />
      case 'low': return <CheckCircle className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  // Export forecast data
  const exportForecast = () => {
    if (!skuForecast) {
      toast.error('No forecast data to export')
      return
    }

    const csvData = [
      ['Date', 'SKU', 'Predicted Demand', 'Method'],
      ...skuForecast.forecast.map(item => [
        item.date,
        skuForecast.sku,
        item.predicted_demand,
        skuForecast.method
      ])
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `forecast-${skuForecast.sku}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" text="Loading forecast data..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
                <h1 className="text-3xl font-bold text-gray-900">Statistical Demand Forecast</h1>
      <p className="text-gray-600">Statistical demand forecasting and reorder suggestions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadData}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          {skuForecast && (
            <button
              onClick={exportForecast}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Forecast Controls */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Forecast</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select SKU
            </label>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Choose a SKU...</option>
              {inventory.map(item => (
                <option key={item.id} value={item.sku}>
                  {item.sku} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forecast Days
            </label>
            <select
              value={forecastDays}
              onChange={(e) => setForecastDays(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Method
            </label>
            <select
              value={forecastMethod}
              onChange={(e) => setForecastMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
                              <option value="combined">Combined Statistical Methods</option>
              <option value="linear">Linear Trend</option>
              <option value="exponential">Exponential Smoothing</option>
              <option value="seasonal">Seasonal Naive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={generateSkuForecast}
              disabled={forecasting || !selectedSku}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {forecasting ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Sales Data Options */}
        {selectedSku && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center">
                                  <input
                    type="checkbox"
                    id="showSalesData"
                    checked={showSalesData}
                    onChange={(e) => {
                      setShowSalesData(e.target.checked)
                      if (e.target.checked && selectedSku) {
                        loadSalesData(selectedSku)
                      }
                    }}
                    className="mr-2"
                  />
                <label htmlFor="showSalesData" className="text-sm font-medium text-gray-700">
                  Show Historical Sales Data
                </label>
              </div>
              
              {showSalesData && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">
                    Last
                  </label>
                  <select
                    value={salesDateRange}
                    onChange={(e) => {
                      setSalesDateRange(Number(e.target.value))
                      if (selectedSku) loadSalesData(selectedSku)
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                  <span className="text-sm text-gray-600">of sales data</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sales Data Chart */}
      {showSalesData && salesChartData.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Sales History: {selectedSku}
              </h3>
              <p className="text-sm text-gray-600">
                Last {salesDateRange} days of sales data
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600">Total Sales:</span>
              <span className="font-semibold text-green-600">
                {salesData.reduce((sum, item) => sum + (item.units_sold || 0), 0)} units
              </span>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#059669" 
                  strokeWidth={2}
                  name="Actual Sales"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Sales Data Table */}
          {salesData.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Sales Data Records</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Units Sold
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesData.slice(0, 10).map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.units_sold}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {salesData.length > 10 && (
                  <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                    Showing first 10 of {salesData.length} records
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Forecast Chart */}
      {skuForecast && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Forecast: {skuForecast.sku}
              </h3>
              <p className="text-sm text-gray-600">
                Method: {skuForecast.method} | Generated: {new Date(skuForecast.generated_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600">Total Predicted:</span>
              <span className="font-semibold text-primary-600">
                {skuForecast.forecast.reduce((sum, item) => sum + item.predicted_demand, 0)} units
              </span>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  name="Predicted Demand"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Sales vs Forecast Comparison */}
          {showSalesData && salesChartData.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Sales vs Forecast Comparison</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-600">Avg Daily Sales (Historical)</p>
                  <p className="text-lg font-semibold text-green-600">
                    {salesData.length > 0 ? 
                      Math.round(salesData.reduce((sum, item) => sum + (item.units_sold || 0), 0) / salesData.length) : 0
                    } units
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Avg Daily Forecast</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {skuForecast.forecast.length > 0 ? 
                      Math.round(skuForecast.forecast.reduce((sum, item) => sum + item.predicted_demand, 0) / skuForecast.forecast.length) : 0
                    } units
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Forecast Accuracy</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {salesData.length > 0 && skuForecast.forecast.length > 0 ? 
                      Math.round((1 - Math.abs(
                        (salesData.reduce((sum, item) => sum + (item.units_sold || 0), 0) / salesData.length) - 
                        (skuForecast.forecast.reduce((sum, item) => sum + item.predicted_demand, 0) / skuForecast.forecast.length)
                      ) / (salesData.reduce((sum, item) => sum + (item.units_sold || 0), 0) / salesData.length)) * 100) : 0
                    }%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Individual SKU Reorder Suggestion */}
      {skuForecast && skuForecast.reorderSuggestion && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reorder Suggestion for {skuForecast.sku}
          </h3>
          
          {skuForecast.reorderSuggestion.needed ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-2">Reorder Required</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-red-700 font-medium">Current Stock</p>
                      <p className="text-red-900 text-lg font-bold">
                        {skuForecast.reorderSuggestion.currentStock} units
                      </p>
                    </div>
                    <div>
                      <p className="text-red-700 font-medium">Predicted Demand</p>
                      <p className="text-red-900 text-lg font-bold">
                        {skuForecast.reorderSuggestion.predictedDemand} units
                      </p>
                    </div>
                    <div>
                      <p className="text-red-700 font-medium">Suggested Reorder</p>
                      <p className="text-red-900 text-lg font-bold">
                        {skuForecast.reorderSuggestion.suggestedQuantity} units
                      </p>
                    </div>
                    <div>
                      <p className="text-red-700 font-medium">Days Until Stockout</p>
                      <p className="text-red-900 text-lg font-bold">
                        {skuForecast.reorderSuggestion.daysUntilStockout} days
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      skuForecast.reorderSuggestion.priority === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {skuForecast.reorderSuggestion.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-2">Stock Levels Adequate</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-green-700 font-medium">Current Stock</p>
                      <p className="text-green-900 text-lg font-bold">
                        {skuForecast.reorderSuggestion.currentStock} units
                      </p>
                    </div>
                    <div>
                      <p className="text-green-700 font-medium">Predicted Demand</p>
                      <p className="text-green-900 text-lg font-bold">
                        {skuForecast.reorderSuggestion.predictedDemand} units
                      </p>
                    </div>
                    <div>
                      <p className="text-green-700 font-medium">Days of Stock</p>
                      <p className="text-green-900 text-lg font-bold">
                        {skuForecast.reorderSuggestion.daysOfStock} days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Statistical Insights for Selected SKU */}
      {skuForecast && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Statistical Insights for {skuForecast.sku}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Demand Analysis</h4>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• <strong>Total Predicted Demand:</strong> {skuForecast.summary?.totalPredictedDemand || 0} units</li>
                  <li>• <strong>Average Daily Demand:</strong> {skuForecast.summary?.averageDailyDemand || 0} units</li>
                  <li>• <strong>Historical Average:</strong> {skuForecast.historical?.averageDailyDemand || 0} units/day</li>
                  <li>• <strong>Demand Trend:</strong> {
                    skuForecast.summary?.averageDailyDemand > skuForecast.historical?.averageDailyDemand 
                      ? 'Increasing ↗️' 
                      : skuForecast.summary?.averageDailyDemand < skuForecast.historical?.averageDailyDemand
                      ? 'Decreasing ↘️'
                      : 'Stable ➡️'
                  }</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">Forecast Quality</h4>
                <ul className="text-sm text-purple-800 space-y-2">
                  <li>• <strong>Method Used:</strong> {skuForecast.method}</li>
                  <li>• <strong>Historical Data Points:</strong> {skuForecast.historical?.totalRecords || 0}</li>
                  <li>• <strong>Forecast Period:</strong> {skuForecast.forecastPeriod?.days || 0} days</li>
                  <li>• <strong>Data Quality:</strong> {
                    skuForecast.historical?.totalRecords > 30 ? 'Excellent' :
                    skuForecast.historical?.totalRecords > 14 ? 'Good' :
                    skuForecast.historical?.totalRecords > 7 ? 'Fair' : 'Limited'
                  }</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              {skuForecast.summary?.peakDay && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">Peak Demand Alert</h4>
                  <div className="text-sm text-orange-800 space-y-2">
                    <p>• <strong>Peak Day:</strong> {new Date(skuForecast.summary.peakDay.date).toLocaleDateString()}</p>
                    <p>• <strong>Expected Demand:</strong> {skuForecast.summary.peakDay.predicted_demand} units</p>
                    <p>• <strong>Recommendation:</strong> Ensure adequate stock before peak demand</p>
                  </div>
                </div>
              )}
              
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Recommendations</h4>
                <ul className="text-sm text-green-800 space-y-2">
                  {skuForecast.reorderSuggestion?.needed ? (
                    <>
                      <li>• Immediate reorder required</li>
                      <li>• Consider expedited shipping</li>
                      <li>• Monitor daily sales closely</li>
                    </>
                  ) : (
                    <>
                      <li>• Current stock levels adequate</li>
                      <li>• Regular monitoring sufficient</li>
                      <li>• Plan next reorder in advance</li>
                    </>
                  )}
                  <li>• Review forecast accuracy after {Math.floor(skuForecast.forecastPeriod?.days / 2)} days</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Method Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistical Forecasting Methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Combined Statistical Methods</h4>
            <p className="text-sm text-gray-600">
              Advanced statistical forecasting using multiple algorithms including linear regression, exponential smoothing, and seasonal patterns. Recommended for most use cases.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Linear Trend</h4>
            <p className="text-sm text-gray-600">
              Best for products with consistent growth or decline patterns.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Exponential Smoothing</h4>
            <p className="text-sm text-gray-600">
              Ideal for products with recent data being more important than historical.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Seasonal Naive</h4>
            <p className="text-sm text-gray-600">
              Perfect for products with strong seasonal or cyclical patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Forecast 