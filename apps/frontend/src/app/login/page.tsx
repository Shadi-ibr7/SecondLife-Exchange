/**
 * FICHIER: app/login/page.tsx
 *
 * DESCRIPTION:
 * Ce fichier définit la page de connexion de l'application.
 * Elle permet aux utilisateurs de se connecter avec leur email et mot de passe.
 * Cette page est accessible publiquement et redirige automatiquement les utilisateurs
 * déjà connectés vers leur page de profil ou la page demandée.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Formulaire de connexion avec validation Zod (validation côté client)
 * - Affichage/masquage du mot de passe (toggle avec icône œil)
 * - Gestion des erreurs avec toast notifications (react-hot-toast)
 * - Redirection intelligente après connexion:
 *   - Vers la page demandée (paramètre 'next' dans l'URL)
 *   - Vers la page d'accueil (/) si aucun paramètre 'next'
 * - Lien vers la page d'inscription pour les nouveaux utilisateurs
 * - Suspense pour la gestion du SSR avec useSearchParams
 * - Animations Framer Motion pour une meilleure UX
 *
 * ARCHITECTURE:
 * - Composant principal: LoginPage (export default)
 * - Composant interne: LoginPageContent (enveloppé dans Suspense)
 * - Séparation nécessaire car useSearchParams nécessite Suspense avec SSR
 *
 * FLUX D'AUTHENTIFICATION:
 * 1. Utilisateur remplit le formulaire (email, password)
 * 2. Validation côté client avec Zod (email valide, password >= 10 caractères)
 * 3. Si validation OK, appel à login() du store auth
 * 4. Le store appelle l'API /auth/login
 * 5. L'API valide les identifiants et retourne les tokens
 * 6. Le store sauvegarde les tokens et met à jour l'état
 * 7. Redirection vers la page demandée ou la page d'accueil
 * 8. Toast de succès affiché
 *
 * SÉCURITÉ:
 * - Validation côté client avec Zod (évite les appels API inutiles)
 * - Validation côté serveur via l'API (double vérification)
 * - Mot de passe minimum 10 caractères (exigence de sécurité)
 * - Les mots de passe sont hashés côté serveur (bcrypt)
 * - Les tokens sont stockés dans localStorage (géré par apiClient)
 *
 * REDIRECTION:
 * - Paramètre 'next' dans l'URL: ?next=/profile
 * - Utilisé pour rediriger l'utilisateur après connexion
 * - Exemple: /login?next=/profile -> redirige vers /profile après connexion
 * - Si pas de paramètre 'next', redirige vers '/' (page d'accueil)
 *
 * UTILISATION:
 * - Accès direct: /login
 * - Avec redirection: /login?next=/profile
 * - Lien depuis d'autres pages: <Link href="/login">Se connecter</Link>
 *
 * @module app/login/page
 */

'use client';

// Import de React
import { useState, Suspense } from 'react';

// Import de Next.js
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Import de Framer Motion pour les animations
import { motion } from 'framer-motion';

// Import de React Hook Form pour la gestion du formulaire
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Import de Zod pour la validation
import { z } from 'zod';

// Import de react-hot-toast pour les notifications
import { toast } from 'react-hot-toast';

// Import des composants UI
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Import du store d'authentification
import { useAuthStore } from '@/store/auth';

// Import des icônes
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

/**
 * SCHÉMA DE VALIDATION: loginSchema
 *
 * Définit les règles de validation Zod pour le formulaire de connexion.
 * Ce schéma est utilisé par React Hook Form via zodResolver pour valider
 * les données du formulaire avant la soumission.
 *
 * RÈGLES DE VALIDATION:
 * - email: String, doit être un email valide (format email standard)
 * - password: String, minimum 10 caractères (exigence de sécurité)
 *
 * VALIDATION:
 * - Côté client: Zod valide avant l'envoi (évite les appels API inutiles)
 * - Côté serveur: L'API valide également (double vérification)
 *
 * MESSAGES D'ERREUR:
 * Tous les messages sont en français pour une meilleure UX.
 */
const loginSchema = z.object({
  /**
   * Email de l'utilisateur
   * - Type: string
   * - Validation: format email valide (ex: user@example.com)
   * - Message d'erreur: "Email invalide" si le format est incorrect
   *
   * EXEMPLES:
   * - "user@example.com" -> valide
   * - "invalid-email" -> invalide (erreur: "Email invalide")
   * - "user@" -> invalide (erreur: "Email invalide")
   */
  email: z.string().email('Email invalide'),

  /**
   * Mot de passe de l'utilisateur
   * - Type: string
   * - Validation: minimum 10 caractères (exigence de sécurité)
   * - Message d'erreur: "Le mot de passe doit contenir au moins 10 caractères"
   *
   * SÉCURITÉ:
   * - Minimum 10 caractères pour éviter les mots de passe trop courts
   * - Le mot de passe est hashé côté serveur avec bcrypt
   * - Le mot de passe n'est jamais stocké en clair
   *
   * EXEMPLES:
   * - "password123" (11 caractères) -> valide
   * - "pass123" (7 caractères) -> invalide (erreur: "Le mot de passe doit contenir au moins 10 caractères")
   */
  password: z
    .string()
    .min(10, 'Le mot de passe doit contenir au moins 10 caractères'),
});

/**
 * TYPE: LoginForm
 *
 * Type TypeScript dérivé du schéma Zod.
 */
type LoginForm = z.infer<typeof loginSchema>;

/**
 * COMPOSANT: LoginPageContent
 *
 * Contenu principal de la page de connexion.
 *
 * ARCHITECTURE:
 * - Composant interne (non exporté)
 * - Enveloppé dans Suspense par LoginPage
 * - Nécessaire car useSearchParams nécessite Suspense avec SSR
 *
 * FONCTIONNEMENT:
 * 1. Gère l'état local (affichage/masquage du mot de passe)
 * 2. Récupère les hooks et stores nécessaires
 * 3. Configure React Hook Form avec validation Zod
 * 4. Gère la soumission du formulaire
 * 5. Affiche le formulaire avec validation en temps réel
 *
 * POURQUOI SUSPENSE:
 * useSearchParams() nécessite un composant client avec Suspense
 * pour fonctionner correctement avec le Server-Side Rendering (SSR) de Next.js.
 * Sans Suspense, une erreur serait levée lors du SSR.
 */
function LoginPageContent() {
  // ============================================
  // GESTION DE L'ÉTAT LOCAL
  // ============================================

  /**
   * État pour afficher/masquer le mot de passe
   *
   * UTILISATION:
   * - true: Affiche le mot de passe en clair (type="text")
   * - false: Masque le mot de passe (type="password", affiche "••••••••")
   *
   * TOGGLE:
   * - Changé via le bouton avec icône œil (Eye/EyeOff)
   * - setShowPassword(!showPassword) inverse l'état
   *
   * UX:
   * - Permet à l'utilisateur de vérifier qu'il a tapé le bon mot de passe
   * - Améliore l'accessibilité (certains utilisateurs préfèrent voir le mot de passe)
   */
  const [showPassword, setShowPassword] = useState(false);

  // ============================================
  // RÉCUPÉRATION DES HOOKS ET STORES
  // ============================================

  /**
   * Récupération de la fonction login et de l'état isLoading depuis le store auth
   *
   * FONCTIONS:
   * - login: Fonction async qui appelle l'API /auth/login
   *   - Prend en paramètre { email, password }
   *   - Sauvegarde automatiquement les tokens dans localStorage
   *   - Met à jour l'état du store (user, isAuthenticated)
   *   - Lève une erreur si la connexion échoue
   *
   * ÉTATS:
   * - isLoading: true pendant l'appel API, false sinon
   *   - Utilisé pour désactiver le bouton de soumission pendant le chargement
   *   - Affiche "Connexion..." au lieu de "Se connecter"
   */
  const { login, isLoading } = useAuthStore();

  /**
   * Hook Next.js pour la navigation programmatique
   *
   * UTILISATION:
   * - router.push(path): Navigue vers une page sans rechargement
   * - Utilisé pour rediriger après connexion réussie
   *
   * EXEMPLE:
   * - router.push('/profile') -> navigue vers la page de profil
   * - router.push('/') -> navigue vers la page d'accueil
   */
  const router = useRouter();

  /**
   * Hook Next.js pour récupérer les paramètres de requête de l'URL
   *
   * UTILISATION:
   * - searchParams.get('next'): Récupère le paramètre 'next' de l'URL
   * - Exemple: /login?next=/profile -> searchParams.get('next') = "/profile"
   *
   * REDIRECTION:
   * - Si 'next' existe, redirige vers cette page après connexion
   * - Sinon, redirige vers '/' (page d'accueil)
   *
   * POURQUOI SUSPENSE:
   * useSearchParams() nécessite un composant enveloppé dans Suspense
   * pour fonctionner avec le SSR de Next.js.
   */
  const searchParams = useSearchParams();

  // ============================================
  // CONFIGURATION DU FORMULAIRE
  // ============================================

  /**
   * Configuration de React Hook Form avec validation Zod
   *
   * HOOKS UTILISÉS:
   * - register: Fonction pour enregistrer les champs du formulaire
   *   - Spread sur les inputs: {...register('email')}
   *   - Ajoute automatiquement onChange, onBlur, ref, etc.
   *   - Active la validation Zod pour ce champ
   *
   * - handleSubmit: Fonction wrapper pour gérer la soumission
   *   - Valide les données avec Zod avant d'appeler onSubmit
   *   - Si validation échoue, n'appelle pas onSubmit
   *   - Si validation réussit, appelle onSubmit avec les données validées
   *
   * - formState.errors: Objet contenant les erreurs de validation par champ
   *   - errors.email: Erreur pour le champ email (si existe)
   *   - errors.password: Erreur pour le champ password (si existe)
   *   - undefined si pas d'erreur
   *
   * VALIDATION:
   * - zodResolver(loginSchema): Utilise Zod pour valider les données
   * - Validation en temps réel (sur blur et submit)
   * - Messages d'erreur en français
   */
  const {
    register, // Fonction pour enregistrer les champs (spread sur les inputs)
    handleSubmit, // Fonction wrapper pour gérer la soumission avec validation
    formState: { errors }, // Erreurs de validation par champ
  } = useForm<LoginForm>({
    /**
     * Résolveur Zod pour la validation
     * zodResolver(loginSchema) valide les données selon le schéma Zod
     * Les erreurs sont automatiquement attachées aux champs correspondants
     */
    resolver: zodResolver(loginSchema),
  });

  // ============================================
  // FONCTION: onSubmit
  // ============================================

  /**
   * FONCTION: onSubmit
   *
   * Fonction appelée lors de la soumission du formulaire après validation.
   *
   * FLUX:
   * 1. Les données sont déjà validées par Zod (via handleSubmit)
   * 2. Appelle la fonction login() du store auth
   * 3. Le store appelle l'API /auth/login avec email et password
   * 4. L'API valide les identifiants et retourne les tokens + utilisateur
   * 5. Le store sauvegarde les tokens et met à jour l'état
   * 6. Affiche un toast de succès
   * 7. Récupère la page de redirection (paramètre 'next' ou '/')
   * 8. Redirige vers la page demandée
   *
   * GESTION D'ERREUR:
   * - Si login() échoue (mauvais identifiants, erreur réseau, etc.)
   * - Affiche un toast d'erreur avec message approprié
   * - L'utilisateur reste sur la page de connexion
   *
   * REDIRECTION:
   * - Si paramètre 'next' existe dans l'URL: redirige vers cette page
   * - Sinon: redirige vers '/' (page d'accueil)
   * - Exemple: /login?next=/profile -> redirige vers /profile
   *
   * @param data - Données du formulaire validées par Zod (email: string, password: string)
   */
  const onSubmit = async (data: LoginForm) => {
    try {
      /**
       * Appeler la fonction login du store auth
       *
       * login(data) fait:
       * 1. POST /auth/login avec email et password
       * 2. Le serveur valide les identifiants (compare avec bcrypt)
       * 3. Le serveur retourne accessToken, refreshToken, et user
       * 4. Le store sauvegarde les tokens dans localStorage
       * 5. Le store met à jour l'état (user, isAuthenticated)
       *
       * ERREUR:
       * - Si les identifiants sont incorrects: erreur 401
       * - Si erreur réseau: erreur réseau
       * - L'erreur est propagée et catchée dans le bloc catch
       */
      await login(data);

      /**
       * Afficher un toast de succès
       *
       * toast.success() affiche une notification verte en haut de l'écran
       * avec le message "Connexion réussie !"
       *
       * UX:
       * - Confirme visuellement à l'utilisateur que la connexion a réussi
       * - Disparaît automatiquement après quelques secondes
       */
      toast.success('Connexion réussie !');

      /**
       * Récupérer la page de redirection
       *
       * LOGIQUE:
       * - searchParams.get('next'): Récupère le paramètre 'next' de l'URL
       * - Si 'next' existe: utilise cette valeur
       * - Sinon: utilise '/' (page d'accueil) comme défaut
       *
       * EXEMPLES:
       * - /login?next=/profile -> next = "/profile"
       * - /login -> next = "/"
       */
      const next = searchParams.get('next') || '/';

      /**
       * Rediriger vers la page demandée
       *
       * router.push() navigue vers la page sans rechargement complet
       * (navigation côté client, plus rapide)
       *
       * NAVIGATION:
       * - Si next = "/profile": navigue vers la page de profil
       * - Si next = "/": navigue vers la page d'accueil
       */
      router.push(next);
    } catch (error) {
      /**
       * En cas d'erreur, afficher un toast d'erreur
       *
       * ERREURS POSSIBLES:
       * - Mauvais identifiants (email ou password incorrect)
       * - Erreur réseau (pas de connexion, serveur inaccessible)
       * - Erreur serveur (500, etc.)
       *
       * MESSAGE:
       * - "Email ou mot de passe incorrect" pour les erreurs d'authentification
       * - toast.error() affiche une notification rouge en haut de l'écran
       *
       * UX:
       * - L'utilisateur reste sur la page de connexion
       * - Peut corriger ses identifiants et réessayer
       */
      toast.error('Email ou mot de passe incorrect');
    }
  };

  // ============================================
  // RENDU DU COMPOSANT
  // ============================================

  /**
   * Rendu de la page de connexion
   *
   * STRUCTURE:
   * - Conteneur principal: div avec gradient de fond
   * - Carte animée: motion.div avec animation Framer Motion
   * - Card: Carte avec header et content
   * - Formulaire: form avec validation React Hook Form
   * - Champs: Email et mot de passe avec validation
   * - Bouton: Soumission avec état de chargement
   * - Lien: Vers la page d'inscription
   */
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      {/* Carte animée avec Framer Motion
       *
       * ANIMATIONS:
       * - initial: État initial (opacity: 0, y: 20) - invisible et décalé vers le bas
       * - animate: État final (opacity: 1, y: 0) - visible et à sa position
       * - transition: Durée de 0.6s pour une animation fluide
       *
       * STYLE:
       * - w-full max-w-md: Largeur complète avec maximum de 28rem (448px)
       * - Responsive: S'adapte à la taille de l'écran
       */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
            <CardDescription>
              Connectez-vous à votre compte SecondLife Exchange
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Formulaire avec validation React Hook Form
             *
             * handleSubmit(onSubmit):
             * - handleSubmit: wrapper de React Hook Form qui valide avant soumission
             * - onSubmit: fonction appelée si validation réussie
             *
             * space-y-4: espacement vertical de 1rem entre les champs
             */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* ============================================
                  CHAMP: Email
                  ============================================ */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                {/*
                 * Conteneur relatif pour l'icône et l'input
                 *
                 * relative: Position relative pour positionner l'icône en absolute
                 */}
                <div className="relative">
                  {/*
                   * Icône Mail positionnée en absolute
                   *
                   * STYLE:
                   * - absolute left-3 top-3: Position en haut à gauche
                   * - h-4 w-4: Taille de 16px
                   * - text-muted-foreground: Couleur atténuée
                   */}
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  {/*
                   * Input pour l'email
                   *
                   * {...register('email')}:
                   * - Enregistre le champ dans React Hook Form
                   * - Ajoute onChange, onBlur, ref, etc.
                   * - Active la validation Zod
                   *
                   * STYLE:
                   * - pl-10: Padding-left pour laisser de la place à l'icône
                   * - type="email": Type email pour validation HTML5
                   */}
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {/*
                 * Affichage de l'erreur de validation
                 *
                 * CONDITION:
                 * - Affiche seulement si errors.email existe
                 *
                 * MESSAGE:
                 * - errors.email.message: Message d'erreur du schéma Zod
                 * - Ex: "Email invalide" si le format est incorrect
                 */}
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* ============================================
                  CHAMP: Mot de passe
                  ============================================ */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Mot de passe
                </label>
                {/*
                 * Conteneur relatif pour l'icône, l'input et le bouton toggle
                 */}
                <div className="relative">
                  {/*
                   * Icône Lock positionnée en absolute à gauche
                   */}
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  {/*
                   * Input pour le mot de passe
                   *
                   * TYPE DYNAMIQUE:
                   * - showPassword === true: type="text" (affiche en clair)
                   * - showPassword === false: type="password" (masque avec "••••••••")
                   *
                   * STYLE:
                   * - pl-10: Padding-left pour l'icône Lock
                   * - pr-10: Padding-right pour le bouton toggle
                   *
                   * {...register('password')}:
                   * - Enregistre le champ dans React Hook Form
                   * - Active la validation Zod
                   */}
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    {...register('password')}
                  />
                  {/*
                   * Bouton pour afficher/masquer le mot de passe
                   *
                   * FONCTIONNEMENT:
                   * - type="button": Empêche le submit du formulaire
                   * - onClick: Inverse l'état showPassword
                   * - Affiche Eye si masqué, EyeOff si affiché
                   *
                   * STYLE:
                   * - absolute right-3 top-3: Position en haut à droite
                   * - h-4 w-4: Taille de 16px
                   * - hover:text-foreground: Change la couleur au survol
                   */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {/* Affichage de l'erreur de validation */}
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* ============================================
                  BOUTON DE SOUMISSION
                  ============================================ */}
              {/* Bouton de soumission du formulaire
               *
               * ÉTAT:
               * - disabled={isLoading}: Désactivé pendant le chargement
               * - Empêche les soumissions multiples
               *
               * TEXTE DYNAMIQUE:
               * - isLoading === true: "Connexion..." (pendant l'appel API)
               * - isLoading === false: "Se connecter" (état normal)
               *
               * STYLE:
               * - w-full: Largeur complète du conteneur
               * - type="submit": Déclenche la soumission du formulaire
               */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>

            {/* ============================================
                LIEN VERS L'INSCRIPTION
                ============================================ */}
            {/*
             * Section avec lien vers la page d'inscription
             *
             * UTILISATION:
             * - Pour les utilisateurs qui n'ont pas encore de compte
             * - Lien vers /register pour créer un compte
             *
             * STYLE:
             * - mt-6: Marge-top pour séparer du formulaire
             * - text-center: Centrage du texte
             */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Pas encore de compte ?{' '}
                {/*
                 * Lien vers la page d'inscription
                 *
                 * STYLE:
                 * - text-primary: Couleur primaire
                 * - hover:underline: Soulignement au survol
                 */}
                <Link href="/register" className="text-primary hover:underline">
                  Créer un compte
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/**
 * COMPOSANT: LoginPage
 *
 * Page de connexion principale (export default).
 *
 * ARCHITECTURE:
 * - Composant wrapper qui enveloppe LoginPageContent dans Suspense
 * - Nécessaire car useSearchParams() nécessite Suspense avec SSR
 *
 * POURQUOI SUSPENSE:
 * useSearchParams() est un hook client qui accède aux paramètres de requête.
 * Avec le Server-Side Rendering (SSR) de Next.js, ce hook doit être utilisé
 * dans un composant enveloppé dans Suspense pour éviter les erreurs lors
 * du rendu serveur.
 *
 * FALLBACK:
 * - Affiche un spinner de chargement pendant le SSR
 * - Visible seulement pendant le premier rendu (très court)
 * - Une fois le client hydraté, LoginPageContent s'affiche
 *
 * UTILISATION:
 * - Route: /login
 * - Accessible publiquement (pas de protection d'authentification)
 * - Redirige automatiquement les utilisateurs déjà connectés (géré par middleware)
 */
export default function LoginPage() {
  return (
    <>
      {/*
       * Suspense pour gérer useSearchParams avec SSR
       *
       * FONCTIONNEMENT:
       * - Suspense attend que useSearchParams soit disponible
       * - Pendant l'attente, affiche le fallback (spinner)
       * - Une fois prêt, affiche LoginPageContent
       *
       * FALLBACK:
       * - Spinner de chargement centré
       * - Visible seulement pendant le SSR (très court)
       */}
      <Suspense
        fallback={
          <>
            {/*
             * Affichage de chargement pendant le SSR
             *
             * STYLE:
             * - flex min-h-screen: Flexbox avec hauteur minimale de l'écran
             * - items-center justify-center: Centre verticalement et horizontalement
             *
             * SPINNER:
             * - h-32 w-32: Taille de 128px
             * - animate-spin: Animation de rotation infinie
             * - rounded-full: Forme circulaire
             * - border-b-2: Bordure en bas (2px)
             * - border-primary: Couleur primaire
             */}
            <div className="flex min-h-screen items-center justify-center">
              <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          </>
        }
      >
        {/*
         * Contenu principal de la page de connexion
         *
         * Ce composant utilise useSearchParams() pour récupérer
         * le paramètre 'next' de l'URL pour la redirection.
         */}
        <LoginPageContent />
      </Suspense>
    </>
  );
}
