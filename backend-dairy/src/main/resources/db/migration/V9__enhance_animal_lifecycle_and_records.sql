-- V9: Enhance animal lifecycle tracking and status history
ALTER TABLE animals 
ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS lifecycle_date DATE,
ADD COLUMN IF NOT EXISTS lifecycle_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS lifecycle_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_animals_lifecycle_status ON animals(farm_id, lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_animals_lifecycle_date ON animals(farm_id, lifecycle_date);

-- Ensure historical records in animal_history can hold lifecycle event types
-- (event_type column is VARCHAR(50), which accommodates STATUS_CHANGE, SALE, DEATH, RETIREMENT)
