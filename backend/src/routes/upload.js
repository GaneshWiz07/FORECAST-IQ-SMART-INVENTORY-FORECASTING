import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { requireAuth } from '../middleware/auth.js';
import { dbHelpers } from '../config/database.js';
import { format, isValid, parseISO } from 'date-fns';

const router = express.Router();

// Apply authentication to all upload routes
router.use(requireAuth);

// Configure multer for file uploads using memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Helper function to validate date formats
const validateDate = (dateString) => {
  // Try different date formats
  const formats = [
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'yyyy/MM/dd',
    'MM-dd-yyyy',
    'dd-MM-yyyy'
  ];
  
  let parsedDate = null;
  
  // Try ISO format first
  parsedDate = parseISO(dateString);
  if (isValid(parsedDate)) {
    return parsedDate;
  }
  
  // Try manual parsing for common formats
  for (const fmt of formats) {
    try {
      // Simple date parsing for common formats
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          // Assume MM/dd/yyyy or dd/MM/yyyy
          const month = parseInt(parts[0]);
          const day = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          
          if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            parsedDate = new Date(year, month - 1, day);
            if (isValid(parsedDate)) {
              return parsedDate;
            }
          }
        }
      } else if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          // Assume yyyy-MM-dd
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const day = parseInt(parts[2]);
          
          if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            parsedDate = new Date(year, month - 1, day);
            if (isValid(parsedDate)) {
              return parsedDate;
            }
          }
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
};

// Helper function to parse CSV data from buffer
const parseCsvData = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let rowIndex = 0;
    
    // Convert buffer to string and parse
    const csvString = buffer.toString('utf8');
    
    parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
      .on('data', (row) => {
        rowIndex++;
        
        try {
          // Expected columns: date, sku, units_sold
          const { date, sku, units_sold } = row;
          
          // Validate required fields
          if (!date || !sku || !units_sold) {
            errors.push({
              row: rowIndex,
              error: 'Missing required fields (date, sku, units_sold)',
              data: row,
            });
            return;
          }
          
          // Validate and parse date
          const parsedDate = validateDate(date);
          if (!parsedDate) {
            errors.push({
              row: rowIndex,
              error: `Invalid date format: ${date}`,
              data: row,
            });
            return;
          }
          
          // Validate SKU
          const trimmedSku = sku.trim().toUpperCase();
          if (!trimmedSku) {
            errors.push({
              row: rowIndex,
              error: 'SKU cannot be empty',
              data: row,
            });
            return;
          }
          
          // Validate units_sold
          const unitsSold = parseInt(units_sold);
          if (isNaN(unitsSold) || unitsSold < 0) {
            errors.push({
              row: rowIndex,
              error: `Invalid units_sold value: ${units_sold}`,
              data: row,
            });
            return;
          }
          
          results.push({
            date: format(parsedDate, 'yyyy-MM-dd'),
            sku: trimmedSku,
            units_sold: unitsSold,
          });
        } catch (error) {
          errors.push({
            row: rowIndex,
            error: error.message,
            data: row,
          });
        }
      })
      .on('error', (error) => {
        reject(error);
      })
      .on('end', () => {
        resolve({ data: results, errors });
      });
  });
};

// Upload CSV file endpoint
router.post('/csv', upload.single('file'), async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No file uploaded',
      });
    }
    
    const fileBuffer = req.file.buffer;
    
    try {
      // Parse CSV data from buffer
      const { data: salesData, errors: parseErrors } = await parseCsvData(fileBuffer);
      
      if (salesData.length === 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'No valid data found in CSV file',
          errors: parseErrors,
        });
      }
      
      // Insert valid data into database with user ID
      let insertedData = [];
      let insertErrors = [];
      
      if (salesData.length > 0) {
        try {
          insertedData = await dbHelpers.insertSalesData(userId, salesData);
        } catch (dbError) {
          console.error('Database insertion error:', dbError);
          insertErrors.push({
            error: 'Database insertion failed',
            message: dbError.message,
          });
        }
      }
      
      // No file cleanup needed since we're using memory storage
      
      res.json({
        success: true,
        data: {
          totalRows: salesData.length + parseErrors.length,
          validRows: salesData.length,
          insertedRows: insertedData.length,
          errors: parseErrors.length + insertErrors.length,
        },
        insertedData,
        parseErrors: parseErrors.length > 0 ? parseErrors : undefined,
        insertErrors: insertErrors.length > 0 ? insertErrors : undefined,
        message: `Successfully processed ${insertedData.length} sales records`,
      });
    } catch (parseError) {
      // No file cleanup needed since we're using memory storage
      throw parseError;
    }
  } catch (error) {
    console.error('Error processing CSV upload:', error);
    
    // No file cleanup needed since we're using memory storage
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File Too Large',
        message: 'File size exceeds the maximum allowed limit',
      });
    }
    
    if (error.message === 'Only CSV files are allowed') {
      return res.status(400).json({
        error: 'Invalid File Type',
        message: 'Only CSV files are allowed',
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process CSV file',
    });
  }
});

// Get upload history for the authenticated user
router.get('/history', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { limit = 10, offset = 0 } = req.query;
    
    const { data, error } = await dbHelpers.supabase
      .from(dbHelpers.TABLES.SALES_DATA)
      .select('date, sku, units_sold')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: data.length,
      },
    });
  } catch (error) {
    console.error('Error fetching upload history:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch upload history',
    });
  }
});

// Get sales data summary for the authenticated user
router.get('/summary', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { startDate, endDate, sku } = req.query;
    
    const salesData = await dbHelpers.getSalesData(userId, sku, startDate, endDate);
    
    // Calculate summary statistics
    const totalUnits = salesData.reduce((sum, record) => sum + record.units_sold, 0);
    const uniqueSkus = new Set(salesData.map(record => record.sku)).size;
    const dateRange = salesData.length > 0 ? {
      start: salesData[0].date,
      end: salesData[salesData.length - 1].date,
    } : null;
    
    res.json({
      success: true,
      data: {
        totalRecords: salesData.length,
        totalUnits,
        uniqueSkus,
        dateRange,
        records: salesData.slice(0, 100), // Return first 100 records
      },
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch sales data summary',
    });
  }
});

// Clear all sales data for the authenticated user
router.delete('/clear-data', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { confirm } = req.body;
    
    if (confirm !== 'DELETE_ALL_SALES_DATA') {
      return res.status(400).json({
        error: 'Confirmation Required',
        message: 'Please confirm deletion by sending {"confirm": "DELETE_ALL_SALES_DATA"}',
      });
    }
    
    const { error } = await dbHelpers.supabase
      .from(dbHelpers.TABLES.SALES_DATA)
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'All your sales data has been cleared',
    });
  } catch (error) {
    console.error('Error clearing sales data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to clear sales data',
    });
  }
});

export default router; 