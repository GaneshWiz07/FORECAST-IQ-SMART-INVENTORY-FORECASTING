-- AI Inventory Management System Database Schema
-- Execute this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL, -- Clerk user ID for data isolation
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT inventory_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT inventory_sku_not_empty CHECK (length(trim(sku)) > 0),
    CONSTRAINT inventory_quantity_non_negative CHECK (quantity >= 0),
    CONSTRAINT inventory_reorder_level_non_negative CHECK (reorder_level >= 0),
    CONSTRAINT inventory_user_id_not_empty CHECK (length(trim(user_id)) > 0),
    UNIQUE(user_id, sku) -- Each user can have unique SKUs
);

-- Create sales_data table
CREATE TABLE IF NOT EXISTS sales_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL, -- Clerk user ID for data isolation
    sku VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    units_sold INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT sales_data_sku_not_empty CHECK (length(trim(sku)) > 0),
    CONSTRAINT sales_data_units_sold_non_negative CHECK (units_sold >= 0),
    CONSTRAINT sales_data_user_id_not_empty CHECK (length(trim(user_id)) > 0),
    UNIQUE(user_id, sku, date) -- Each user can have one sales record per SKU per date
);

-- Create forecasts table (optional - for caching forecast results)
CREATE TABLE IF NOT EXISTS forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL, -- Clerk user ID for data isolation
    sku VARCHAR(100) NOT NULL,
    forecast_date TIMESTAMP WITH TIME ZONE NOT NULL,
    predicted_date DATE NOT NULL,
    predicted_demand DECIMAL(10,2) NOT NULL DEFAULT 0,
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT forecasts_sku_not_empty CHECK (length(trim(sku)) > 0),
    CONSTRAINT forecasts_predicted_demand_non_negative CHECK (predicted_demand >= 0),
    CONSTRAINT forecasts_confidence_score_range CHECK (confidence_score >= 0 AND confidence_score <= 1),
    CONSTRAINT forecasts_user_id_not_empty CHECK (length(trim(user_id)) > 0),
    UNIQUE(user_id, sku, predicted_date) -- Each user can have one forecast per SKU per date
);

-- Create users table (optional - for storing additional user metadata)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT users_clerk_user_id_not_empty CHECK (length(trim(clerk_user_id)) > 0),
    CONSTRAINT users_role_valid CHECK (role IN ('admin', 'user', 'viewer'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user_sku ON inventory(user_id, sku);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity_reorder ON inventory(quantity, reorder_level);
CREATE INDEX IF NOT EXISTS idx_inventory_last_updated ON inventory(last_updated);

CREATE INDEX IF NOT EXISTS idx_sales_data_user_id ON sales_data(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_data_user_sku ON sales_data(user_id, sku);
CREATE INDEX IF NOT EXISTS idx_sales_data_date ON sales_data(date);
CREATE INDEX IF NOT EXISTS idx_sales_data_user_sku_date ON sales_data(user_id, sku, date);

CREATE INDEX IF NOT EXISTS idx_forecasts_user_id ON forecasts(user_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_user_sku ON forecasts(user_id, sku);
CREATE INDEX IF NOT EXISTS idx_forecasts_predicted_date ON forecasts(predicted_date);
CREATE INDEX IF NOT EXISTS idx_forecasts_user_sku_predicted_date ON forecasts(user_id, sku, predicted_date);

CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory table
CREATE POLICY "Users can only access their own inventory" ON inventory
    FOR ALL USING (user_id = auth.jwt() ->> 'sub');

-- Create RLS policies for sales_data table
CREATE POLICY "Users can only access their own sales data" ON sales_data
    FOR ALL USING (user_id = auth.jwt() ->> 'sub');

-- Create RLS policies for forecasts table
CREATE POLICY "Users can only access their own forecasts" ON forecasts
    FOR ALL USING (user_id = auth.jwt() ->> 'sub');

-- Create RLS policies for users table
CREATE POLICY "Users can only access their own user data" ON users
    FOR ALL USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample inventory data
INSERT INTO inventory (name, sku, quantity, reorder_level) VALUES
    ('Wireless Bluetooth Headphones', 'WBH-001', 150, 20),
    ('USB-C Charging Cable', 'USBC-002', 300, 50),
    ('Smartphone Case - iPhone 14', 'SC-IPH14', 75, 15),
    ('Laptop Stand - Adjustable', 'LS-ADJ-003', 45, 10),
    ('Wireless Mouse - Ergonomic', 'WM-ERG-004', 85, 15),
    ('Mechanical Keyboard - RGB', 'MK-RGB-005', 32, 8),
    ('Monitor - 24" 4K', 'MON-24K-006', 18, 5),
    ('Webcam - HD 1080p', 'WC-HD-007', 65, 12),
    ('External Hard Drive - 1TB', 'EHD-1TB-008', 25, 5),
    ('Wireless Charger Pad', 'WCP-009', 120, 25)
ON CONFLICT (sku) DO NOTHING;

-- Insert sample sales data (last 60 days)
INSERT INTO sales_data (sku, date, units_sold) VALUES
    -- WBH-001 sales (trending up)
    ('WBH-001', CURRENT_DATE - INTERVAL '59 days', 3),
    ('WBH-001', CURRENT_DATE - INTERVAL '58 days', 2),
    ('WBH-001', CURRENT_DATE - INTERVAL '57 days', 4),
    ('WBH-001', CURRENT_DATE - INTERVAL '55 days', 5),
    ('WBH-001', CURRENT_DATE - INTERVAL '53 days', 6),
    ('WBH-001', CURRENT_DATE - INTERVAL '50 days', 4),
    ('WBH-001', CURRENT_DATE - INTERVAL '48 days', 7),
    ('WBH-001', CURRENT_DATE - INTERVAL '45 days', 8),
    ('WBH-001', CURRENT_DATE - INTERVAL '42 days', 6),
    ('WBH-001', CURRENT_DATE - INTERVAL '40 days', 9),
    ('WBH-001', CURRENT_DATE - INTERVAL '37 days', 10),
    ('WBH-001', CURRENT_DATE - INTERVAL '35 days', 8),
    ('WBH-001', CURRENT_DATE - INTERVAL '32 days', 11),
    ('WBH-001', CURRENT_DATE - INTERVAL '30 days', 12),
    ('WBH-001', CURRENT_DATE - INTERVAL '28 days', 9),
    ('WBH-001', CURRENT_DATE - INTERVAL '25 days', 14),
    ('WBH-001', CURRENT_DATE - INTERVAL '22 days', 13),
    ('WBH-001', CURRENT_DATE - INTERVAL '20 days', 15),
    ('WBH-001', CURRENT_DATE - INTERVAL '17 days', 11),
    ('WBH-001', CURRENT_DATE - INTERVAL '15 days', 16),
    ('WBH-001', CURRENT_DATE - INTERVAL '12 days', 14),
    ('WBH-001', CURRENT_DATE - INTERVAL '10 days', 18),
    ('WBH-001', CURRENT_DATE - INTERVAL '7 days', 17),
    ('WBH-001', CURRENT_DATE - INTERVAL '5 days', 20),
    ('WBH-001', CURRENT_DATE - INTERVAL '3 days', 19),
    ('WBH-001', CURRENT_DATE - INTERVAL '1 days', 22),

    -- USBC-002 sales (steady)
    ('USBC-002', CURRENT_DATE - INTERVAL '59 days', 8),
    ('USBC-002', CURRENT_DATE - INTERVAL '56 days', 12),
    ('USBC-002', CURRENT_DATE - INTERVAL '53 days', 10),
    ('USBC-002', CURRENT_DATE - INTERVAL '50 days', 15),
    ('USBC-002', CURRENT_DATE - INTERVAL '47 days', 11),
    ('USBC-002', CURRENT_DATE - INTERVAL '44 days', 13),
    ('USBC-002', CURRENT_DATE - INTERVAL '41 days', 9),
    ('USBC-002', CURRENT_DATE - INTERVAL '38 days', 14),
    ('USBC-002', CURRENT_DATE - INTERVAL '35 days', 12),
    ('USBC-002', CURRENT_DATE - INTERVAL '32 days', 16),
    ('USBC-002', CURRENT_DATE - INTERVAL '29 days', 10),
    ('USBC-002', CURRENT_DATE - INTERVAL '26 days', 11),
    ('USBC-002', CURRENT_DATE - INTERVAL '23 days', 13),
    ('USBC-002', CURRENT_DATE - INTERVAL '20 days', 14),
    ('USBC-002', CURRENT_DATE - INTERVAL '17 days', 12),
    ('USBC-002', CURRENT_DATE - INTERVAL '14 days', 15),
    ('USBC-002', CURRENT_DATE - INTERVAL '11 days', 9),
    ('USBC-002', CURRENT_DATE - INTERVAL '8 days', 13),
    ('USBC-002', CURRENT_DATE - INTERVAL '5 days', 11),
    ('USBC-002', CURRENT_DATE - INTERVAL '2 days', 14),

    -- SC-IPH14 sales (seasonal pattern)
    ('SC-IPH14', CURRENT_DATE - INTERVAL '58 days', 5),
    ('SC-IPH14', CURRENT_DATE - INTERVAL '51 days', 3),
    ('SC-IPH14', CURRENT_DATE - INTERVAL '44 days', 7),
    ('SC-IPH14', CURRENT_DATE - INTERVAL '37 days', 4),
    ('SC-IPH14', CURRENT_DATE - INTERVAL '30 days', 6),
    ('SC-IPH14', CURRENT_DATE - INTERVAL '23 days', 8),
    ('SC-IPH14', CURRENT_DATE - INTERVAL '16 days', 5),
    ('SC-IPH14', CURRENT_DATE - INTERVAL '9 days', 9),
    ('SC-IPH14', CURRENT_DATE - INTERVAL '2 days', 7),

    -- LS-ADJ-003 sales (declining)
    ('LS-ADJ-003', CURRENT_DATE - INTERVAL '55 days', 4),
    ('LS-ADJ-003', CURRENT_DATE - INTERVAL '48 days', 3),
    ('LS-ADJ-003', CURRENT_DATE - INTERVAL '41 days', 3),
    ('LS-ADJ-003', CURRENT_DATE - INTERVAL '34 days', 2),
    ('LS-ADJ-003', CURRENT_DATE - INTERVAL '27 days', 2),
    ('LS-ADJ-003', CURRENT_DATE - INTERVAL '20 days', 1),
    ('LS-ADJ-003', CURRENT_DATE - INTERVAL '13 days', 2),
    ('LS-ADJ-003', CURRENT_DATE - INTERVAL '6 days', 1),

    -- WM-ERG-004 sales (growing)
    ('WM-ERG-004', CURRENT_DATE - INTERVAL '52 days', 2),
    ('WM-ERG-004', CURRENT_DATE - INTERVAL '45 days', 3),
    ('WM-ERG-004', CURRENT_DATE - INTERVAL '38 days', 4),
    ('WM-ERG-004', CURRENT_DATE - INTERVAL '31 days', 5),
    ('WM-ERG-004', CURRENT_DATE - INTERVAL '24 days', 6),
    ('WM-ERG-004', CURRENT_DATE - INTERVAL '17 days', 7),
    ('WM-ERG-004', CURRENT_DATE - INTERVAL '10 days', 8),
    ('WM-ERG-004', CURRENT_DATE - INTERVAL '3 days', 9)
ON CONFLICT (sku, date) DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW inventory_summary AS
SELECT 
    i.id,
    i.user_id,
    i.name,
    i.sku,
    i.quantity,
    i.reorder_level,
    i.last_updated,
    CASE 
        WHEN i.quantity <= i.reorder_level THEN 'low'
        WHEN i.quantity <= i.reorder_level * 1.5 THEN 'medium'
        ELSE 'good'
    END as stock_status,
    COALESCE(recent_sales.total_sales, 0) as recent_sales_30d
FROM inventory i
LEFT JOIN (
    SELECT 
        user_id,
        sku,
        SUM(units_sold) as total_sales
    FROM sales_data 
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY user_id, sku
) recent_sales ON i.user_id = recent_sales.user_id AND i.sku = recent_sales.sku;

CREATE OR REPLACE VIEW sales_summary AS
SELECT 
    user_id,
    sku,
    COUNT(*) as total_sales_days,
    SUM(units_sold) as total_units_sold,
    AVG(units_sold) as avg_daily_sales,
    MAX(units_sold) as max_daily_sales,
    MIN(date) as first_sale_date,
    MAX(date) as last_sale_date
FROM sales_data
GROUP BY user_id, sku;

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON TABLE inventory IS 'Stores product inventory information (user-specific)';
COMMENT ON TABLE sales_data IS 'Stores historical sales data for demand forecasting (user-specific)';
COMMENT ON TABLE forecasts IS 'Stores AI-generated demand forecasts (user-specific)';
COMMENT ON TABLE users IS 'Stores additional user metadata from Clerk authentication';

COMMENT ON COLUMN inventory.user_id IS 'Clerk user ID for data isolation';
COMMENT ON COLUMN inventory.sku IS 'Stock Keeping Unit - unique product identifier per user';
COMMENT ON COLUMN inventory.reorder_level IS 'Minimum quantity before reorder alert';
COMMENT ON COLUMN sales_data.user_id IS 'Clerk user ID for data isolation';
COMMENT ON COLUMN sales_data.units_sold IS 'Number of units sold on specific date';
COMMENT ON COLUMN forecasts.user_id IS 'Clerk user ID for data isolation';
COMMENT ON COLUMN forecasts.predicted_demand IS 'AI predicted demand for specific date';
COMMENT ON COLUMN forecasts.confidence_score IS 'Forecast confidence between 0 and 1';

-- Success message
SELECT 'Database schema updated successfully with user data isolation!' as message; 