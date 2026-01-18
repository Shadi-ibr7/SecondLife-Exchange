# Configuration Observabilité - SecondLife Exchange Backend

Ce document récapitule les changements apportés pour améliorer l'observabilité du backend en production.

## Installation des Dépendances

Avant de déployer, installez les dépendances suivantes :

```bash
cd apps/backend
npm install nestjs-pino pino-http
```

**Note** : `uuid` est déjà installé et utilisé pour générer les RequestId.

## Fichiers Créés

### 1. Middleware RequestId

**Fichier** : `src/common/middleware/request-id.middleware.ts`

- Génère un UUID unique pour chaque requête HTTP
- Utilise le header `X-Request-Id` s'il est présent
- Ajoute `X-Request-Id` dans la réponse HTTP
- Attache `requestId` à `req` pour utilisation dans les services/intercepteurs

### 2. Interceptor HTTP Logging

**Fichier** : `src/common/interceptors/http-logging.interceptor.ts`

- Remplace l'ancien `LoggingInterceptor`
- Logs structurés avec requestId, userId, méthode, route, status, duration
- Niveaux appropriés : info (2xx, 3xx), warn (4xx), error (5xx)
- Ne logue jamais les données sensibles

### 3. Logger Structuré

**Fichier** : `src/common/logger/structured-logger.service.ts`

- Format JSON en production pour faciliter le parsing
- Format lisible en développement
- Support des niveaux : debug, info, warn, error

## Fichiers Modifiés

### 1. main.ts

**Changements** :
- Ajout du middleware `RequestIdMiddleware` (appliqué avant CORS)
- Remplacement de `LoggingInterceptor` par `HttpLoggingInterceptor`
- Remplacement des `console.log/error/warn` par le logger structuré
- Mise à jour des routes `/health/ready` pour retourner 503 si non ready

### 2. health.service.ts

**Changements** :
- Ajout du champ `version` dans `HealthResponse`
- Version récupérée depuis `process.env.APP_VERSION` ou `1.0.0` par défaut

### 3. health.controller.ts et health-no-prefix.controller.ts

**Changements** :
- `/health/ready` retourne maintenant 503 si `status === 'not_ready'`
- 200 si `status === 'ready'`

### 4. ecosystem.config.js

**Changements** :
- Ajout de commentaires pour la rotation des logs PM2
- Configuration recommandée pour `pm2-logrotate`

## Documentation

### README_ops.md

**Fichier** : `docs/README_ops.md`

Documentation complète pour :
- Logging et observabilité
- Monitoring avec PM2
- Health checks
- Alertes de base
- Commandes utiles
- Troubleshooting

## Variables d'Environnement

### Optionnel

**APP_VERSION** : Version de l'application (affichée dans `/health`)

Exemple :
```bash
APP_VERSION=1.0.0
```

Si non défini, la version par défaut est `1.0.0`.

## Utilisation

### Vérifier les Logs

```bash
# Logs en temps réel
pm2 logs secondlife-backend

# Voir les logs avec requestId
pm2 logs secondlife-backend | grep "550e8400-e29b-41d4-a716-446655440000"
```

### Health Checks

```bash
# Vérifier la santé
curl http://localhost:4000/health

# Vérifier la readiness (retourne 503 si non ready)
curl http://localhost:4000/health/ready
```

### Monitoring

```bash
# Monitoring en temps réel
pm2 monit

# Statut de l'application
pm2 status
```

## Format des Logs

### En Développement

```
[HttpLoggingInterceptor] INFO: {"type":"http_request_end","requestId":"550e8400-e29b-41d4-a716-446655440000","method":"GET","path":"/api/v1/users/me","statusCode":200,"duration":45,"userId":"user-123"}
```

### En Production

```json
{
  "timestamp": "2024-01-18T15:30:45.123Z",
  "level": "info",
  "context": "HttpLoggingInterceptor",
  "type": "http_request_end",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "path": "/api/v1/users/me",
  "statusCode": 200,
  "duration": 45,
  "userId": "user-123"
}
```

## Prochaines Étapes

1. **Installer les dépendances** : `npm install nestjs-pino pino-http`
2. **Configurer PM2 log rotation** : `pm2 install pm2-logrotate`
3. **Configurer un service de monitoring** (UptimeRobot, etc.) pour surveiller `/health`
4. **Configurer des alertes** pour les erreurs 5xx et l'uptime

## Notes

- Les `console.log/error/warn` dans `env.validation.ts` sont conservés car ils sont utilisés avant le démarrage de l'application
- Les logs sensibles sont automatiquement filtrés (passwords, tokens, etc.)
- Le `requestId` est propagé dans tous les logs liés à une même requête
- Les logs sont formatés en JSON en production pour faciliter le parsing par des outils d'analyse