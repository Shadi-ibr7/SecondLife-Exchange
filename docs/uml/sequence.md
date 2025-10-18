# Diagrammes de séquence - SecondLife Exchange

## Vue d'ensemble

Ce document présente les diagrammes de séquence pour les interactions principales de la plateforme SecondLife Exchange, décrivant le flux temporel des messages entre les différents composants du système.

## 1. Authentification utilisateur

### Connexion

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant JWT as JWT Service
    
    U->>F: Saisit email/mot de passe
    F->>B: POST /auth/login
    B->>DB: SELECT user WHERE email
    DB-->>B: User data
    B->>B: bcrypt.compare(password)
    alt Mot de passe correct
        B->>JWT: Generate access token
        B->>JWT: Generate refresh token
        JWT-->>B: Tokens
        B->>DB: INSERT refresh_token
        B-->>F: {user, accessToken, refreshToken}
        F->>F: localStorage.setItem(tokens)
        F-->>U: Redirection vers dashboard
    else Mot de passe incorrect
        B-->>F: 401 Unauthorized
        F-->>U: Message d'erreur
    end
```

### Inscription

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant JWT as JWT Service
    
    U->>F: Saisit informations
    F->>F: Validation Zod
    F->>B: POST /auth/register
    B->>DB: SELECT user WHERE email OR username
    alt Utilisateur existe déjà
        DB-->>B: User found
        B-->>F: 409 Conflict
        F-->>U: Message d'erreur
    else Utilisateur n'existe pas
        DB-->>B: No user found
        B->>B: bcrypt.hash(password)
        B->>DB: INSERT user
        DB-->>B: User created
        B->>JWT: Generate tokens
        JWT-->>B: Tokens
        B->>DB: INSERT refresh_token
        B-->>F: {user, accessToken, refreshToken}
        F->>F: localStorage.setItem(tokens)
        F-->>U: Redirection vers dashboard
    end
```

## 2. Gestion des objets

### Publication d'un objet

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant C as Cloudinary
    
    U->>F: Remplit formulaire objet
    F->>F: Validation Zod
    F->>C: Upload images
    C-->>F: Image URLs
    F->>B: POST /items
    Note over B: JWT Guard validation
    B->>B: Validate DTO
    B->>DB: INSERT item
    DB-->>B: Item created
    B-->>F: Item data
    F-->>U: Confirmation + redirection
```

### Recherche d'objets

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    
    U->>F: Saisit critères de recherche
    F->>B: GET /items?search=...&category=...
    B->>DB: SELECT items WHERE conditions
    DB-->>B: Items + pagination
    B-->>F: {items, pagination}
    F->>F: Render items list
    F-->>U: Affichage des résultats
```

## 3. Gestion des échanges

### Proposition d'échange

```mermaid
sequenceDiagram
    participant U1 as Utilisateur 1
    participant F1 as Frontend 1
    participant B as Backend
    participant DB as Database
    participant WS as WebSocket
    participant F2 as Frontend 2
    participant U2 as Utilisateur 2
    
    U1->>F1: Consulte objet
    F1->>B: GET /items/:id
    B->>DB: SELECT item
    DB-->>B: Item data
    B-->>F1: Item details
    U1->>F1: Clique "Proposer échange"
    F1->>B: POST /exchanges
    Note over B: JWT Guard validation
    B->>DB: SELECT item availability
    alt Objet disponible
        B->>DB: INSERT exchange
        DB-->>B: Exchange created
        B->>WS: Notify user 2
        WS-->>F2: Real-time notification
        F2-->>U2: Notification affichée
        B-->>F1: Exchange data
        F1-->>U1: Confirmation
    else Objet non disponible
        B-->>F1: 400 Bad Request
        F1-->>U1: Message d'erreur
    end
```

### Acceptation d'échange

```mermaid
sequenceDiagram
    participant U2 as Utilisateur 2
    participant F2 as Frontend 2
    participant B as Backend
    participant DB as Database
    participant WS as WebSocket
    participant F1 as Frontend 1
    participant U1 as Utilisateur 1
    
    U2->>F2: Consulte proposition
    F2->>B: GET /exchanges/:id
    B->>DB: SELECT exchange
    DB-->>B: Exchange data
    B-->>F2: Exchange details
    U2->>F2: Clique "Accepter"
    F2->>B: PATCH /exchanges/:id
    Note over B: JWT Guard + ownership validation
    B->>DB: UPDATE exchange status
    B->>DB: UPDATE item isAvailable = false
    DB-->>B: Updates completed
    B->>WS: Notify user 1
    WS-->>F1: Real-time notification
    F1-->>U1: Status update
    B-->>F2: Updated exchange
    F2-->>U2: Confirmation
```

## 4. Chat temps réel

### Envoi de message

```mermaid
sequenceDiagram
    participant U1 as Utilisateur 1
    participant F1 as Frontend 1
    participant WS as WebSocket Server
    participant B as Backend
    participant DB as Database
    participant F2 as Frontend 2
    participant U2 as Utilisateur 2
    
    U1->>F1: Saisit message
    F1->>WS: emit('send_message', {exchangeId, content})
    WS->>WS: Validate JWT token
    WS->>B: Validate exchange access
    B->>DB: SELECT exchange
    DB-->>B: Exchange data
    B-->>WS: Access granted
    WS->>DB: INSERT message
    DB-->>WS: Message saved
    WS->>WS: emit('new_message', messageData)
    WS-->>F1: Message confirmation
    WS-->>F2: Real-time message
    F1-->>U1: Message affiché
    F2-->>U2: Message reçu
```

### Connexion au chat

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant WS as WebSocket Server
    participant B as Backend
    participant DB as Database
    
    U->>F: Accède au chat
    F->>WS: connect with JWT token
    WS->>WS: Validate JWT token
    alt Token valide
        WS->>B: Validate user
        B->>DB: SELECT user
        DB-->>B: User data
        B-->>WS: User validated
        WS-->>F: Connection established
        F->>WS: emit('join_room', {exchangeId})
        WS->>B: Validate exchange access
        B-->>WS: Access granted
        WS->>WS: Join room
        WS-->>F: Room joined
        F-->>U: Chat interface active
    else Token invalide
        WS-->>F: Connection rejected
        F-->>U: Redirection vers login
    end
```

## 5. Suggestions IA

### Génération hebdomadaire automatique

```mermaid
sequenceDiagram
    participant Cron as Cron Job
    participant AI as AI Service
    participant G as Gemini API
    participant DB as Database
    
    Cron->>AI: Weekly trigger (Monday 9AM)
    AI->>DB: UPDATE weekly_themes SET isActive = false
    DB-->>AI: Previous themes deactivated
    AI->>G: Generate theme prompt
    G-->>AI: Theme JSON response
    AI->>AI: Parse theme data
    AI->>DB: INSERT weekly_theme
    DB-->>AI: Theme created
    AI->>G: Generate suggestions prompt
    G-->>AI: Suggestions JSON response
    AI->>AI: Parse suggestions data
    loop Pour chaque suggestion
        AI->>DB: INSERT suggested_item
    end
    DB-->>AI: All suggestions saved
    AI-->>Cron: Generation completed
```

### Consultation du thème actuel

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    
    U->>F: Accède à la page d'accueil
    F->>B: GET /ai/theme
    B->>DB: SELECT weekly_theme WHERE isActive = true
    alt Thème actif trouvé
        DB-->>B: Theme data
        B->>DB: SELECT suggested_items WHERE themeId
        DB-->>B: Suggestions data
        B-->>F: {theme, suggestedItems}
        F->>F: Render theme section
        F-->>U: Affichage du thème
    else Aucun thème actif
        DB-->>B: No active theme
        B->>B: Create default theme
        B->>DB: INSERT default theme + suggestions
        DB-->>B: Default data created
        B-->>F: Default theme data
        F-->>U: Affichage du thème par défaut
    end
```

## 6. Gestion des erreurs

### Gestion des erreurs réseau

```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    
    F->>B: API Request
    B->>DB: Database query
    alt Erreur de base de données
        DB-->>B: Database error
        B->>B: Log error
        B-->>F: 500 Internal Server Error
        F->>F: Show error message
    else Erreur de validation
        B->>B: Validation failed
        B-->>F: 400 Bad Request + details
        F->>F: Show validation errors
    else Erreur d'authentification
        B->>B: JWT validation failed
        B-->>F: 401 Unauthorized
        F->>F: Redirect to login
    end
```

### Refresh token automatique

```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    
    F->>B: API Request with expired token
    B->>B: JWT validation failed
    B-->>F: 401 Unauthorized
    F->>F: Intercept 401 response
    F->>B: POST /auth/refresh with refreshToken
    B->>DB: SELECT refresh_token
    alt Refresh token valide
        DB-->>B: Token found
        B->>B: Generate new tokens
        B->>DB: UPDATE refresh_token
        B-->>F: {accessToken, refreshToken}
        F->>F: Update localStorage
        F->>B: Retry original request
        B-->>F: Original response
    else Refresh token invalide
        DB-->>B: Token not found/expired
        B-->>F: 401 Unauthorized
        F->>F: Clear localStorage
        F->>F: Redirect to login
    end
```

Ces diagrammes de séquence décrivent le comportement détaillé du système SecondLife Exchange et servent de référence pour l'implémentation et les tests.
