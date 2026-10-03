-- V1: Create farms and users tables
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    contact_number VARCHAR(50),
    email VARCHAR(150),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(150),
    mobile_number VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT uk_user_farm_mobile UNIQUE (farm_id, mobile_number)
);

CREATE INDEX idx_users_farm_id ON users(farm_id);
CREATE INDEX idx_users_mobile_number ON users(mobile_number);
CREATE INDEX idx_users_email ON users(email);
