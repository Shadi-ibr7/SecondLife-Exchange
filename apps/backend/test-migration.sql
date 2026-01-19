-- Test: Vérifier si la colonne actorRole existe déjà
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'admin_logs' AND column_name = 'actorRole';
