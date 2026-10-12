-- V12: Provision lorensatya8@gmail.com as authorized farm manager/owner account
UPDATE users
SET email = 'lorensatya8@gmail.com',
    full_name = 'Loren Satya',
    role = 'OWNER',
    active = TRUE,
    verified = TRUE
WHERE id = 'b0000000-0000-0000-0000-000000000002';

-- If user does not exist with that ID, insert cleanly
INSERT INTO users (id, farm_id, full_name, username, email, mobile_number, password_hash, role, active, verified)
SELECT
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Loren Satya',
    'lorensatya',
    'lorensatya8@gmail.com',
    '+91 98765 12345',
    '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxGQrvkWChTa',
    'OWNER',
    TRUE,
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'lorensatya8@gmail.com' OR id = 'b0000000-0000-0000-0000-000000000002'
);
