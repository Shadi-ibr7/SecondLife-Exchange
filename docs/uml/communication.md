# Diagrammes de communication - SecondLife Exchange

## Vue d'ensemble

Ce document présente les diagrammes de communication pour la plateforme SecondLife Exchange, décrivant les interactions entre les différents composants du système et les protocoles de communication utilisés.

## 1. Architecture de communication globale

```mermaid
graph TB
    subgraph "Client Layer"
        PWA[PWA Next.js]
        Mobile[Mobile Browser]
        Desktop[Desktop Browser]
    end
    
    subgraph "API Gateway"
        LB[Load Balancer]
        SSL[SSL Termination]
    end
    
    subgraph "Application Layer"
        Frontend[Frontend Server]
        Backend[Backend API]
        WS[WebSocket Server]
    end
    
    subgraph "Service Layer"
        Auth[Auth Service]
        Items[Items Service]
        Exchanges[Exchanges Service]
        Chat[Chat Service]
        AI[AI Service]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        Cache[(Redis)]
        Files[File Storage]
    end
    
    subgraph "External Services"
        Gemini[Gemini API]
        Cloudinary[Cloudinary API]
        FCM[Firebase FCM]
    end
    
    PWA -.->|HTTPS/WSS| LB
    Mobile -.->|HTTPS/WSS| LB
    Desktop -.->|HTTPS/WSS| LB
    LB --> SSL
    SSL --> Frontend
    SSL --> Backend
    SSL --> WS
    Frontend -.->|HTTP/2| Backend
    Backend -.->|HTTP/2| Auth
    Backend -.->|HTTP/2| Items
    Backend -.->|HTTP/2| Exchanges
    WS -.->|WebSocket| Chat
    Backend -.->|HTTP/2| AI
    Auth -.->|TCP| DB
    Items -.->|TCP| DB
    Exchanges -.->|TCP| DB
    Chat -.->|TCP| Cache
    AI -.->|HTTPS| Gemini
    Items -.->|HTTPS| Cloudinary
    Backend -.->|HTTPS| FCM
```

## 2. Protocoles de communication

### Frontend ↔ Backend

```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend
    
    Note over F,B: HTTP/2 avec JWT Authentication
    
    F->>B: GET /api/v1/items
    Note right of F: Headers: Authorization: Bearer <token>
    B-->>F: 200 OK + JSON data
    
    F->>B: POST /api/v1/exchanges
    Note right of F: Headers: Authorization: Bearer <token><br/>Content-Type: application/json
    B-->>F: 201 Created + JSON data
    
    F->>B: PATCH /api/v1/exchanges/:id
    Note right of F: Headers: Authorization: Bearer <token><br/>Content-Type: application/json
    B-->>F: 200 OK + JSON data
```

### WebSocket Communication

```mermaid
sequenceDiagram
    participant F as Frontend
    participant WS as WebSocket Server
    participant B as Backend
    participant DB as Database
    
    Note over F,WS: WebSocket avec JWT Authentication
    
    F->>WS: connect(token)
    WS->>WS: validate JWT
    WS-->>F: connection established
    
    F->>WS: join_room({exchangeId})
    WS->>B: validate exchange access
    B->>DB: check permissions
    DB-->>B: access granted
    B-->>WS: permission confirmed
    WS-->>F: room joined
    
    F->>WS: send_message({exchangeId, content})
    WS->>DB: save message
    DB-->>WS: message saved
    WS->>WS: broadcast to room
    WS-->>F: message delivered
```

## 3. Communication avec les services externes

### Intégration Gemini AI

```mermaid
sequenceDiagram
    participant AI as AI Service
    participant G as Gemini API
    participant DB as Database
    
    Note over AI,G: HTTPS avec API Key
    
    AI->>G: POST /v1beta/models/gemini-1.5-pro-latest:generateContent
    Note right of AI: Headers: Authorization: Bearer <api_key><br/>Content-Type: application/json
    G-->>AI: 200 OK + Generated content
    
    AI->>AI: Parse JSON response
    AI->>DB: INSERT weekly_theme
    AI->>DB: INSERT suggested_items
    
    Note over AI,DB: Batch operations pour performance
```

### Intégration Cloudinary

```mermaid
sequenceDiagram
    participant F as Frontend
    participant C as Cloudinary API
    participant B as Backend
    
    Note over F,C: HTTPS avec credentials
    
    F->>C: POST /v1_1/{cloud_name}/image/upload
    Note right of F: FormData avec image + signature
    C-->>F: 200 OK + Image URL
    
    F->>B: POST /api/v1/items
    Note right of F: JSON avec image URLs
    B-->>F: 201 Created + Item data
```

## 4. Communication inter-services

### Service d'authentification

```mermaid
graph TB
    subgraph "Auth Service"
        JWT[JWT Service]
        BCrypt[BCrypt Service]
        Refresh[Refresh Token Service]
    end
    
    subgraph "Other Services"
        Items[Items Service]
        Exchanges[Exchanges Service]
        Chat[Chat Service]
    end
    
    subgraph "Database"
        Users[(Users Table)]
        Tokens[(Refresh Tokens)]
    end
    
    JWT -.->|Validate tokens| Items
    JWT -.->|Validate tokens| Exchanges
    JWT -.->|Validate tokens| Chat
    BCrypt -.->|Hash passwords| Users
    Refresh -.->|Manage tokens| Tokens
    Items -.->|Check ownership| Users
    Exchanges -.->|Check permissions| Users
    Chat -.->|Check access| Users
```

### Service de chat temps réel

```mermaid
sequenceDiagram
    participant C1 as Client 1
    participant C2 as Client 2
    participant WS as WebSocket Server
    participant Chat as Chat Service
    participant Auth as Auth Service
    participant DB as Database
    
    C1->>WS: connect(token1)
    WS->>Auth: validate token1
    Auth-->>WS: user1 validated
    WS-->>C1: connected
    
    C2->>WS: connect(token2)
    WS->>Auth: validate token2
    Auth-->>WS: user2 validated
    WS-->>C2: connected
    
    C1->>WS: join_room(exchangeId)
    WS->>Chat: check access(user1, exchangeId)
    Chat->>DB: SELECT exchange
    DB-->>Chat: exchange data
    Chat-->>WS: access granted
    WS-->>C1: room joined
    
    C2->>WS: join_room(exchangeId)
    WS->>Chat: check access(user2, exchangeId)
    Chat-->>WS: access granted
    WS-->>C2: room joined
    
    C1->>WS: send_message(content)
    WS->>Chat: save message
    Chat->>DB: INSERT message
    DB-->>Chat: message saved
    Chat-->>WS: message ready
    WS->>WS: broadcast to room
    WS-->>C1: message sent
    WS-->>C2: message received
```

## 5. Patterns de communication

### Request-Response Pattern

```mermaid
graph LR
    Client[Client] -->|Request| Server[Server]
    Server -->|Response| Client
    
    Note over Client,Server: HTTP REST API<br/>Synchronous communication
```

### Publish-Subscribe Pattern

```mermaid
graph TB
    Publisher[Publisher] -->|Publish| Broker[Message Broker]
    Broker -->|Subscribe| Subscriber1[Subscriber 1]
    Broker -->|Subscribe| Subscriber2[Subscriber 2]
    Broker -->|Subscribe| Subscriber3[Subscriber 3]
    
    Note over Publisher,Subscriber3: WebSocket rooms<br/>Real-time notifications
```

### Event-Driven Pattern

```mermaid
sequenceDiagram
    participant E as Exchange Service
    participant N as Notification Service
    participant WS as WebSocket Service
    participant C as Client
    
    E->>E: Exchange status changed
    E->>N: emit('exchange.updated', data)
    N->>WS: broadcast notification
    WS-->>C: real-time update
```

## 6. Gestion des erreurs et retry

### Circuit Breaker Pattern

```mermaid
stateDiagram-v2
    [*] --> Closed
    Closed --> Open : Failure threshold reached
    Open --> HalfOpen : Timeout period
    HalfOpen --> Closed : Success
    HalfOpen --> Open : Failure
    
    note right of Closed : Normal operation
    note right of Open : Failing fast
    note right of HalfOpen : Testing recovery
```

### Retry avec backoff exponentiel

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Service
    
    C->>S: Request
    S-->>C: 500 Error
    C->>C: Wait 1s
    C->>S: Retry Request
    S-->>C: 500 Error
    C->>C: Wait 2s
    C->>S: Retry Request
    S-->>C: 200 Success
    
    Note over C,S: Exponential backoff<br/>Max 3 retries
```

## 7. Monitoring et observabilité

### Logging structuré

```mermaid
graph TB
    subgraph "Application"
        Frontend[Frontend App]
        Backend[Backend API]
        WS[WebSocket Server]
    end
    
    subgraph "Logging"
        Logger[Structured Logger]
        Logs[Log Aggregation]
    end
    
    subgraph "Monitoring"
        Metrics[Metrics Collection]
        Alerts[Alerting System]
    end
    
    Frontend -->|JSON logs| Logger
    Backend -->|JSON logs| Logger
    WS -->|JSON logs| Logger
    Logger --> Logs
    Logger --> Metrics
    Metrics --> Alerts
```

### Health checks

```mermaid
sequenceDiagram
    participant LB as Load Balancer
    participant App as Application
    participant DB as Database
    participant Cache as Redis
    
    LB->>App: GET /health
    App->>DB: SELECT 1
    DB-->>App: OK
    App->>Cache: PING
    Cache-->>App: PONG
    App-->>LB: 200 OK + health status
    
    Note over LB,App: Health check every 30s
```

## 8. Sécurité des communications

### Chiffrement en transit

```mermaid
graph TB
    Client[Client] -->|HTTPS/TLS 1.3| LB[Load Balancer]
    LB -->|HTTP/2| App[Application]
    App -->|TLS| DB[Database]
    App -->|TLS| Cache[Redis]
    App -->|HTTPS| External[External APIs]
    
    Note over Client,External : End-to-end encryption<br/>Perfect Forward Secrecy
```

### Validation des tokens JWT

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API Gateway
    participant S as Service
    
    C->>A: Request + JWT token
    A->>A: Validate JWT signature
    A->>A: Check expiration
    A->>A: Verify issuer
    alt Token valid
        A->>S: Forward request
        S-->>A: Response
        A-->>C: Response
    else Token invalid
        A-->>C: 401 Unauthorized
    end
```

Ces diagrammes de communication décrivent l'architecture de communication complète de SecondLife Exchange, garantissant une communication sécurisée, performante et fiable entre tous les composants du système.
