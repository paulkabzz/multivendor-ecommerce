-- PostgreSQL syntax for conditional database creation
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ecommerce') THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE ecommerce');
    END IF;
END $$;