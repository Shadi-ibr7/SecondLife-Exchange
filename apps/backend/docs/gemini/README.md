# Documentation Gemini pour SecondLife Exchange API

Ce dossier contient les prompts et la documentation générée via Gemini pour l'API SecondLife Exchange.

## Structure

- `prompts/` - Prompts pour générer la documentation
- `schemas/` - Schémas JSON générés automatiquement depuis Zod
- `../postman/` - Collection Postman générée automatiquement

## Utilisation

1. **Générer les schémas JSON** :
   ```bash
   npm run schemas:build
   ```

2. **Générer la collection Postman** :
   ```bash
   npm run postman:build
   ```

3. **Utiliser les prompts Gemini** :
   - Copiez le contenu des fichiers dans `prompts/`
   - Utilisez-les avec Gemini pour générer la documentation

## Workflow

1. **Zod** → Schémas de validation (source de vérité)
2. **Scripts** → Génération automatique des JSON Schemas et Postman
3. **Gemini** → Documentation lisible à partir des schémas
4. **Postman** → Tests manuels de l'API
