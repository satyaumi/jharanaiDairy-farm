-- V15: Expand animal schema to support real farm Excel workbook data (Summary & New Heading)
ALTER TABLE animals
ADD COLUMN IF NOT EXISTS last_calving_date DATE,
ADD COLUMN IF NOT EXISTS milking_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS animal_status_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS vaccination_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_vaccine_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS heat_date DATE,
ADD COLUMN IF NOT EXISTS ai_attempts_count INT,
ADD COLUMN IF NOT EXISTS ai_success BOOLEAN,
ADD COLUMN IF NOT EXISTS bull_used VARCHAR(100),
ADD COLUMN IF NOT EXISTS drying_date DATE,
ADD COLUMN IF NOT EXISTS calf_dob DATE,
ADD COLUMN IF NOT EXISTS calf_sex VARCHAR(20),
ADD COLUMN IF NOT EXISTS best_yield NUMERIC(7, 2),
ADD COLUMN IF NOT EXISTS medicine_used VARCHAR(150),
ADD COLUMN IF NOT EXISTS medicine_dose VARCHAR(50),
ADD COLUMN IF NOT EXISTS gestation_days INT,
ADD COLUMN IF NOT EXISTS inter_calving_days INT,
ADD COLUMN IF NOT EXISTS remarks TEXT;

CREATE INDEX IF NOT EXISTS idx_animals_milking_status ON animals(farm_id, milking_status);
CREATE INDEX IF NOT EXISTS idx_animals_birth_date ON animals(farm_id, birth_date);
CREATE INDEX IF NOT EXISTS idx_animals_due_date ON animals(farm_id, due_date);
CREATE INDEX IF NOT EXISTS idx_animals_last_calving ON animals(farm_id, last_calving_date);
