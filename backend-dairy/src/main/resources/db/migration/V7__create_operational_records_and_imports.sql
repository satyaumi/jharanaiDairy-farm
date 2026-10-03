-- V7: Create operational records (milk_records, feed_records) and import_batches
CREATE TABLE IF NOT EXISTS milk_records (
    id UUID PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
    animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE RESTRICT,
    record_date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL, -- Morning, Evening, Afternoon
    litres NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    quality VARCHAR(50) DEFAULT 'Normal',
    fat_percentage NUMERIC(4, 2),
    snf_percentage NUMERIC(4, 2),
    source_type VARCHAR(50) DEFAULT 'MANUAL', -- MANUAL, IMPORT, SENSOR
    import_batch_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT uk_milk_record_shift UNIQUE (farm_id, animal_id, record_date, shift)
);

CREATE INDEX idx_milk_records_farm_date ON milk_records(farm_id, record_date DESC);
CREATE INDEX idx_milk_records_animal ON milk_records(animal_id, record_date DESC);
CREATE INDEX idx_milk_records_import_batch ON milk_records(import_batch_id);

CREATE TABLE IF NOT EXISTS feed_records (
    id UUID PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
    animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
    feed_type VARCHAR(100) NOT NULL,
    group_name VARCHAR(100) NOT NULL DEFAULT 'Milking herd',
    quantity_kg NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
    record_date DATE NOT NULL,
    recorded_by VARCHAR(100),
    source_type VARCHAR(50) DEFAULT 'MANUAL',
    import_batch_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

CREATE INDEX idx_feed_records_farm_date ON feed_records(farm_id, record_date DESC);
CREATE INDEX idx_feed_records_import_batch ON feed_records(import_batch_id);

CREATE TABLE IF NOT EXISTS import_batches (
    id UUID PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
    batch_code VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    record_type VARCHAR(50) NOT NULL, -- MILK_RECORD, COW_RECORD, FEED_RECORD, etc.
    total_rows INT NOT NULL DEFAULT 0,
    created_count INT NOT NULL DEFAULT 0,
    updated_count INT NOT NULL DEFAULT 0,
    skipped_count INT NOT NULL DEFAULT 0,
    error_count INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED', -- COMPLETED, FAILED, ROLLED_BACK
    error_log TEXT,
    imported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    imported_by_name VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_import_batches_farm ON import_batches(farm_id, created_at DESC);
CREATE INDEX idx_import_batches_code ON import_batches(batch_code);
