# Pages Publiques - SecondLife Exchange

Ce document liste toutes les pages publiques disponibles sur SecondLife Exchange et explique où modifier leur contenu.

## 📍 Structure des dossiers

Toutes les pages publiques se trouvent dans :
```
apps/frontend/src/app/(public)/
```

Les composants partagés sont dans :
```
apps/frontend/src/components/public/
```

---

## 📋 Liste des pages

### À propos

| Route | Fichier | Description |
|-------|---------|-------------|
| `/a-propos/notre-mission` | `(public)/a-propos/notre-mission/page.tsx` | Mission et vision de SecondLife Exchange |
| `/a-propos/equipe` | `(public)/a-propos/equipe/page.tsx` | Présentation de l'équipe |
| `/a-propos/impact-ecologique` | `(public)/a-propos/impact-ecologique/page.tsx` | Impact environnemental et statistiques |
| `/a-propos/partenaires` | `(public)/a-propos/partenaires/page.tsx` | Partenaires et collaborations |

### Communauté

| Route | Fichier | Description |
|-------|---------|-------------|
| `/communaute/guide-echange` | `(public)/communaute/guide-echange/page.tsx` | Guide étape par étape pour les échanges |
| `/communaute/regles` | `(public)/communaute/regles/page.tsx` | Règles et comportements attendus |
| `/communaute/blog` | `(public)/communaute/blog/page.tsx` | Articles et actualités |
| `/communaute/evenements` | `(public)/communaute/evenements/page.tsx` | Événements à venir et passés |

### Aide

| Route | Fichier | Description |
|-------|---------|-------------|
| `/aide/faq` | `(public)/aide/faq/page.tsx` | Questions fréquentes (accordéon) |
| `/aide/contact` | `(public)/aide/contact/page.tsx` | Formulaire de contact |
| `/aide/securite` | `(public)/aide/securite/page.tsx` | Conseils de sécurité |
| `/aide/signaler` | `(public)/aide/signaler/page.tsx` | Formulaire de signalement |

### Légal

| Route | Fichier | Description |
|-------|---------|-------------|
| `/legal/conditions-utilisation` | `(public)/legal/conditions-utilisation/page.tsx` | CGU |
| `/legal/confidentialite` | `(public)/legal/confidentialite/page.tsx` | Politique de confidentialité (RGPD) |
| `/legal/cookies` | `(public)/legal/cookies/page.tsx` | Politique des cookies |

---

## 🔧 Comment modifier le contenu

### Modifier le texte d'une page

1. Ouvrez le fichier `page.tsx` correspondant
2. Les données sont généralement dans des constantes en haut du fichier (ex: `sections`, `faqs`, `team`)
3. Modifiez le contenu directement dans ces constantes
4. Les modifications sont visibles après un refresh de la page

### Exemple : Modifier la FAQ

```typescript
// Dans apps/frontend/src/app/(public)/aide/faq/page.tsx

const faqs = [
  {
    category: 'Premiers pas',
    questions: [
      {
        q: 'Comment créer un compte sur SecondLife Exchange ?',
        a: 'Votre nouvelle réponse ici...',
      },
      // Ajouter de nouvelles questions ici
    ],
  },
];
```

### Exemple : Ajouter un membre d'équipe

```typescript
// Dans apps/frontend/src/app/(public)/a-propos/equipe/page.tsx

const team = [
  // ... membres existants
  {
    name: 'Nouveau Membre',
    role: 'Son Rôle',
    bio: 'Sa biographie...',
    avatar: '👨‍💼', // Emoji comme placeholder
    linkedin: '#',
    github: '#',
  },
];
```

### Exemple : Ajouter un article de blog

```typescript
// Dans apps/frontend/src/app/(public)/communaute/blog/page.tsx

const articles = [
  // ... articles existants
  {
    id: 'mon-nouvel-article',
    title: 'Titre de l\'article',
    excerpt: 'Résumé court...',
    category: 'Guide', // ou 'Tendances', 'Écologie', 'Témoignage', 'Actualités'
    author: 'Nom de l\'auteur',
    date: '17 janvier 2026',
    readTime: '5 min',
    image: '📝', // Emoji comme placeholder
  },
];
```

---

## 🎨 Composants partagés

### PageHero
Bannière de titre pour les pages publiques.

```typescript
import { PageHero } from '@/components/public/page-hero';

<PageHero
  icon={HelpCircle}
  badge="Centre d'aide"
  badgeColor="info" // 'primary' | 'eco' | 'warning' | 'info'
  title="Questions fréquentes"
  subtitle="Description de la page..."
/>
```

### CTASection
Call-to-action en fin de page.

```typescript
import { CTASection } from '@/components/public/cta-section';

<CTASection
  icon={Heart}
  title="Rejoignez le mouvement"
  description="Sous-titre explicatif..."
  primaryAction={{ label: 'Commencer', href: '/register' }}
  secondaryAction={{ label: 'En savoir plus', href: '/a-propos/notre-mission' }}
  variant="eco" // optionnel, pour un style vert
/>
```

---

## 🛡️ Sécurité

### Routes publiques vs Admin

- **Routes publiques** (`/a-propos/*`, `/aide/*`, etc.) : accessibles à tous
- **Routes admin** (`/${ADMIN_BASE_PATH}/*`) : protégées par `AdminGuard`

Le middleware (`middleware.ts`) s'assure que :
1. Les routes publiques ne redirigent **jamais** vers l'admin
2. Les routes admin nécessitent un token valide

### Footer

Le footer (`src/components/layout/footer.tsx`) contient les liens vers les pages publiques. Aucun lien ne pointe vers l'admin.

---

## 📱 Responsive

Toutes les pages sont responsive et suivent l'approche mobile-first :
- Breakpoints : `sm` (640px), `md` (768px), `lg` (1024px)
- Grilles adaptatives avec `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Padding adaptatif avec `px-4 sm:px-8`

---

## 🌐 SEO

Chaque page définit ses métadonnées :

```typescript
export const metadata: Metadata = {
  title: 'Titre de la page | SecondLife Exchange',
  description: 'Description pour les moteurs de recherche.',
};
```

Pour les pages client (`'use client'`), les métadonnées doivent être définies dans un fichier `layout.tsx` parent ou via `generateMetadata`.

---

## 📝 Notes

- Les pages Blog et Événements utilisent des données mock (placeholder)
- Pour connecter à un vrai backend, remplacez les constantes par des appels API
- Les formulaires (contact, signaler) simulent l'envoi mais ne sont pas connectés à un backend
