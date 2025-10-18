# Prompt pour générer la documentation API

## Contexte
SecondLife Exchange est une plateforme d'échange d'objets entre utilisateurs avec authentification JWT, gestion de profils et historique des échanges.

## Instructions
Tu es un tech writer expert. À partir des fichiers JSON Schema dans `docs/schemas/` et de la collection Postman `postman/secondlife-exchange.postman_collection.json`, rédige une documentation claire et complète pour chaque route de l'API.

### Structure attendue pour chaque endpoint :

1. **Méthode et chemin** (ex: `POST /api/v1/auth/register`)
2. **Description** (2-3 phrases expliquant le but)
3. **Authentification** (requise/optionnelle)
4. **Paramètres** :
   - Path parameters
   - Query parameters  
   - Body (avec exemples JSON valides)
5. **Réponses** :
   - 200/201 (succès) avec exemple de réponse
   - 400 (erreur de validation)
   - 401 (non authentifié)
   - 403 (non autorisé)
   - 404 (non trouvé)
   - 429 (rate limit)
   - 500 (erreur serveur)
6. **Exemples d'utilisation** (curl ou JavaScript)

### Contraintes importantes :
- Inclure des exemples JSON valides pour chaque statut de réponse
- Signaler les incohérences éventuelles entre Postman et les schémas
- Mentionner les contraintes de sécurité (rate limiting, validation)
- Expliquer les codes d'erreur et messages normalisés
- Prévenir les fuites d'informations sensibles

### Endpoints à documenter :
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion  
- `POST /api/v1/auth/refresh` - Renouvellement token
- `POST /api/v1/auth/logout` - Déconnexion
- `GET /api/v1/users/me` - Profil utilisateur
- `PATCH /api/v1/users/me` - Mise à jour profil
- `DELETE /api/v1/users/me` - Suppression compte
- `POST /api/v1/exchanges` - Créer échange
- `GET /api/v1/exchanges/me` - Mes échanges
- `GET /api/v1/exchanges/:id` - Détail échange
- `PATCH /api/v1/exchanges/:id/status` - Modifier statut

Génère une documentation professionnelle, claire et prête à être utilisée par des développeurs.
