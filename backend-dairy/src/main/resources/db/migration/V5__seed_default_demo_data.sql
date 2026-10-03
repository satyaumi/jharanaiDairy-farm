-- V5: Seed Willow Creek demo farm, users, and herd
INSERT INTO farms (id, name, code, address, city, state, country, contact_number, email, active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Willow Creek Dairy Farm',
    'WCF-01',
    'Sector 4, Dairy Corridor',
    'Karnal',
    'Haryana',
    'India',
    '+91 98765 43210',
    'info@willowcreekfarm.com',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Seed Users (password: password123)
-- BCrypt: $2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxGQrvkWChTa
INSERT INTO users (id, farm_id, full_name, username, email, mobile_number, password_hash, role, active, verified)
VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Priya Mehta',
    'priya',
    'priya@willowcreekfarm.com',
    '+91 98765 43210',
    '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxGQrvkWChTa',
    'OWNER',
    TRUE,
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Rajesh Kumar',
    'rajesh',
    'rajesh@willowcreekfarm.com',
    '+91 98765 12345',
    '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxGQrvkWChTa',
    'MANAGER',
    TRUE,
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Suresh Patil',
    'suresh',
    'suresh@willowcreekfarm.com',
    '+91 98765 67890',
    '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxGQrvkWChTa',
    'WORKER',
    TRUE,
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Farm Administrator',
    'admin',
    'admin@dairyplatform.com',
    '+91 98765 00000',
    '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxGQrvkWChTa',
    'ADMIN',
    TRUE,
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Seed Parent Animals (Sire and Dam)
INSERT INTO animals (id, farm_id, animal_name, ear_tag, breed, animal_type, status, age, weight, yield, pen, birth_date, active)
VALUES
(
    'c0000000-0000-0000-0000-000000000050',
    'a0000000-0000-0000-0000-000000000001',
    'Champion Sire',
    'C-050',
    'Holstein Friesian',
    'Calf',
    'Healthy',
    '5y 2m',
    720.0,
    0.0,
    'Breeding Bull Pen',
    '2021-04-10',
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000087',
    'a0000000-0000-0000-0000-000000000001',
    'High Yield Dam',
    'C-087',
    'Holstein Friesian',
    'Lactating',
    'Healthy',
    '4y 6m',
    610.0,
    28.5,
    'North barn',
    '2022-01-18',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Seed Primary Cow Bessie (C-1024)
INSERT INTO animals (
    id, farm_id, animal_name, ear_tag, breed, animal_type, status, age, weight, yield, pen,
    lactation_cycle, feed_ration, birth_date, birth_status,
    father_animal_id, father_tag, father_name,
    mother_animal_id, mother_tag, mother_name,
    ai_date, last_vaccination_date, active
)
VALUES (
    'c0000000-0000-0000-0000-000000001024',
    'a0000000-0000-0000-0000-000000000001',
    'Bessie',
    'C-1024',
    'Holstein Friesian',
    'Lactating',
    'Healthy',
    '4y 2m',
    580.0,
    26.4,
    'North barn',
    3,
    '18 kg Green + 4 kg Concentrate',
    '2022-03-12',
    'Normal Calving',
    'c0000000-0000-0000-0000-000000000050',
    'C-050',
    'Champion Sire',
    'c0000000-0000-0000-0000-000000000087',
    'C-087',
    'High Yield Dam',
    '2026-01-15',
    '2026-08-10',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Seed Bessie History
INSERT INTO animal_history (id, animal_id, farm_id, event_type, event_date, title, detail, badge)
VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000001024',
    'a0000000-0000-0000-0000-000000000001',
    'BIRTH',
    '2022-03-12',
    'Birth Recorded',
    'Born on Willow Creek Farm. Normal Calving. Sire: C-050, Dam: C-087.',
    'Birth'
),
(
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000001024',
    'a0000000-0000-0000-0000-000000000001',
    'REGISTRATION',
    '2022-03-13',
    'Ear Tag Issued',
    'Official farm ear tag C-1024 registered in herd database.',
    'Registered'
),
(
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000001024',
    'a0000000-0000-0000-0000-000000000001',
    'VACCINATION',
    '2026-08-10',
    'FMD Vaccine Administered',
    'Foot-and-Mouth disease booster dose verified and recorded.',
    'Vaccinated'
),
(
    'd0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000001024',
    'a0000000-0000-0000-0000-000000000001',
    'AI',
    '2026-01-15',
    'Artificial Insemination (AI)',
    'Inseminated with certified progeny sire semen straw #HF-882.',
    'AI Done'
) ON CONFLICT (id) DO NOTHING;
