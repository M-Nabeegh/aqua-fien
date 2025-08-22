-- AquaFine Database Schema for Supabase (Clean Import)
-- This script handles existing objects gracefully

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create custom types (with IF NOT EXISTS equivalent)
DO $$ BEGIN
    CREATE TYPE customer_ledger_summary AS (
        total_advances numeric(12,2),
        total_sales numeric(12,2),
        remaining numeric(12,2),
        status text
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employee_ledger_summary AS (
        salary numeric(12,2),
        total_advances numeric(12,2),
        remaining numeric(12,2),
        status text
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employee_type_enum AS ENUM (
        'worker',
        'manager',
        'rider'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE expenditure_category_enum AS ENUM (
        'transportation',
        'administrative',
        'maintenance',
        'utilities',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE period_financials_row AS (
        revenue numeric(12,2),
        expenses numeric(12,2),
        net_income numeric(12,2)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_category_enum AS ENUM (
        'standard',
        'premium',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rider_kpi_row AS (
        employee_id bigint,
        activity_date date,
        empty_bottles_received integer,
        filled_bottles_sent integer,
        filled_product_bought_back integer,
        accountability integer,
        efficiency_rate numeric(6,2)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create domains
DO $$ BEGIN
    CREATE DOMAIN phone_dom AS text
        CONSTRAINT phone_dom_check CHECK ((VALUE ~ '^\+?[0-9]{10,15}$'::text));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE DOMAIN pk_money_dom AS numeric(12,2)
        CONSTRAINT pk_money_dom_check CHECK ((VALUE >= (0)::numeric));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE DOMAIN positive_int_dom AS integer
        CONSTRAINT positive_int_dom_check CHECK ((VALUE > 0));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
