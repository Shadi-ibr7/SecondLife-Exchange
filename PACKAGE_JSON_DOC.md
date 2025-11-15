# Documentation: package.json (Racine du projet)

## Description

Ce fichier est le fichier de configuration principal du projet (monorepo).
Il définit les métadonnées du projet, les scripts npm/pnpm, et les dépendances
de développement partagées entre tous les sous-projets.

## Structure du monorepo

- C'est un monorepo utilisant pnpm workspaces
- Les applications sont dans le dossier apps/
- Ce fichier gère les scripts globaux et les outils de développement

## Scripts disponibles

### `pnpm dev`
Lance les serveurs de développement (backend + frontend).
Le flag `-w` signifie "workspace root" (exécute dans tous les workspaces).

### `pnpm build`
Compile tous les projets pour la production.

### `pnpm lint`
Vérifie la qualité du code avec ESLint.

### `pnpm typecheck`
Vérifie les erreurs TypeScript sans compiler.

### `pnpm format`
Formate automatiquement tout le code avec Prettier.
Le flag `-w` signifie "write" (écrit les changements dans les fichiers).

### `pnpm format:check`
Vérifie si le code est bien formaté (sans modifier).
Utilisé dans CI/CD pour vérifier que le code est formaté.

### `pnpm prepare`
Script automatiquement exécuté après `pnpm install`.
Installe les hooks Git (Husky) pour vérifier le code avant les commits.

### `pnpm postinstall`
Script exécuté après l'installation des dépendances.
Affiche un message de confirmation.

### `pnpm test:services`
Teste la connexion aux APIs externes (Gemini, Cloudinary, Firebase).

### `pnpm test:gemini`
Test spécifique de l'API Gemini (IA).

### `pnpm test:cloudinary`
Test spécifique de Cloudinary (gestion d'images).

### `pnpm test:firebase`
Test spécifique de Firebase (notifications push).

## Dépendances de développement

Ces packages sont nécessaires uniquement pour le développement.
Ils ne sont pas inclus dans le build de production.

- **@types/node**: Types TypeScript pour Node.js (pour l'autocomplétion et la vérification de types)
- **@typescript-eslint/eslint-plugin**: Plugin ESLint pour les règles TypeScript
- **@typescript-eslint/parser**: Parser ESLint pour analyser le code TypeScript
- **eslint**: Outil de linting (vérification de la qualité du code)
- **eslint-config-prettier**: Configuration ESLint qui désactive les règles qui entrent en conflit avec Prettier
- **eslint-plugin-prettier**: Plugin ESLint pour intégrer Prettier dans ESLint
- **husky**: Outil pour gérer les Git hooks (scripts exécutés automatiquement avant/après Git)
- **lint-staged**: Exécute des commandes (lint, format) uniquement sur les fichiers modifiés. Améliore les performances en ne vérifiant que ce qui a changé.
- **prettier**: Formateur de code automatique (indentation, espaces, etc.)
- **typescript**: Langage de programmation typé qui compile en JavaScript

## Versions requises

- **Node.js**: >= 20.0.0
- **pnpm**: >= 8.0.0
- **packageManager**: pnpm@8.15.0 (version exacte utilisée)

## Configuration lint-staged

Définit quelles commandes exécuter sur quels types de fichiers.
Ces commandes s'exécutent automatiquement avant chaque commit Git.

- **Fichiers TypeScript/JavaScript**: ESLint corrige automatiquement les erreurs simples, puis Prettier formate le code
- **Fichiers de configuration (JSON, Markdown, YAML)**: Seul Prettier formate (pas de linting)

