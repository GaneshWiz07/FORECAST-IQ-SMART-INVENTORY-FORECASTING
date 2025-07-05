import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { dbHelpers } from '../config/database.js';

const router = express.Router();

// Apply authentication to all inventory routes
router.use(requireAuth);

// Get all inventory items for the authenticated user
router.get('/', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const inventory = await dbHelpers.getInventory(userId);
    
    res.json({
      success: true,
      data: inventory,
      count: inventory.length,
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch inventory items',
    });
  }
});

// Get inventory statistics for dashboard for the authenticated user
router.get('/stats', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const stats = await dbHelpers.getInventoryStats(userId);
    const lowStockItems = await dbHelpers.getLowStockItems(userId);
    
    res.json({
      success: true,
      data: {
        ...stats,
        lowStockItems: lowStockItems.slice(0, 5), // Return top 5 low stock items
      },
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch inventory statistics',
    });
  }
});

// Get low stock items for the authenticated user
router.get('/low-stock', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const lowStockItems = await dbHelpers.getLowStockItems(userId);
    
    res.json({
      success: true,
      data: lowStockItems,
      count: lowStockItems.length,
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch low stock items',
    });
  }
});

// Get inventory item by ID for the authenticated user
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid inventory ID is required',
      });
    }
    
    const { data, error } = await dbHelpers.supabase
      .from(dbHelpers.TABLES.INVENTORY)
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Inventory item not found',
        });
      }
      throw error;
    }
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch inventory item',
    });
  }
});

// Get inventory item by SKU for the authenticated user
router.get('/sku/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const userId = req.auth.userId;
    
    if (!sku) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'SKU is required',
      });
    }
    
    const item = await dbHelpers.getInventoryBySku(userId, sku);
    
    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Inventory item with this SKU not found',
      });
    }
    
    console.error('Error fetching inventory item by SKU:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch inventory item',
    });
  }
});

// Create new inventory item for the authenticated user
router.post('/', async (req, res) => {
  try {
    const { name, sku, quantity, reorder_level } = req.body;
    const userId = req.auth.userId;
    
    // Validation
    if (!name || !sku || quantity === undefined || reorder_level === undefined) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, SKU, quantity, and reorder level are required',
      });
    }
    
    if (quantity < 0 || reorder_level < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Quantity and reorder level must be non-negative',
      });
    }
    
    const newItem = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      quantity: parseInt(quantity),
      reorder_level: parseInt(reorder_level),
    };
    
    const createdItem = await dbHelpers.createInventory(userId, newItem);
    
    res.status(201).json({
      success: true,
      data: createdItem,
      message: 'Inventory item created successfully',
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        error: 'Conflict',
        message: 'An item with this SKU already exists in your inventory',
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create inventory item',
    });
  }
});

// Update inventory item for the authenticated user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, quantity, reorder_level } = req.body;
    const userId = req.auth.userId;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid inventory ID is required',
      });
    }
    
    // Validation
    if (!name || !sku || quantity === undefined || reorder_level === undefined) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, SKU, quantity, and reorder level are required',
      });
    }
    
    if (quantity < 0 || reorder_level < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Quantity and reorder level must be non-negative',
      });
    }
    
    const updates = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      quantity: parseInt(quantity),
      reorder_level: parseInt(reorder_level),
    };
    
    const updatedItem = await dbHelpers.updateInventory(userId, id, updates);
    
    res.json({
      success: true,
      data: updatedItem,
      message: 'Inventory item updated successfully',
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        error: 'Conflict',
        message: 'An item with this SKU already exists in your inventory',
      });
    }
    
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Inventory item not found',
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update inventory item',
    });
  }
});

// Delete inventory item for the authenticated user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid inventory ID is required',
      });
    }
    
    await dbHelpers.deleteInventory(userId, id);
    
    res.json({
      success: true,
      message: 'Inventory item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Inventory item not found',
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete inventory item',
    });
  }
});

// Bulk update quantities (for reorder operations)
router.post('/bulk-update', async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Updates array is required and must not be empty',
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const update of updates) {
      try {
        const { id, quantity } = update;
        
        if (!id || quantity === undefined || quantity < 0) {
          errors.push({
            id,
            error: 'Invalid ID or quantity',
          });
          continue;
        }
        
        const updatedItem = await dbHelpers.updateInventory(id, { 
          quantity: parseInt(quantity) 
        });
        results.push(updatedItem);
      } catch (error) {
        errors.push({
          id: update.id,
          error: error.message,
        });
      }
    }
    
    res.json({
      success: true,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully updated ${results.length} items${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to perform bulk update',
    });
  }
});

export default router; 