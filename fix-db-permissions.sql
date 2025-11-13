-- Script de correction des permissions PostgreSQL pour SecondLife Exchange
-- À exécuter dans le conteneur Docker PostgreSQL

-- Donner toutes les permissions sur le schéma public
GRANT ALL ON SCHEMA public TO postgres;

-- Donner toutes les permissions sur toutes les tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

-- Donner toutes les permissions sur toutes les séquences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Donner les permissions par défaut pour les futures tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

-- Donner les permissions sur la base de données elle-même
ALTER DATABASE secondlife OWNER TO postgres;

