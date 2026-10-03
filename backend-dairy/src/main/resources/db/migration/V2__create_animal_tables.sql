-- V2: Create animals table
CREATE TABLE IF NOT EXISTS animals (
    id UUID PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
    animal_name VARCHAR(100) NOT NULL,
    ear_tag VARCHAR(100) NOT NULL,
    breed VARCHAR(100) NOT NULL,
    animal_type VARCHAR(50) NOT NULL DEFAULT 'Lactating',
    status VARCHAR(50) NOT NULL DEFAULT 'Healthy',
    age VARCHAR(50),
    weight NUMERIC(7, 2) DEFAULT 0.0,
    yield NUMERIC(6, 2) DEFAULT 0.0,
    pen VARCHAR(100),
    lactation_cycle INT DEFAULT 1,
    feed_ration VARCHAR(255),
    birth_date DATE,
    birth_status VARCHAR(100),
    father_animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
    father_tag VARCHAR(100),
    father_name VARCHAR(100),
    mother_animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
    mother_tag VARCHAR(100),
    mother_name VARCHAR(100),
    ai_date DATE,
    last_vaccination_date DATE,
    due_date DATE,
    last_milking_date TIMESTAMP WITH TIME ZONE,
    last_health_check DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT uk_animal_farm_ear_tag UNIQUE (farm_id, ear_tag),
    CONSTRAINT chk_animal_not_self_father CHECK (father_animal_id IS NULL OR father_animal_id <> id),
    CONSTRAINT chk_animal_not_self_mother CHECK (mother_animal_id IS NULL OR mother_animal_id <> id)
);

CREATE INDEX idx_animals_farm_id ON animals(farm_id);
CREATE INDEX idx_animals_farm_tag ON animals(farm_id, ear_tag);
CREATE INDEX idx_animals_farm_status ON animals(farm_id, status);
CREATE INDEX idx_animals_farm_type ON animals(farm_id, animal_type);
CREATE INDEX idx_animals_active ON animals(farm_id, active);
