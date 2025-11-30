/**
 * FICHIER: app/register/page.tsx
 *
 * DESCRIPTION:
 * Ce fichier définit la page d'inscription de l'application.
 * Elle permet aux utilisateurs de créer un nouveau compte avec email,
 * nom d'affichage et mot de passe. Cette page est accessible publiquement
 * et redirige automatiquement les utilisateurs déjà connectés.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Formulaire d'inscription avec validation Zod (validation côté client)
 * - Champs: email, nom d'affichage, mot de passe, confirmation
 * - Validation de la correspondance des mots de passe (refine Zod)
 * - Affichage/masquage du mot de passe (toggle avec icône œil)
 * - Gestion des erreurs avec toast notifications (react-hot-toast)
 * - Redirection vers le profil après inscription réussie
 * - Lien vers la page de connexion pour les utilisateurs existants
 * - Animations Framer Motion pour une meilleure UX
 *
 * ARCHITECTURE:
 * - Composant unique: RegisterPage (export default)
 * - Pas besoin de Suspense (pas d'utilisation de useSearchParams)
 *
 * FLUX D'INSCRIPTION:
 * 1. Utilisateur remplit le formulaire (displayName, email, password, passwordConfirm)
 * 2. Validation côté client avec Zod:
 *    - Email valide
 *    - DisplayName >= 3 caractères
 *    - Password >= 10 caractères
 *    - PasswordConfirm === Password (validation personnalisée)
 * 3. Si validation OK, appel à register() du store auth
 * 4. Le store appelle l'API /auth/register
 * 5. L'API crée le compte (hash le password avec bcrypt)
 * 6. L'API retourne les tokens + utilisateur
 * 7. Le store sauvegarde les tokens et met à jour l'état
 * 8. Redirection vers la page de profil
 * 9. Toast de succès affiché
 *
 * SÉCURITÉ:
 * - Validation côté client avec Zod (évite les appels API inutiles)
 * - Validation côté serveur via l'API (double vérification)
 * - Mot de passe minimum 10 caractères (exigence de sécurité)
 * - Vérification de la correspondance des mots de passe (évite les erreurs de frappe)
 * - Les mots de passe sont hashés côté serveur (bcrypt, salt rounds)
 * - Les tokens sont stockés dans localStorage (géré par apiClient)
 *
 * VALIDATION PERSONNALISÉE:
 * - Utilise .refine() de Zod pour vérifier que password === passwordConfirm
 * - L'erreur est attachée au champ passwordConfirm
 * - Message: "Les mots de passe ne correspondent pas"
 *
 * UTILISATION:
 * - Accès direct: /register
 * - Lien depuis la page de connexion: <Link href="/register">Créer un compte</Link>
 *
 * @module app/register/page
 */

'use client';

// Import de React
import { useState } from 'react';

// Import de Next.js
import { useRouter } from 'next/navigation';
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
import { Eye, EyeOff, Mail, Lock, User, UserCheck } from 'lucide-react';

/**
 * SCHÉMA DE VALIDATION: registerSchema
 *
 * Définit les règles de validation Zod pour le formulaire d'inscription.
 * Ce schéma est utilisé par React Hook Form via zodResolver pour valider
 * les données du formulaire avant la soumission.
 *
 * RÈGLES DE VALIDATION:
 * - email: String, doit être un email valide (format email standard)
 * - displayName: String, minimum 3 caractères (nom d'affichage)
 * - password: String, minimum 10 caractères (exigence de sécurité)
 * - passwordConfirm: String (doit correspondre à password via refine)
 *
 * VALIDATION PERSONNALISÉE:
 * - .refine(): Vérifie que password === passwordConfirm
 * - L'erreur est attachée au champ passwordConfirm (path: ['passwordConfirm'])
 * - Message: "Les mots de passe ne correspondent pas"
 *
 * VALIDATION:
 * - Côté client: Zod valide avant l'envoi (évite les appels API inutiles)
 * - Côté serveur: L'API valide également (double vérification)
 *
 * MESSAGES D'ERREUR:
 * Tous les messages sont en français pour une meilleure UX.
 */
const registerSchema = z
  .object({
    /**
     * Email de l'utilisateur
     * - Type: string
     * - Validation: format email valide (ex: user@example.com)
     * - Message d'erreur: "Email invalide" si le format est incorrect
     *
     * EXEMPLES:
     * - "user@example.com" -> valide
     * - "invalid-email" -> invalide (erreur: "Email invalide")
     */
    email: z.string().email('Email invalide'),

    /**
     * Nom d'affichage de l'utilisateur
     * - Type: string
     * - Validation: minimum 3 caractères (évite les noms trop courts)
     * - Message d'erreur: "Le nom d'affichage doit contenir au moins 3 caractères"
     *
     * UTILISATION:
     * - Affiché dans le profil et les interactions
     * - Peut être modifié plus tard dans les paramètres
     *
     * EXEMPLES:
     * - "Jean Dupont" (11 caractères) -> valide
     * - "JD" (2 caractères) -> invalide (erreur: "Le nom d'affichage doit contenir au moins 3 caractères")
     */
    displayName: z
      .string()
      .min(3, "Le nom d'affichage doit contenir au moins 3 caractères"),

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

    /**
     * Confirmation du mot de passe
     * - Type: string
     * - Validation: doit correspondre à password (via refine)
     * - Message d'erreur: "Les mots de passe ne correspondent pas"
     *
     * UTILISATION:
     * - Permet à l'utilisateur de vérifier qu'il a tapé le bon mot de passe
     * - Évite les erreurs de frappe
     * - Non envoyé au serveur (retiré avant l'appel API)
     */
    passwordConfirm: z.string(),
  })
  /**
   * VALIDATION PERSONNALISÉE: Correspondance des mots de passe
   *
   * .refine() permet d'ajouter une validation personnalisée au schéma.
   *
   * FONCTIONNEMENT:
   * - (data) => data.password === data.passwordConfirm: Vérifie que les mots de passe correspondent
   * - Si la condition est false, l'erreur est levée
   * - path: ['passwordConfirm']: L'erreur est attachée au champ passwordConfirm
   * - message: Message d'erreur affiché à l'utilisateur
   *
   * EXEMPLES:
   * - password: "password123", passwordConfirm: "password123" -> valide
   * - password: "password123", passwordConfirm: "password456" -> invalide (erreur sur passwordConfirm)
   */
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['passwordConfirm'], // L'erreur sera attachée au champ passwordConfirm
  });

/**
 * TYPE: RegisterForm
 *
 * Type TypeScript dérivé du schéma Zod.
 */
type RegisterForm = z.infer<typeof registerSchema>;

/**
 * COMPOSANT: RegisterPage
 *
 * Page d'inscription de l'application.
 *
 * FONCTIONNEMENT:
 * 1. Gère l'état local (affichage/masquage du mot de passe)
 * 2. Récupère les hooks et stores nécessaires
 * 3. Configure React Hook Form avec validation Zod
 * 4. Gère la soumission du formulaire
 * 5. Affiche le formulaire avec validation en temps réel
 *
 * DIFFÉRENCE AVEC LOGIN:
 * - Pas besoin de Suspense (pas d'utilisation de useSearchParams)
 * - Validation supplémentaire: correspondance des mots de passe
 * - Champs supplémentaires: displayName, passwordConfirm
 * - Redirection fixe vers /profile (pas de paramètre 'next')
 */
export default function RegisterPage() {
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
   * APPLIQUÉ À:
   * - Champ password (mot de passe)
   * - Champ passwordConfirm (confirmation)
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
   * Récupération de la fonction register et de l'état isLoading depuis le store auth
   *
   * RENOMMAGE:
   * - register: renommé en registerUser pour éviter conflit avec register() de React Hook Form
   *
   * FONCTIONS:
   * - registerUser: Fonction async qui appelle l'API /auth/register
   *   - Prend en paramètre { email, displayName, password }
   *   - Sauvegarde automatiquement les tokens dans localStorage
   *   - Met à jour l'état du store (user, isAuthenticated)
   *   - Lève une erreur si l'inscription échoue
   *
   * ÉTATS:
   * - isLoading: true pendant l'appel API, false sinon
   *   - Utilisé pour désactiver le bouton de soumission pendant le chargement
   *   - Affiche "Création..." au lieu de "Créer mon compte"
   */
  const { register: registerUser, isLoading } = useAuthStore();

  /**
   * Hook Next.js pour la navigation programmatique
   *
   * UTILISATION:
   * - router.push(path): Navigue vers une page sans rechargement
   * - Utilisé pour rediriger vers /profile après inscription réussie
   *
   * REDIRECTION:
   * - Toujours vers /profile après inscription (pas de paramètre 'next')
   * - L'utilisateur peut ensuite modifier son profil s'il le souhaite
   */
  const router = useRouter();

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
   *   - NOTE: Ne pas confondre avec registerUser du store (renommé pour éviter conflit)
   *
   * - handleSubmit: Fonction wrapper pour gérer la soumission
   *   - Valide les données avec Zod avant d'appeler onSubmit
   *   - Si validation échoue, n'appelle pas onSubmit
   *   - Si validation réussit, appelle onSubmit avec les données validées
   *
   * - formState.errors: Objet contenant les erreurs de validation par champ
   *   - errors.email: Erreur pour le champ email (si existe)
   *   - errors.displayName: Erreur pour le champ displayName (si existe)
   *   - errors.password: Erreur pour le champ password (si existe)
   *   - errors.passwordConfirm: Erreur pour le champ passwordConfirm (si existe)
   *   - undefined si pas d'erreur
   *
   * VALIDATION:
   * - zodResolver(registerSchema): Utilise Zod pour valider les données
   * - Validation en temps réel (sur blur et submit)
   * - Messages d'erreur en français
   */
  const {
    register, // Fonction pour enregistrer les champs (spread sur les inputs)
    handleSubmit, // Fonction wrapper pour gérer la soumission avec validation
    formState: { errors }, // Erreurs de validation par champ
  } = useForm<RegisterForm>({
    /**
     * Résolveur Zod pour la validation
     * zodResolver(registerSchema) valide les données selon le schéma Zod
     * Les erreurs sont automatiquement attachées aux champs correspondants
     */
    resolver: zodResolver(registerSchema),
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
   * 2. Retire passwordConfirm des données (non nécessaire pour l'API)
   * 3. Appelle la fonction registerUser() du store auth
   * 4. Le store appelle l'API /auth/register avec email, displayName, password
   * 5. L'API crée le compte (hash le password avec bcrypt, valide l'email, etc.)
   * 6. L'API retourne les tokens + utilisateur
   * 7. Le store sauvegarde les tokens et met à jour l'état
   * 8. Affiche un toast de succès
   * 9. Redirige vers la page de profil (/profile)
   *
   * TRANSFORMATION DES DONNÉES:
   * - passwordConfirm est retiré avant l'envoi (non nécessaire pour l'API)
   * - Seuls email, displayName, et password sont envoyés
   *
   * GESTION D'ERREUR:
   * - Si registerUser() échoue (email déjà utilisé, erreur réseau, etc.)
   * - Affiche un toast d'erreur avec message approprié
   * - L'utilisateur reste sur la page d'inscription
   *
   * REDIRECTION:
   * - Toujours vers /profile après inscription réussie
   * - L'utilisateur peut ensuite modifier son profil s'il le souhaite
   *
   * @param data - Données du formulaire validées par Zod (email, displayName, password, passwordConfirm)
   */
  const onSubmit = async (data: RegisterForm) => {
    try {
      /**
       * Retirer passwordConfirm des données
       *
       * POURQUOI:
       * - passwordConfirm est utilisé uniquement pour la validation côté client
       * - L'API n'a pas besoin de cette valeur (seul password est nécessaire)
       * - Évite d'envoyer des données inutiles
       *
       * DESTRUCTURING:
       * - const { passwordConfirm, ...registerData }: Extrait passwordConfirm et garde le reste
       * - registerData contient: { email, displayName, password }
       */
      const { passwordConfirm, ...registerData } = data;

      /**
       * Appeler la fonction registerUser du store auth
       *
       * registerUser(registerData) fait:
       * 1. POST /auth/register avec email, displayName, password
       * 2. Le serveur crée le compte (hash le password avec bcrypt, valide l'email, etc.)
       * 3. Le serveur retourne accessToken, refreshToken, et user
       * 4. Le store sauvegarde les tokens dans localStorage
       * 5. Le store met à jour l'état (user, isAuthenticated)
       *
       * ERREUR:
       * - Si email déjà utilisé: erreur 409 (Conflict)
       * - Si erreur réseau: erreur réseau
       * - L'erreur est propagée et catchée dans le bloc catch
       */
      await registerUser(registerData);

      /**
       * Afficher un toast de succès
       *
       * toast.success() affiche une notification verte en haut de l'écran
       * avec le message "Compte créé avec succès !"
       *
       * UX:
       * - Confirme visuellement à l'utilisateur que l'inscription a réussi
       * - Disparaît automatiquement après quelques secondes
       */
      toast.success('Compte créé avec succès !');

      /**
       * Rediriger vers la page de profil
       *
       * router.push() navigue vers la page sans rechargement complet
       * (navigation côté client, plus rapide)
       *
       * NAVIGATION:
       * - /profile: Page de profil où l'utilisateur peut voir et modifier ses informations
       * - L'utilisateur est maintenant connecté (tokens sauvegardés)
       */
      router.push('/profile');
    } catch (error) {
      /**
       * En cas d'erreur, afficher un toast d'erreur
       *
       * ERREURS POSSIBLES:
       * - Email déjà utilisé (erreur 409 Conflict)
       * - Erreur réseau (pas de connexion, serveur inaccessible)
       * - Erreur serveur (500, etc.)
       *
       * MESSAGE:
       * - "Erreur lors de la création du compte" pour toutes les erreurs
       * - toast.error() affiche une notification rouge en haut de l'écran
       *
       * UX:
       * - L'utilisateur reste sur la page d'inscription
       * - Peut corriger ses informations et réessayer
       *
       * NOTE:
       * Le message d'erreur spécifique du serveur pourrait être affiché
       * en utilisant error.response?.data?.message si disponible
       */
      toast.error('Erreur lors de la création du compte');
    }
  };

  // ============================================
  // RENDU DU COMPOSANT
  // ============================================

  /**
   * Rendu de la page d'inscription
   *
   * STRUCTURE:
   * - Conteneur principal: div avec gradient de fond
   * - Carte animée: motion.div avec animation Framer Motion
   * - Card: Carte avec header et content
   * - Formulaire: form avec validation React Hook Form
   * - Champs: Nom d'affichage, Email, Mot de passe, Confirmation
   * - Bouton: Soumission avec état de chargement
   * - Lien: Vers la page de connexion
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
            <CardTitle className="text-2xl font-bold">
              Créer un compte
            </CardTitle>
            <CardDescription>
              Rejoignez la communauté SecondLife Exchange
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
                  CHAMP: Nom d'affichage
                  ============================================ */}
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium">
                  Nom d'affichage *
                </label>
                <div className="relative">
                  {/* Icône User positionnée en absolute */}
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  {/* Input pour le nom d'affichage
                   *
                   * {...register('displayName')}:
                   * - Enregistre le champ dans React Hook Form
                   * - Ajoute onChange, onBlur, ref, etc.
                   * - Active la validation Zod
                   *
                   * STYLE:
                   * - pl-10: Padding-left pour laisser de la place à l'icône
                   */}
                  <Input
                    id="displayName"
                    placeholder="Jean Dupont"
                    className="pl-10"
                    {...register('displayName')}
                  />
                </div>
                {/* Affichage de l'erreur de validation */}
                {errors.displayName && (
                  <p className="text-sm text-destructive">
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              {/* ============================================
                  CHAMP: Email
                  ============================================ */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email *
                </label>
                <div className="relative">
                  {/* Icône Mail positionnée en absolute */}
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  {/* Input pour l'email
                   *
                   * {...register('email')}:
                   * - Enregistre le champ dans React Hook Form
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
                {/* Affichage de l'erreur de validation */}
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
                  Mot de passe *
                </label>
                <div className="relative">
                  {/* Icône Lock positionnée en absolute à gauche */}
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  {/* Input pour le mot de passe
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
                  {/* Bouton pour afficher/masquer le mot de passe
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
                  CHAMP: Confirmation du mot de passe
                  ============================================ */}
              <div className="space-y-2">
                <label
                  htmlFor="passwordConfirm"
                  className="text-sm font-medium"
                >
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  {/* Icône Lock positionnée en absolute à gauche */}
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  {/* Input pour la confirmation du mot de passe
                   *
                   * TYPE DYNAMIQUE:
                   * - showPassword === true: type="text" (affiche en clair)
                   * - showPassword === false: type="password" (masque avec "••••••••")
                   *
                   * STYLE:
                   * - pl-10: Padding-left pour l'icône Lock
                   * - Pas de pr-10 (pas de bouton toggle sur ce champ)
                   *
                   * {...register('passwordConfirm')}:
                   * - Enregistre le champ dans React Hook Form
                   * - Active la validation Zod (y compris la validation personnalisée refine)
                   *
                   * VALIDATION:
                   * - Vérifie que passwordConfirm === password (via refine)
                   * - L'erreur est attachée à ce champ si les mots de passe ne correspondent pas
                   */}
                  <Input
                    id="passwordConfirm"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10"
                    {...register('passwordConfirm')}
                  />
                </div>
                {/* Affichage de l'erreur de validation
                 *
                 * ERREURS POSSIBLES:
                 * - Erreur de validation Zod (si le champ est vide, etc.)
                 * - Erreur de validation personnalisée (si passwordConfirm !== password)
                 *   - Message: "Les mots de passe ne correspondent pas"
                 */}
                {errors.passwordConfirm && (
                  <p className="text-sm text-destructive">
                    {errors.passwordConfirm.message}
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
               * - isLoading === true: "Création..." (pendant l'appel API)
               * - isLoading === false: "Créer mon compte" (état normal)
               *
               * STYLE:
               * - w-full: Largeur complète du conteneur
               * - type="submit": Déclenche la soumission du formulaire
               */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Création...' : 'Créer mon compte'}
              </Button>
            </form>

            {/* ============================================
                LIEN VERS LA CONNEXION
                ============================================ */}
            {/* Section avec lien vers la page de connexion
             *
             * UTILISATION:
             * - Pour les utilisateurs qui ont déjà un compte
             * - Lien vers /login pour se connecter
             *
             * STYLE:
             * - mt-6: Marge-top pour séparer du formulaire
             * - text-center: Centrage du texte
             */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Déjà un compte ?{' '}
                {/* Lien vers la page de connexion
                 *
                 * STYLE:
                 * - text-primary: Couleur primaire
                 * - hover:underline: Soulignement au survol
                 */}
                <Link href="/login" className="text-primary hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
