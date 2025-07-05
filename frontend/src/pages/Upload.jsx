import React, { useState, useRef } from 'react'
import { 
  Upload as UploadIcon, 
  File, 
  CheckCircle, 
  AlertTriangle, 
  X,
  Download,
  History,
  RefreshCw,
  FileText
} from 'lucide-react'
import { useApi } from '../context/ApiContext'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

const Upload = () => {
  const { uploadApi } = useApi()
  const fileInputRef = useRef(null)
  
  // State management
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [uploadHistory, setUploadHistory] = useState([])

  // File validation
  const validateFile = (file) => {
    if (!file) return { valid: false, error: 'No file selected' }
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return { valid: false, error: 'Please select a CSV file' }
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return { valid: false, error: 'File size must be less than 5MB' }
    }
    
    return { valid: true }
  }

  // Handle file selection
  const handleFileSelect = (file) => {
    const validation = validateFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }
    
    setSelectedFile(file)
    setUploadResult(null)
  }

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  // Upload file
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }

    try {
      setUploading(true)
      const result = await uploadApi.uploadCsv(selectedFile)
      setUploadResult(result)
      
      if (result.success) {
        toast.success(`Successfully processed ${result.data.insertedRows} records`)
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        toast.error('Upload completed with errors')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file')
      setUploadResult({
        success: false,
        error: error.response?.data?.message || 'Upload failed'
      })
    } finally {
      setUploading(false)
    }
  }

  // Load upload history
  const loadUploadHistory = async () => {
    try {
      const response = await uploadApi.getHistory({ limit: 10 })
      setUploadHistory(response.data)
      setShowHistory(true)
    } catch (error) {
      console.error('Error loading history:', error)
      toast.error('Failed to load upload history')
    }
  }

  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null)
    setUploadResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Download sample CSV
  const downloadSampleCsv = () => {
    const sampleData = [
      ['date', 'sku', 'units_sold'],
      ['2024-01-01', 'WBH-001', '15'],
      ['2024-01-01', 'USBC-002', '23'],
      ['2024-01-02', 'WBH-001', '18'],
      ['2024-01-02', 'SC-IPH14', '7']
    ]
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sample-sales-data.csv'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Sales Data</h1>
          <p className="text-gray-600">Import your sales data from CSV files</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={downloadSampleCsv}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Sample CSV</span>
          </button>
          <button
            onClick={loadUploadHistory}
            className="btn-secondary flex items-center space-x-2"
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Upload Instructions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">CSV Format Requirements</h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 mb-2">Your CSV file must include these columns:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><strong>date</strong> - Date in YYYY-MM-DD format (e.g., 2024-01-15)</li>
            <li><strong>sku</strong> - Product SKU code (e.g., WBH-001)</li>
            <li><strong>units_sold</strong> - Number of units sold (positive integer)</li>
          </ul>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FileText className="w-4 h-4" />
          <span>Maximum file size: 5MB | Supported format: CSV</span>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="card">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          {!selectedFile ? (
            <div>
              <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your CSV file here, or click to browse
              </p>
              <p className="text-sm text-gray-600">
                Supports CSV files up to 5MB
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-4">
              <File className="w-8 h-8 text-primary-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={clearSelectedFile}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadIcon className="w-4 h-4" />
                  <span>Upload File</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className="card">
          <div className="flex items-start space-x-3">
            {uploadResult.success ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold ${uploadResult.success ? 'text-green-900' : 'text-red-900'}`}>
                {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
              </h3>
              
              {uploadResult.success && uploadResult.data && (
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Rows:</span>
                      <span className="ml-1 font-medium">{uploadResult.data.totalRows}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Valid Rows:</span>
                      <span className="ml-1 font-medium text-green-600">{uploadResult.data.validRows}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Inserted:</span>
                      <span className="ml-1 font-medium text-blue-600">{uploadResult.data.insertedRows}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Errors:</span>
                      <span className="ml-1 font-medium text-red-600">{uploadResult.data.errors}</span>
                    </div>
                  </div>
                  
                  {uploadResult.parseErrors && uploadResult.parseErrors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Validation Errors:</h4>
                      <div className="bg-red-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                        {uploadResult.parseErrors.slice(0, 5).map((error, index) => (
                          <div key={index} className="text-sm text-red-700 mb-1">
                            Row {error.row}: {error.error}
                          </div>
                        ))}
                        {uploadResult.parseErrors.length > 5 && (
                          <div className="text-sm text-red-600 font-medium">
                            ... and {uploadResult.parseErrors.length - 5} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!uploadResult.success && (
                <p className="mt-1 text-sm text-red-700">
                  {uploadResult.error || 'An error occurred during upload'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Sales Data</h3>
              <button 
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {uploadHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units Sold</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {uploadHistory.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.units_sold}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No sales data found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Upload 