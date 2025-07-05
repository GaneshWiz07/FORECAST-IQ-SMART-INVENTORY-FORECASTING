import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Create Supabase client with service role key for backend operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database table names
export const TABLES = {
  INVENTORY: 'inventory',
  SALES_DATA: 'sales_data',
  FORECASTS: 'forecasts',
  USERS: 'users', // Optional: for storing additional user data
};

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.INVENTORY)
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection test failed:', error.message);
      
      // Check if it's a table not found error
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.error('💡 It looks like the database tables don\'t exist yet.');
        console.error('💡 Please run the SQL schema from backend/database-schema.sql in your Supabase dashboard.');
      }
      
      return false;
    }
    
    console.log('✅ Database connection successful');
    console.log(`📊 Found ${data?.length || 0} records in inventory table`);
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
};

// Helper functions for common database operations
export const dbHelpers = {
  // Add reference to supabase client for direct queries
  supabase,
  TABLES,

  // Get all inventory items for a specific user
  async getInventory(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const { data, error } = await supabase
      .from(TABLES.INVENTORY)
      .select('*')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get inventory item by SKU for a specific user
  async getInventoryBySku(userId, sku) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const { data, error } = await supabase
      .from(TABLES.INVENTORY)
      .select('*')
      .eq('user_id', userId)
      .eq('sku', sku)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update inventory item for a specific user
  async updateInventory(userId, id, updates) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const { data, error } = await supabase
      .from(TABLES.INVENTORY)
      .update({ ...updates, last_updated: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create inventory item for a specific user
  async createInventory(userId, item) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const { data, error } = await supabase
      .from(TABLES.INVENTORY)
      .insert([{ 
        ...item, 
        user_id: userId,
        last_updated: new Date().toISOString() 
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete inventory item for a specific user
  async deleteInventory(userId, id) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const { error } = await supabase
      .from(TABLES.INVENTORY)
      .delete()
      .eq('user_id', userId)
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Get sales data for a specific user
  async getSalesData(userId, sku = null, startDate = null, endDate = null) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    let query = supabase
      .from(TABLES.SALES_DATA)
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    
    if (sku) {
      query = query.eq('sku', sku);
    }
    
    if (startDate) {
      query = query.gte('date', startDate);
    }
    
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Insert sales data for a specific user (bulk)
  async insertSalesData(userId, salesData) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Add user_id to each sales record
    const salesDataWithUserId = salesData.map(record => ({
      ...record,
      user_id: userId
    }));
    
    const { data, error } = await supabase
      .from(TABLES.SALES_DATA)
      .insert(salesDataWithUserId)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Get forecasts for a specific user
  async getForecast(userId, sku) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const { data, error } = await supabase
      .from(TABLES.FORECASTS)
      .select('*')
      .eq('user_id', userId)
      .eq('sku', sku)
      .order('forecast_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Save forecast for a specific user
  async saveForecast(userId, forecastData) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Add user_id to forecast data
    const forecastWithUserId = Array.isArray(forecastData) 
      ? forecastData.map(record => ({ ...record, user_id: userId }))
      : { ...forecastData, user_id: userId };
    
    const { data, error } = await supabase
      .from(TABLES.FORECASTS)
      .upsert(forecastWithUserId, { 
        onConflict: 'user_id,sku,predicted_date',
        ignoreDuplicates: false 
      })
      .select();
    
    if (error) throw error;
    return data;
  },

  // Get low stock items for a specific user
  async getLowStockItems(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const { data, error } = await supabase
      .from(TABLES.INVENTORY)
      .select('*')
      .eq('user_id', userId)
      .order('quantity', { ascending: true });
    
    if (error) throw error;
    
    // Filter in JavaScript since Supabase doesn't support column comparison
    return data.filter(item => item.quantity <= item.reorder_level);
  },

  // Get inventory statistics for a specific user
  async getInventoryStats(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    try {
      const { data: totalItems, error: totalError } = await supabase
        .from(TABLES.INVENTORY)
        .select('id')
        .eq('user_id', userId);
      
      if (totalError) {
        console.error('Error getting total items:', totalError);
        throw new Error(`Failed to get total items: ${totalError.message}`);
      }
      
      // Get all inventory items and filter in JavaScript (temporary fix)
      const { data: allItems, error: allItemsError } = await supabase
        .from(TABLES.INVENTORY)
        .select('id, quantity, reorder_level')
        .eq('user_id', userId);
      
      if (allItemsError) {
        console.error('Error getting all items for low stock check:', allItemsError);
        throw new Error(`Failed to get items for low stock check: ${allItemsError.message}`);
      }
      
      const lowStockItems = allItems.filter(item => item.quantity <= item.reorder_level);
      
      return {
        totalItems: totalItems?.length || 0,
        lowStockCount: lowStockItems?.length || 0,
      };
    } catch (error) {
      console.error('getInventoryStats error:', error);
      throw error;
    }
  },

  // Create or update user profile
  async upsertUser(clerkUserId, userData) {
    if (!clerkUserId) {
      throw new Error('Clerk User ID is required');
    }
    
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .upsert({
        clerk_user_id: clerkUserId,
        ...userData,
        last_login: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user profile by Clerk user ID
  async getUserByClerkId(clerkUserId) {
    if (!clerkUserId) {
      throw new Error('Clerk User ID is required');
    }
    
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }
    
    return data;
  },
};

export default supabase; 