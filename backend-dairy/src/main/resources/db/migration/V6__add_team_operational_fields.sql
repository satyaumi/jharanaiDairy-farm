-- V6: Add operational & team management columns to users table and update farm brand to Jharanai Farm

-- Update existing default farm to Jharanai Farm
UPDATE farms
SET name = 'Jharanai Farm',
    code = 'JHF-01',
    email = 'info@jharanai.com',
    contact_number = '+91 98765 43210'
WHERE code = 'WCF-01' OR name = 'Willow Creek Dairy Farm';

-- Add team and operational fields to users table
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS department VARCHAR(100),
    ADD COLUMN IF NOT EXISTS job_position VARCHAR(100),
    ADD COLUMN IF NOT EXISTS assigned_area VARCHAR(100),
    ADD COLUMN IF NOT EXISTS shift VARCHAR(50),
    ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'Full-time',
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS joining_date DATE,
    ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(50),
    ADD COLUMN IF NOT EXISTS responsibilities TEXT,
    ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS invitation_token_expiry TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index on employee_id, status, and invitation_token
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token);

-- Update pre-seeded users if they exist
UPDATE users
SET employee_id = 'JHF-OWN-001',
    department = 'Executive',
    job_position = 'Farm Owner',
    status = 'ACTIVE',
    employment_status = 'Full-time',
    joining_date = '2022-01-01'
WHERE username = 'priya' AND (employee_id IS NULL OR employee_id = '');

UPDATE users
SET employee_id = 'JHF-MGT-001',
    department = 'Farm Operations',
    job_position = 'Operations Manager',
    status = 'ACTIVE',
    employment_status = 'Full-time',
    responsibilities = 'Daily milking schedule, feed distribution, inventory monitoring',
    joining_date = '2022-03-15'
WHERE username = 'rajesh' AND (employee_id IS NULL OR employee_id = '');

UPDATE users
SET employee_id = 'JHF-WRK-001',
    department = 'Milking',
    job_position = 'Milking Specialist',
    shift = 'Morning',
    assigned_area = 'Milking Parlor',
    status = 'ACTIVE',
    employment_status = 'Full-time',
    joining_date = '2022-06-01'
WHERE username = 'suresh' AND (employee_id IS NULL OR employee_id = '');

UPDATE users
SET employee_id = 'JHF-ADM-001',
    department = 'Administration',
    job_position = 'System Administrator',
    status = 'ACTIVE',
    employment_status = 'Full-time',
    joining_date = '2022-01-01'
WHERE username = 'admin' AND (employee_id IS NULL OR employee_id = '');
