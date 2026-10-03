-- V3: Create animal_history table
CREATE TABLE IF NOT EXISTS animal_history (
    id UUID PRIMARY KEY,
    animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
    event_type VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL,
    title VARCHAR(200) NOT NULL,
    detail TEXT,
    badge VARCHAR(50),
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_animal_history_animal_id ON animal_history(animal_id, event_date DESC);
CREATE INDEX idx_animal_history_farm_id ON animal_history(farm_id);
CREATE INDEX idx_animal_history_event_type ON animal_history(farm_id, event_type);
