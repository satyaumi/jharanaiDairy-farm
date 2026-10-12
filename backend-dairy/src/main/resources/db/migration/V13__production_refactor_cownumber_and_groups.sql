-- V13: Ensure Production Performance Groups A-F and Cow Number as unique identifier
-- 1. Ensure animal_name is optional and defaults to ear_tag if blank
ALTER TABLE animals ALTER COLUMN animal_name DROP NOT NULL;
UPDATE animals SET animal_name = ear_tag WHERE animal_name IS NULL OR TRIM(animal_name) = '';

-- 2. Seed production performance groups A to F for default farm
INSERT INTO animal_groups (id, farm_id, name, code, description, active)
VALUES 
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Group A', 'GRP-A', 'Production Yield >= 18 L/day', TRUE),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Group B', 'GRP-B', 'Production Yield 14.0 - 17.9 L/day', TRUE),
('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Group C', 'GRP-C', 'Production Yield 10.0 - 13.9 L/day', TRUE),
('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Group D', 'GRP-D', 'Production Yield 7.0 - 9.9 L/day', TRUE),
('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Group E', 'GRP-E', 'Production Yield 4.0 - 6.9 L/day', TRUE),
('d0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Group F', 'GRP-F', 'Production Yield < 4.0 L/day', TRUE)
ON CONFLICT (farm_id, name) DO UPDATE SET 
    description = EXCLUDED.description,
    active = TRUE;

-- 3. Update existing legacy groups if present (e.g. Ensure A-F codes match)
UPDATE animal_groups SET code = 'GRP-A', description = 'Production Yield >= 18 L/day' WHERE farm_id = 'a0000000-0000-0000-0000-000000000001' AND name = 'Group A';
UPDATE animal_groups SET code = 'GRP-B', description = 'Production Yield 14.0 - 17.9 L/day' WHERE farm_id = 'a0000000-0000-0000-0000-000000000001' AND name = 'Group B';
UPDATE animal_groups SET code = 'GRP-C', description = 'Production Yield 10.0 - 13.9 L/day' WHERE farm_id = 'a0000000-0000-0000-0000-000000000001' AND name = 'Group C';
UPDATE animal_groups SET code = 'GRP-D', description = 'Production Yield 7.0 - 9.9 L/day' WHERE farm_id = 'a0000000-0000-0000-0000-000000000001' AND name = 'Group D';
UPDATE animal_groups SET code = 'GRP-E', description = 'Production Yield 4.0 - 6.9 L/day' WHERE farm_id = 'a0000000-0000-0000-0000-000000000001' AND name = 'Group E';
UPDATE animal_groups SET code = 'GRP-F', description = 'Production Yield < 4.0 L/day' WHERE farm_id = 'a0000000-0000-0000-0000-000000000001' AND name = 'Group F';
