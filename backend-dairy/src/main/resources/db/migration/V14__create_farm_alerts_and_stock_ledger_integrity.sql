-- V14: Real Farm Alerts, Role-Targeted Notifications, and Feed Stock Ledger Integrity

-- 1. Create farm_alerts table
CREATE TABLE IF NOT EXISTS farm_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- ANIMAL_HEALTH, PREGNANCY, CALVING, MILK_PRODUCTION, FEED_STOCK, FARM_OPERATIONS, WORKER_NOTICE, OWNER_NOTICE, GENERAL
    severity VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- NORMAL, IMPORTANT, CRITICAL
    target_role VARCHAR(50) NOT NULL DEFAULT 'ALL', -- ALL, WORKER, MANAGEMENT, OWNER
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
    cow_number VARCHAR(50),
    event_date DATE,
    due_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, RESOLVED, DISMISSED
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by_name VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_farm_alerts_farm_date ON farm_alerts(farm_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_farm_alerts_role ON farm_alerts(farm_id, target_role);
CREATE INDEX IF NOT EXISTS idx_farm_alerts_animal ON farm_alerts(animal_id);

-- 2. Create farm_alert_reads table for tracking persistent per-user read state
CREATE TABLE IF NOT EXISTS farm_alert_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES farm_alerts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_alert_user_read UNIQUE (alert_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_alert_reads_user ON farm_alert_reads(user_id);

-- 3. Ensure legitimate opening stock in the ledger for configured feed items if none exists
INSERT INTO stock_transactions (id, farm_id, stock_item_id, transaction_type, quantity, unit, transaction_date, reference_type, notes, recorded_by_name)
SELECT 
    '00000000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'OPENING',
    100.0,
    'KG',
    CURRENT_DATE,
    'INITIAL_BALANCE',
    'Opening verified stock balance for Nada (Rice Straw)',
    'Management'
WHERE EXISTS (SELECT 1 FROM stock_items WHERE id = 'f0000000-0000-0000-0000-000000000001')
  AND NOT EXISTS (SELECT 1 FROM stock_transactions WHERE stock_item_id = 'f0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO stock_transactions (id, farm_id, stock_item_id, transaction_type, quantity, unit, transaction_date, reference_type, notes, recorded_by_name)
SELECT 
    '00000000-0000-0000-0000-000000000012',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000002',
    'OPENING',
    100.0,
    'KG',
    CURRENT_DATE,
    'INITIAL_BALANCE',
    'Opening verified stock balance for Chokada (Rice Bran)',
    'Management'
WHERE EXISTS (SELECT 1 FROM stock_items WHERE id = 'f0000000-0000-0000-0000-000000000002')
  AND NOT EXISTS (SELECT 1 FROM stock_transactions WHERE stock_item_id = 'f0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO stock_transactions (id, farm_id, stock_item_id, transaction_type, quantity, unit, transaction_date, reference_type, notes, recorded_by_name)
SELECT 
    '00000000-0000-0000-0000-000000000013',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000003',
    'OPENING',
    150.0,
    'KG',
    CURRENT_DATE,
    'INITIAL_BALANCE',
    'Opening verified stock balance for Dana (Concentrate)',
    'Management'
WHERE EXISTS (SELECT 1 FROM stock_items WHERE id = 'f0000000-0000-0000-0000-000000000003')
  AND NOT EXISTS (SELECT 1 FROM stock_transactions WHERE stock_item_id = 'f0000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

INSERT INTO stock_transactions (id, farm_id, stock_item_id, transaction_type, quantity, unit, transaction_date, reference_type, notes, recorded_by_name)
SELECT 
    '00000000-0000-0000-0000-000000000014',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000004',
    'OPENING',
    250.0,
    'KG',
    CURRENT_DATE,
    'INITIAL_BALANCE',
    'Opening verified stock balance for Napier Grass',
    'Management'
WHERE EXISTS (SELECT 1 FROM stock_items WHERE id = 'f0000000-0000-0000-0000-000000000004')
  AND NOT EXISTS (SELECT 1 FROM stock_transactions WHERE stock_item_id = 'f0000000-0000-0000-0000-000000000004')
ON CONFLICT (id) DO NOTHING;

INSERT INTO stock_transactions (id, farm_id, stock_item_id, transaction_type, quantity, unit, transaction_date, reference_type, notes, recorded_by_name)
SELECT 
    '00000000-0000-0000-0000-000000000015',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000005',
    'OPENING',
    50.0,
    'KG',
    CURRENT_DATE,
    'INITIAL_BALANCE',
    'Opening verified stock balance for Mineral Mixture',
    'Management'
WHERE EXISTS (SELECT 1 FROM stock_items WHERE id = 'f0000000-0000-0000-0000-000000000005')
  AND NOT EXISTS (SELECT 1 FROM stock_transactions WHERE stock_item_id = 'f0000000-0000-0000-0000-000000000005')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed initial authentic role-targeted alerts for the farm
INSERT INTO farm_alerts (id, farm_id, title, message, category, severity, target_role, cow_number, due_date, status, created_by_name)
VALUES
(
    '70000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Vaccination Schedule Follow-up',
    'FMD Booster dose due for group animals this week. Please inspect vaccination kit.',
    'ANIMAL_HEALTH',
    'IMPORTANT',
    'WORKER',
    NULL,
    CURRENT_DATE + INTERVAL '3 day',
    'ACTIVE',
    'Farm Management'
),
(
    '70000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'Feed Inventory Reorder Review',
    'Review concentrate feed stock balance and confirm supplier delivery date.',
    'FEED_STOCK',
    'NORMAL',
    'MANAGEMENT',
    NULL,
    CURRENT_DATE + INTERVAL '5 day',
    'ACTIVE',
    'Farm Management'
),
(
    '70000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Monthly Dairy Yield & Business Review',
    'Overall herd production and revenue metrics updated for executive review.',
    'MILK_PRODUCTION',
    'NORMAL',
    'OWNER',
    NULL,
    CURRENT_DATE,
    'ACTIVE',
    'Farm Management'
)
ON CONFLICT (id) DO NOTHING;
