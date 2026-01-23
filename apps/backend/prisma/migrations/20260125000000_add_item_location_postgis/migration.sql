-- Migration: Add location fields and PostGIS support to items
-- Description: Ajoute les champs de localisation (city, postalCode, department, region, lat/lng)
-- et le support PostGIS pour les requêtes géospatiales (distance, rayon)

-- 1. Activer l'extension PostGIS (si non déjà activée)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Ajouter les colonnes de localisation textuelles
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- 3. Ajouter la colonne PostGIS geography pour les requêtes géospatiales
-- Le type geography(Point, 4326) stocke des points GPS (SRID 4326 = WGS84)
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326);

-- 4. Créer les index pour les requêtes de recherche
CREATE INDEX IF NOT EXISTS "items_city_idx" ON "items"("city");
CREATE INDEX IF NOT EXISTS "items_postalCode_idx" ON "items"("postalCode");
CREATE INDEX IF NOT EXISTS "items_department_idx" ON "items"("department");

-- 5. Créer l'index GIST sur la colonne location pour les requêtes géospatiales
-- Cet index est ESSENTIEL pour les performances des requêtes ST_DWithin et ST_Distance
CREATE INDEX IF NOT EXISTS "items_location_gist_idx" ON "items" USING GIST ("location");

-- 6. Créer une fonction pour mettre à jour automatiquement la colonne location
-- quand latitude ou longitude sont modifiés
CREATE OR REPLACE FUNCTION update_item_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Si lat/lng sont fournis, créer le point PostGIS
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.location := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer le trigger pour appeler la fonction sur INSERT ou UPDATE
DROP TRIGGER IF EXISTS trigger_update_item_location ON "items";
CREATE TRIGGER trigger_update_item_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON "items"
  FOR EACH ROW
  EXECUTE FUNCTION update_item_location();

-- 8. Mettre à jour les items existants qui ont déjà lat/lng
-- (au cas où il y aurait des données avant cette migration)
UPDATE "items"
SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL AND "location" IS NULL;
