-- V10: Animal Groups, Bilingual Feed Master, Stock Ledger, and Medicine Stock
-- 1. Animal Groups
CREATE TABLE IF NOT EXISTS animal_groups (
    id UUID PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT uk_animal_group_farm_name UNIQUE (farm_id, name)
);

CREATE INDEX IF NOT EXISTS idx_animal_groups_farm ON animal_groups(farm_id);

-- Add group reference and make animal_name optional on animals table
ALTER TABLE animals ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES animal_groups(id) ON DELETE SET NULL;
ALTER TABLE animals ALTER COLUMN animal_name DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_animals_group_id ON animals(farm_id, group_id);

-- 2. Bilingual Feed Item Master
CREATE TABLE IF NOT EXISTS feed_items (
    id UUID PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
    local_name VARCHAR(100) NOT NULL,
    english_name VARCHAR(100) NOT NULL,
    short_name VARCHAR(50),
    display_name VARCHAR(150) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    category VARCHAR(50) NOT NULL DEFAULT 'DRY_FODDER',
    default_cost_per_unit NUMERIC(10, 2) DEFAULT 0.0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT uk_feed_item_farm_display UNIQUE (farm_id, display_name)
);

CREATE INDEX IF NOT EXISTS idx_feed_items_farm ON feed_items(farm_id);

-- 3. Stock Items
CREATE TABLE IF NOT EXISTS stock_items (
    id UUID PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
    feed_item_id UUID REFERENCES feed_items(id) ON DELETE SET NULL,
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'FEED',
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    min_threshold NUMERIC(10, 2) DEFAULT 0.0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_stock_item_farm_name UNIQUE (farm_id, item_name)
);

CREATE INDEX IF NOT EXISTS idx_stock_items_farm ON stock_items(farm_id);

-- 4. Stock Transactions Ledger (Opening + Added - Consumed = Current Stock)
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- OPENING, PURCHASE, RECEIVED, ADJUSTMENT_IN, CONSUMPTION, ADJUSTMENT_OUT, WASTE, TRANSFER
    quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    transaction_date DATE NOT NULL,
    reference_type VARCHAR(50), -- FEEDING, PURCHASE, MANUAL, etc.
    reference_id UUID,
    notes TEXT,
    recorded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recorded_by_name VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_stock_transactions_farm_date ON stock_transactions(farm_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item ON stock_transactions(stock_item_id);

-- 5. Medicines and Medicine Transactions
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    local_name VARCHAR(150),
    unit VARCHAR(50) NOT NULL DEFAULT 'vial',
    batch_number VARCHAR(100),
    expiry_date DATE,
    min_threshold NUMERIC(10, 2) DEFAULT 0.0,
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    CONSTRAINT uk_medicine_farm_name UNIQUE (farm_id, name)
);

CREATE INDEX IF NOT EXISTS idx_medicines_farm ON medicines(farm_id);

CREATE TABLE IF NOT EXISTS medicine_transactions (
    id UUID PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- RECEIVED, USAGE, DISCARD, ADJUSTMENT
    quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
    administered_by VARCHAR(150),
    reason TEXT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_med_tx_farm_date ON medicine_transactions(farm_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_med_tx_medicine ON medicine_transactions(medicine_id);

-- Seed Initial Groups for Demo Farm
INSERT INTO animal_groups (id, farm_id, name, code, description, active)
VALUES 
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Group A', 'GRP-A', 'High yield lactating herd', TRUE),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Group B', 'GRP-B', 'Mid yield cows', TRUE),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Pregnant', 'GRP-PREG', 'Expecting cows nearing dry cycle', TRUE),
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Calf', 'GRP-CALF', 'Young stock & heifers', TRUE),
('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'Bull', 'GRP-BULL', 'Breeding bulls pen', TRUE)
ON CONFLICT (farm_id, name) DO NOTHING;

-- Link demo animals to groups
UPDATE animals SET group_id = 'd0000000-0000-0000-0000-000000000001' WHERE ear_tag IN ('C-1024', 'C-1050', 'C-087') AND group_id IS NULL;
UPDATE animals SET group_id = 'd0000000-0000-0000-0000-000000000002' WHERE ear_tag IN ('C-1088', 'C-1102') AND group_id IS NULL;
UPDATE animals SET group_id = 'd0000000-0000-0000-0000-000000000004' WHERE ear_tag IN ('C-1110', 'C-050') AND group_id IS NULL;

-- Seed Configurable Bilingual Feed Items
INSERT INTO feed_items (id, farm_id, local_name, english_name, short_name, display_name, unit, category, active)
VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'ନଡ଼ା', 'Rice Straw', 'Nada', 'ନଡ଼ା (Nada)', 'KG', 'DRY_FODDER', TRUE),
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'ଚୋକଡ଼ା', 'Rice Bran', 'Chokada', 'ଚୋକଡ଼ା (Chokada)', 'KG', 'CONCENTRATE', TRUE),
('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'କୁଣ୍ଡା', 'Oil Cake', 'Kunda', 'କୁଣ୍ଡା (Kunda)', 'KG', 'CONCENTRATE', TRUE),
('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'ପିଡ଼ିଆ', 'Mustard Cake', 'Pidia', 'ପିଡ଼ିଆ (Pidia)', 'KG', 'CONCENTRATE', TRUE),
('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'ଭୁସି', 'Wheat Bran', 'Bhusi', 'ଭୁସି (Bhusi)', 'KG', 'CONCENTRATE', TRUE),
('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'ମକା', 'Maize', 'Maka', 'ମକା (Maka)', 'KG', 'CONCENTRATE', TRUE),
('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'ଦାନା', 'Concentrate Pellets', 'Dana', 'ଦାନା (Dana)', 'KG', 'CONCENTRATE', TRUE),
('e0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'ସବୁଜ ଘାସ', 'Green Fodder', 'Green Grass', 'ସବୁଜ ଘାସ (Green Grass)', 'KG', 'GREEN_FODDER', TRUE),
('e0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'ବର୍ସିମ୍', 'Berseem Clover', 'Berseem', 'ବର୍ସିମ୍ (Berseem)', 'KG', 'GREEN_FODDER', TRUE),
('e0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'ନେପିଅର୍ ଘାସ', 'Napier Grass', 'Napier', 'ନେପିଅର୍ ଘାସ (Napier)', 'KG', 'GREEN_FODDER', TRUE),
('e0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'ମିନେରାଲ୍ ମିକ୍ସଚର୍', 'Mineral Mixture', 'Minerals', 'ମିନେରାଲ୍ ମିକ୍ସଚର୍ (Minerals)', 'KG', 'SUPPLEMENT', TRUE),
('e0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'ଲୁଣ', 'Salt Supplement', 'Salt', 'ଲୁଣ (Salt)', 'KG', 'SUPPLEMENT', TRUE)
ON CONFLICT (farm_id, display_name) DO NOTHING;

-- Seed corresponding Stock Items
INSERT INTO stock_items (id, farm_id, feed_item_id, item_name, category, unit, min_threshold, active)
VALUES
('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'ନଡ଼ା (Nada)', 'FEED', 'KG', 100.0, TRUE),
('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'ଚୋକଡ଼ା (Chokada)', 'FEED', 'KG', 50.0, TRUE),
('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000007', 'ଦାନା (Dana)', 'FEED', 'KG', 100.0, TRUE),
('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000010', 'ନେପିଅର୍ ଘାସ (Napier)', 'FEED', 'KG', 200.0, TRUE),
('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000011', 'ମିନେରାଲ୍ ମିକ୍ସଚର୍ (Minerals)', 'FEED', 'KG', 20.0, TRUE)
ON CONFLICT (farm_id, item_name) DO NOTHING;

-- Seed Sample Movements for Nada: (Added: 40 + 60 = 100 KG, Consumed: 30 KG => Current 70 KG)
INSERT INTO stock_transactions (id, farm_id, stock_item_id, transaction_type, quantity, unit, transaction_date, reference_type, notes, recorded_by_name)
VALUES
('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'RECEIVED', 40.0, 'KG', CURRENT_DATE - INTERVAL '2 day', 'PURCHASE', 'Initial seasonal stock batch', 'Rajesh Kumar'),
('00000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'RECEIVED', 60.0, 'KG', CURRENT_DATE - INTERVAL '1 day', 'PURCHASE', 'Second harvest delivery', 'Suresh Patil'),
('00000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'CONSUMPTION', 30.0, 'KG', CURRENT_DATE, 'FEEDING', 'Morning herd feeding round', 'Suresh Patil')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Medicines
INSERT INTO medicines (id, farm_id, name, local_name, unit, batch_number, expiry_date, min_threshold, notes, active)
VALUES
('90000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Calcium Borogluconate', 'କ୍ୟାଲସିୟମ୍ ଇଞ୍ଜେକ୍ସନ୍', 'vial', 'CB-2026-09', CURRENT_DATE + INTERVAL '180 day', 5.0, 'For milk fever emergency support', TRUE),
('90000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'FMD Oil Adjuvant Vaccine', 'ଏଫ୍.ଏମ୍.ଡି. ଟୀକା', 'dose', 'FMD-440', CURRENT_DATE + INTERVAL '120 day', 20.0, 'Foot & Mouth disease annual protection', TRUE),
('90000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Ivermectin Injection', 'ପୋକ ଔଷଧ', 'vial', 'IVM-881', CURRENT_DATE + INTERVAL '240 day', 3.0, 'Broad spectrum deworming', TRUE)
ON CONFLICT (farm_id, name) DO NOTHING;

-- Seed Medicine Initial Stock Transactions
INSERT INTO medicine_transactions (id, farm_id, medicine_id, transaction_type, quantity, unit, administered_by, reason, transaction_date)
VALUES
('80000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'RECEIVED', 20.0, 'vial', 'Rajesh Kumar', 'Monthly clinic stock replenishment', CURRENT_DATE - INTERVAL '5 day'),
('80000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'USAGE', 2.0, 'vial', 'Dr. Panda (Vet)', 'Treated C-1024 post-calving lethargy', CURRENT_DATE - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
