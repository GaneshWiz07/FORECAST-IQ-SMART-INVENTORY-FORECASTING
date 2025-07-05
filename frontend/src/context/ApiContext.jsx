import React, { createContext, useContext, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const ApiContext = createContext(null)

// Base API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const ApiProvider = ({ children }) => {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  // Create axios instance with interceptors
  const createApiClient = useCallback(async () => {
    try {
      // Add retry logic for token retrieval
      let token = null
      let retries = 2
      
      while (retries > 0 && !token) {
        try {
          token = await getToken()
          break
        } catch (tokenError) {
          console.log(`Token retrieval attempt ${3 - retries} failed:`, tokenError)
          retries--
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 500)) // Wait 500ms before retry
          }
        }
      }
      
      const client = axios.create({
        baseURL: `${API_BASE_URL}/api`,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      // Response interceptor for error handling
      client.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            // Don't show toast for 401 errors on page refresh - let Clerk handle it
            console.log('Authentication required - redirecting to login')
          } else if (error.response?.status >= 500) {
            toast.error('Server error. Please try again later.')
          } else if (error.response?.data?.message) {
            toast.error(error.response.data.message)
          } else if (error.message !== 'Network Error') {
            toast.error('An unexpected error occurred.')
          }
          return Promise.reject(error)
        }
      )

      return client
    } catch (error) {
      console.error('Error creating API client:', error)
      throw error
    }
  }, [getToken])

  // Generic API call function
  const apiCall = useCallback(async (method, url, data = null, config = {}) => {
    // Check if user is authenticated before making API calls
    if (!isSignedIn) {
      throw new Error('User not authenticated')
    }

    try {
      const client = await createApiClient()
      const response = await client.request({
        method,
        url,
        data,
        ...config,
      })
      return response.data
    } catch (error) {
      throw error
    }
  }, [createApiClient, isSignedIn])

  // Inventory API functions
  const inventoryApi = {
    // Get all inventory items
    getAll: () => apiCall('GET', '/inventory'),
    
    // Get inventory statistics
    getStats: () => apiCall('GET', '/inventory/stats'),
    
    // Get low stock items
    getLowStock: () => apiCall('GET', '/inventory/low-stock'),
    
    // Get inventory item by ID
    getById: (id) => apiCall('GET', `/inventory/${id}`),
    
    // Get inventory item by SKU
    getBySku: (sku) => apiCall('GET', `/inventory/sku/${sku}`),
    
    // Create new inventory item
    create: (item) => apiCall('POST', '/inventory', item),
    
    // Update inventory item
    update: (id, updates) => apiCall('PUT', `/inventory/${id}`, updates),
    
    // Delete inventory item
    delete: (id) => apiCall('DELETE', `/inventory/${id}`),
    
    // Bulk update quantities
    bulkUpdate: (updates) => apiCall('POST', '/inventory/bulk-update', { updates }),
  }

  // Upload API functions
  const uploadApi = {
    // Upload CSV file
    uploadCsv: async (file) => {
      const client = await createApiClient()
      const formData = new FormData()
      formData.append('file', file)
      
      return client.post('/upload/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }).then(response => response.data)
    },
    
    // Get upload history
    getHistory: (params = {}) => apiCall('GET', '/upload/history', null, { params }),
    
    // Get sales data summary
    getSummary: (params = {}) => apiCall('GET', '/upload/summary', null, { params }),
    
    // Clear all sales data
    clearData: () => apiCall('DELETE', '/upload/clear-data', { confirm: 'DELETE_ALL_SALES_DATA' }),
  }

  // Forecast API functions
  const forecastApi = {
    // Generate forecast for specific SKU
    generate: (sku, options = {}) => apiCall('POST', `/forecast/generate/${sku}`, options),
    
    // Generate forecasts for all SKUs
    generateAll: (options = {}) => apiCall('POST', '/forecast/generate-all', options),
    
    // Get saved forecasts for SKU
    getBySku: (sku, params = {}) => apiCall('GET', `/forecast/${sku}`, null, { params }),
    
    // Get dashboard summary
    getDashboardSummary: (params = {}) => apiCall('GET', '/forecast/dashboard/summary', null, { params }),
    
    // Health check
    healthCheck: () => apiCall('GET', '/forecast/health'),
  }

  // Auth API functions
  const authApi = {
    // Get current user info
    getMe: () => apiCall('GET', '/auth/me'),
    
    // Verify token
    verify: () => apiCall('POST', '/auth/verify'),
    
    // Get session info
    getSession: () => apiCall('GET', '/auth/session'),
    
    // Health check
    healthCheck: () => apiCall('GET', '/auth/health'),
  }

  // Generic health check
  const healthCheck = () => apiCall('GET', '/health')

  const value = {
    // API clients
    inventoryApi,
    uploadApi,
    forecastApi,
    authApi,
    
    // Generic functions
    apiCall,
    healthCheck,
    
    // Utilities
    API_BASE_URL,
  }

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  )
}

// Custom hook to use the API context
export const useApi = () => {
  const context = useContext(ApiContext)
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider')
  }
  return context
}

export default ApiContext 