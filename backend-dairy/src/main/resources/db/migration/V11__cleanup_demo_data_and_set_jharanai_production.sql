-- V11: Clean up demo records and align authoritative Jharanaai Farm production state

-- 1. Remove demo stock and medicine transactions
DELETE FROM stock_transactions WHERE id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
);

DELETE FROM medicine_transactions WHERE id IN (
    '80000000-0000-0000-0000-000000000001',
    '80000000-0000-0000-0000-000000000002'
);

-- 2. Remove demo animal history and demo animals
DELETE FROM animal_history WHERE id IN (
    'd0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000004'
);

-- Delete demo animals Bessie, Champion Sire, High Yield Dam
DELETE FROM animals WHERE ear_tag IN ('C-1024', 'C-050', 'C-087');

-- 3. Align default farm to legitimate client branding 'Jharanaai Farm'
UPDATE farms
SET name = 'Jharanaai Farm',
    code = 'JHF-01',
    email = 'satyamlkinf@gmail.com',
    contact_number = '+91 98765 43210'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- 4. Align primary Farm Owner email to verified destination for OTP delivery
UPDATE users
SET email = 'satyamlkinf@gmail.com'
WHERE id = 'b0000000-0000-0000-0000-000000000001';
