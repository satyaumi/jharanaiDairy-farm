-- V16: Production Duplicate Record Prevention, High-Performance Sorting, and Referential Integrity

-- 1. Enforce Case-Insensitive Unique Animal Number per Farm
CREATE UNIQUE INDEX IF NOT EXISTS uk_animals_farm_upper_eartag 
ON animals(farm_id, UPPER(TRIM(ear_tag)));

-- 2. Index for Default Herd Inventory Sorting (Recently Added at Top)
CREATE INDEX IF NOT EXISTS idx_animals_farm_created_at 
ON animals(farm_id, created_at DESC);

-- 3. Prevent Duplicate AI Attempts on the Same Date for the Same Animal
CREATE UNIQUE INDEX IF NOT EXISTS uk_animal_history_ai_event 
ON animal_history(animal_id, event_date, title) 
WHERE event_type = 'AI';

-- 4. Prevent Duplicate Vaccination Records on the Same Date with the Same Vaccine Name
CREATE UNIQUE INDEX IF NOT EXISTS uk_animal_history_vac_event 
ON animal_history(animal_id, event_date, title) 
WHERE event_type = 'VACCINATION';

-- 5. Prevent Duplicate Calving Records on the Same Date for the Same Animal
CREATE UNIQUE INDEX IF NOT EXISTS uk_animal_history_calving_event 
ON animal_history(animal_id, event_date) 
WHERE event_type = 'CALVING';

-- 6. Indices for Animal Breed, Pen, and Type Filtering
CREATE INDEX IF NOT EXISTS idx_animals_farm_breed ON animals(farm_id, breed);
CREATE INDEX IF NOT EXISTS idx_animals_farm_pen ON animals(farm_id, pen);

