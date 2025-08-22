-- Production Database Setup Script
-- Run this on your production PostgreSQL database

-- Create the database (if not exists)
CREATE DATABASE aquafine_production;

\c aquafine_production;

-- Enable Row Level Security
ALTER DATABASE aquafine_production SET row_security = on;

-- Create tables (copy from your existing schema)
-- You'll need to export your current schema and run it here

-- Example: Export your current schema
-- pg_dump -s aquafine > schema.sql
-- Then run: psql -d aquafine_production -f schema.sql

-- Create production user
CREATE USER aquafine_prod WITH PASSWORD 'your_secure_password_here';
GRANT CONNECT ON DATABASE aquafine_production TO aquafine_prod;
GRANT USAGE ON SCHEMA public TO aquafine_prod;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO aquafine_prod;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO aquafine_prod;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aquafine_prod;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO aquafine_prod;
