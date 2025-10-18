# Prompt pour vérifier la cohérence des DTOs

## Contexte
SecondLife Exchange utilise Zod comme source de vérité pour la validation des données, avec génération automatique de JSON Schemas.

## Instructions
Analyse les JSON Schemas générés dans `docs/schemas/` et propose des améliorations pour la cohérence et la sécurité.

### Points à vérifier :

1. **Règles de validation manquantes** :
   - `minLength`/`maxLength` pour les chaînes
   - `pattern` pour emails, URLs, formats spécifiques
   - `enum` pour les statuts d'échange
   - Politique de mot de passe forte (majuscule, minuscule, chiffre, spécial)

2. **Sécurité et conformité** :
   - Champs sensibles à journaliser/anonymiser (RGPD/OWASP)
   - Validation des IDs (format CUID)
   - Sanitisation des entrées utilisateur
   - Protection contre l'injection

3. **Tests supplémentaires suggérés** :
   - Edge cases sur l'authentification
   - Tests de charge sur les échanges
   - Validation des contraintes métier
   - Tests de sécurité (rate limiting, JWT)

4. **Cohérence des schémas** :
   - Correspondance entre Zod et class-validator
   - Types TypeScript générés correctement
   - Messages d'erreur cohérents
   - Exemples valides dans les schémas

### Format de réponse attendu :
- Liste des problèmes identifiés
- Suggestions d'amélioration
- Exemples de code corrigé
- Recommandations de tests

### Focus sur :
- Sécurité des mots de passe
- Validation des emails
- Gestion des erreurs
- Performance des requêtes
- Conformité RGPD
