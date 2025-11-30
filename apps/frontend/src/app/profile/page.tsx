/**
 * FICHIER: app/profile/page.tsx
 *
 * DESCRIPTION:
 * Ce fichier définit la page de profil de l'utilisateur.
 * Elle permet de consulter et modifier les informations personnelles,
 * gérer l'avatar, voir les statistiques, et effectuer des actions
 * sur le compte (déconnexion, suppression). Cette page est protégée
 * et accessible uniquement aux utilisateurs authentifiés.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Affichage des informations du profil (nom, email, bio, localisation)
 * - Mode édition pour modifier le profil (toggle édition/consultation)
 * - Upload d'avatar via Cloudinary (composant AvatarUpload)
 * - Statistiques utilisateur (items publiés, échanges initiés/reçus)
 * - Actions rapides (publier un objet, explorer)
 * - Zone de danger (suppression de compte avec confirmation)
 * - Déconnexion avec redirection
 *
 * ARCHITECTURE:
 * - Composant principal: ProfilePage (export default)
 * - Composant interne: ProfilePageContent (enveloppé dans ProtectedRoute)
 * - ProtectedRoute: Vérifie l'authentification et redirige si nécessaire
 *
 * FLUX DE MODIFICATION:
 * 1. Utilisateur clique sur "Modifier" (active isEditing)
 * 2. Les champs deviennent éditables (inputs au lieu de texte)
 * 3. Utilisateur modifie les informations
 * 4. Upload d'avatar (optionnel, via AvatarUpload)
 * 5. Soumission du formulaire avec validation Zod
 * 6. Appel à updateProfile() du store auth
 * 7. Le store appelle l'API /users/me (PUT)
 * 8. Le store met à jour l'état local
 * 9. Désactivation du mode édition
 * 10. Toast de succès affiché
 *
 * GESTION DE L'AVATAR:
 * - Composant AvatarUpload gère l'upload vers Cloudinary
 * - URL de l'avatar sauvegardée dans avatarUrl
 * - Synchronisation avec React Hook Form via setValue
 * - Affichage conditionnel (avatar ou initiales)
 *
 * SÉCURITÉ:
 * - Route protégée via ProtectedRoute (nécessite authentification)
 * - Validation des données avec Zod (côté client)
 * - Validation côté serveur via l'API (double vérification)
 * - Confirmation obligatoire avant suppression de compte (AlertDialog)
 * - Suppression irréversible (action critique)
 *
 * VALIDATION:
 * - displayName: minimum 3 caractères (requis)
 * - bio: optionnel (string)
 * - location: optionnel (string)
 * - avatarUrl: optionnel (URL valide ou chaîne vide)
 *
 * UTILISATION:
 * - Route: /profile
 * - Accessible uniquement aux utilisateurs authentifiés
 * - Redirection automatique vers /login si non authentifié
 *
 * @module app/profile/page
 */

'use client';

// Import de React
import { useState, useEffect } from 'react';

// Import de Next.js
import { useRouter } from 'next/navigation';

// Import de Framer Motion pour les animations
import { motion } from 'framer-motion';

// Import de React Hook Form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Import de Zod pour la validation
import { z } from 'zod';

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
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Import des types
import { User, UpdateProfileDto } from '@/types';

// Import du store d'authentification
import { useAuthStore } from '@/store/auth';

// Import de react-hot-toast
import { toast } from 'react-hot-toast';

// Import des icônes
import {
  User as UserIcon,
  Mail,
  MapPin,
  Edit3,
  LogOut,
  Trash2,
} from 'lucide-react';

// Import des composants
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import ProtectedRoute from '../(auth)/protected';

/**
 * SCHÉMA DE VALIDATION: profileSchema
 *
 * Définit les règles de validation Zod pour le formulaire de profil.
 * Ce schéma est utilisé par React Hook Form via zodResolver pour valider
 * les données du formulaire avant la soumission.
 *
 * RÈGLES DE VALIDATION:
 * - displayName: String, minimum 3 caractères (requis)
 * - bio: String (optionnel)
 * - location: String (optionnel)
 * - avatarUrl: String, URL valide ou chaîne vide (optionnel)
 *
 * VALIDATION:
 * - Côté client: Zod valide avant l'envoi (évite les appels API inutiles)
 * - Côté serveur: L'API valide également (double vérification)
 *
 * MESSAGES D'ERREUR:
 * Tous les messages sont en français pour une meilleure UX.
 */
const profileSchema = z.object({
  /**
   * Nom d'affichage de l'utilisateur
   * - Type: string
   * - Validation: minimum 3 caractères (évite les noms trop courts)
   * - Message d'erreur: "Le nom d'affichage doit contenir au moins 3 caractères"
   * - Requis: oui
   *
   * UTILISATION:
   * - Affiché dans le profil et les interactions
   * - Peut être modifié à tout moment
   *
   * EXEMPLES:
   * - "Jean Dupont" (11 caractères) -> valide
   * - "JD" (2 caractères) -> invalide (erreur: "Le nom d'affichage doit contenir au moins 3 caractères")
   */
  displayName: z
    .string()
    .min(3, "Le nom d'affichage doit contenir au moins 3 caractères"),

  /**
   * Biographie de l'utilisateur
   * - Type: string
   * - Validation: aucune (optionnel)
   * - Peut être vide ou non renseignée
   *
   * UTILISATION:
   * - Permet à l'utilisateur de se présenter
   * - Affichée dans le profil public
   * - Peut être modifiée à tout moment
   */
  bio: z.string().optional(),

  /**
   * Localisation de l'utilisateur
   * - Type: string
   * - Validation: aucune (optionnel)
   * - Peut être vide ou non renseignée
   *
   * UTILISATION:
   * - Permet d'indiquer la ville/région
   * - Utile pour les échanges locaux
   * - Peut être modifiée à tout moment
   */
  location: z.string().optional(),

  /**
   * URL de l'avatar de l'utilisateur
   * - Type: string
   * - Validation: URL valide ou chaîne vide (optionnel)
   * - Message d'erreur: "URL invalide" si le format est incorrect
   *
   * GESTION:
   * - Upload via AvatarUpload (Cloudinary)
   * - URL sauvegardée après upload réussi
   * - Peut être vide (pas d'avatar)
   *
   * VALIDATION:
   * - .url('URL invalide'): Vérifie que c'est une URL valide
   * - .optional(): Permet undefined
   * - .or(z.literal('')): Permet aussi une chaîne vide
   *
   * EXEMPLES:
   * - "https://res.cloudinary.com/..." -> valide
   * - "" -> valide (pas d'avatar)
   * - "invalid-url" -> invalide (erreur: "URL invalide")
   */
  avatarUrl: z.string().url('URL invalide').optional().or(z.literal('')),
});

/**
 * TYPE: ProfileForm
 *
 * Type TypeScript dérivé du schéma Zod.
 */
type ProfileForm = z.infer<typeof profileSchema>;

/**
 * COMPOSANT: ProfilePageContent
 *
 * Contenu principal de la page de profil.
 *
 * ARCHITECTURE:
 * - Composant interne (non exporté)
 * - Enveloppé dans ProtectedRoute par ProfilePage
 * - Nécessaire car ProtectedRoute vérifie l'authentification
 *
 * FONCTIONNEMENT:
 * 1. Récupère les données utilisateur depuis le store auth
 * 2. Gère l'état local (mode édition)
 * 3. Configure React Hook Form avec validation Zod
 * 4. Synchronise le formulaire avec les données utilisateur
 * 5. Gère la soumission du formulaire
 * 6. Gère les actions (déconnexion, suppression de compte)
 * 7. Affiche le formulaire avec validation en temps réel
 *
 * MODE ÉDITION:
 * - isEditing === true: Les champs sont éditables (inputs)
 * - isEditing === false: Les champs sont en lecture seule (texte)
 * - Toggle via le bouton "Modifier" / "Annuler"
 */
function ProfilePageContent() {
  // ============================================
  // RÉCUPÉRATION DES HOOKS ET STORES
  // ============================================

  /**
   * Récupération des fonctions et de l'état depuis le store auth
   *
   * DONNÉES:
   * - user: Objet User complet avec toutes les informations
   *   - Contient: id, email, displayName, bio, location, avatarUrl, etc.
   *   - null si non authentifié (ne devrait pas arriver grâce à ProtectedRoute)
   *
   * FONCTIONS:
   * - updateProfile: Fonction async qui met à jour le profil
   *   - Prend en paramètre { displayName, bio, location, avatarUrl }
   *   - Appelle l'API PUT /users/me
   *   - Met à jour l'état du store (user)
   *   - Lève une erreur si la mise à jour échoue
   *
   * - logout: Fonction async qui déconnecte l'utilisateur
   *   - Supprime les tokens du localStorage
   *   - Réinitialise l'état du store (user, isAuthenticated)
   *   - Lève une erreur si la déconnexion échoue
   *
   * - deleteAccount: Fonction async qui supprime le compte
   *   - Appelle l'API DELETE /users/me
   *   - Supprime toutes les données utilisateur
   *   - Action irréversible
   *   - Lève une erreur si la suppression échoue
   *
   * ÉTATS:
   * - isLoading: true pendant les appels API, false sinon
   *   - Utilisé pour désactiver les boutons pendant le chargement
   *   - Affiche "Sauvegarde..." au lieu de "Sauvegarder"
   */
  const { user, updateProfile, logout, deleteAccount, isLoading } =
    useAuthStore();

  /**
   * Hook Next.js pour la navigation programmatique
   *
   * UTILISATION:
   * - router.push(path): Navigue vers une page sans rechargement
   * - Utilisé pour rediriger après déconnexion/suppression
   *
   * REDIRECTION:
   * - Après déconnexion: vers '/' (page d'accueil)
   * - Après suppression: vers '/' (page d'accueil)
   */
  const router = useRouter();

  // ============================================
  // GESTION DE L'ÉTAT LOCAL
  // ============================================

  /**
   * État pour contrôler le mode édition
   *
   * UTILISATION:
   * - true: Mode édition activé (champs éditables)
   * - false: Mode consultation (champs en lecture seule)
   *
   * TOGGLE:
   * - Changé via le bouton "Modifier" / "Annuler"
   * - setIsEditing(!isEditing) inverse l'état
   *
   * IMPACT:
   * - Affiche des inputs au lieu de texte si isEditing === true
   * - Active/désactive le composant AvatarUpload
   * - Affiche/masque les boutons de sauvegarde
   *
   * UX:
   * - Permet de modifier le profil sans quitter la page
   * - Annulation possible pour revenir à l'état initial
   */
  const [isEditing, setIsEditing] = useState(false);

  // ============================================
  // CONFIGURATION DU FORMULAIRE
  // ============================================

  /**
   * Configuration de React Hook Form avec validation Zod
   *
   * HOOKS UTILISÉS:
   * - register: Fonction pour enregistrer les champs du formulaire
   *   - Spread sur les inputs: {...register('displayName')}
   *   - Ajoute automatiquement onChange, onBlur, ref, etc.
   *   - Active la validation Zod pour ce champ
   *
   * - handleSubmit: Fonction wrapper pour gérer la soumission
   *   - Valide les données avec Zod avant d'appeler onSubmit
   *   - Si validation échoue, n'appelle pas onSubmit
   *   - Si validation réussit, appelle onSubmit avec les données validées
   *
   * - formState.errors: Objet contenant les erreurs de validation par champ
   *   - errors.displayName: Erreur pour le champ displayName (si existe)
   *   - errors.bio: Erreur pour le champ bio (si existe)
   *   - errors.location: Erreur pour le champ location (si existe)
   *   - errors.avatarUrl: Erreur pour le champ avatarUrl (si existe)
   *   - undefined si pas d'erreur
   *
   * - reset: Fonction pour réinitialiser le formulaire
   *   - Utilisée pour synchroniser avec les données utilisateur
   *   - Appelée dans useEffect quand user change
   *
   * - setValue: Fonction pour définir les valeurs programmatiquement
   *   - Utilisée pour mettre à jour avatarUrl après upload
   *   - Appelée par AvatarUpload.onUploadComplete
   *
   * - watch: Fonction pour observer les valeurs
   *   - Utilisée pour surveiller avatarUrl
   *   - Retourne la valeur actuelle et déclenche un re-render si elle change
   *
   * VALIDATION:
   * - zodResolver(profileSchema): Utilise Zod pour valider les données
   * - Validation en temps réel (sur blur et submit)
   * - Messages d'erreur en français
   *
   * VALEURS PAR DÉFAUT:
   * - Initialisées avec les données de l'utilisateur (user)
   * - Chaînes vides si les valeurs n'existent pas
   * - Synchronisées via useEffect quand user change
   */
  const {
    register, // Fonction pour enregistrer les champs (spread sur les inputs)
    handleSubmit, // Fonction wrapper pour gérer la soumission avec validation
    formState: { errors }, // Erreurs de validation par champ
    reset, // Fonction pour réinitialiser le formulaire
    setValue, // Fonction pour définir les valeurs programmatiquement
    watch, // Fonction pour observer les valeurs
  } = useForm<ProfileForm>({
    /**
     * Résolveur Zod pour la validation
     * zodResolver(profileSchema) valide les données selon le schéma Zod
     * Les erreurs sont automatiquement attachées aux champs correspondants
     */
    resolver: zodResolver(profileSchema),

    /**
     * Valeurs par défaut du formulaire
     *
     * INITIALISATION:
     * - Utilise les données de l'utilisateur (user) si disponibles
     * - Chaînes vides ('') si les valeurs n'existent pas
     *
     * SYNCHRONISATION:
     * - Mises à jour via useEffect quand user change
     * - reset() est appelé pour synchroniser le formulaire
     */
    defaultValues: {
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      location: user?.location || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  /**
   * Observer la valeur de avatarUrl pour la passer à AvatarUpload
   *
   * UTILISATION:
   * - watch('avatarUrl') retourne la valeur actuelle de avatarUrl
   * - Utilisée comme prop currentAvatarUrl pour AvatarUpload
   * - Déclenche un re-render si la valeur change
   *
   * FLUX:
   * 1. Utilisateur upload un avatar via AvatarUpload
   * 2. AvatarUpload.onUploadComplete est appelé avec la nouvelle URL
   * 3. setValue('avatarUrl', url) met à jour la valeur dans le formulaire
   * 4. watch('avatarUrl') retourne la nouvelle valeur
   * 5. AvatarUpload reçoit la nouvelle URL et l'affiche
   */
  const avatarUrl = watch('avatarUrl');

  // ============================================
  // EFFET: Synchronisation avec l'utilisateur
  // ============================================

  // ============================================
  // EFFET: Synchronisation avec l'utilisateur
  // ============================================

  /**
   * EFFET: Synchronise le formulaire avec les données de l'utilisateur
   *
   * DÉCLENCHEMENT:
   * - Quand user change (mise à jour du profil, connexion, etc.)
   * - Quand reset change (référence de fonction, rare)
   *
   * FONCTIONNEMENT:
   * 1. Vérifie que user existe (pas null)
   * 2. Appelle reset() avec les nouvelles données utilisateur
   * 3. Le formulaire est réinitialisé avec les valeurs actuelles
   *
   * UTILISATION:
   * - Synchronise le formulaire après mise à jour du profil
   * - Assure que le formulaire reflète toujours les données actuelles
   * - Évite les incohérences entre le formulaire et les données utilisateur
   *
   * EXEMPLE:
   * - Utilisateur modifie son profil -> user est mis à jour
   * - useEffect détecte le changement -> reset() est appelé
   * - Le formulaire affiche les nouvelles valeurs
   */
  useEffect(() => {
    if (user) {
      /**
       * Réinitialiser le formulaire avec les données utilisateur
       *
       * reset() met à jour toutes les valeurs du formulaire
       * et réinitialise l'état de validation
       *
       * VALEURS:
       * - displayName: Nom d'affichage actuel ou chaîne vide
       * - bio: Biographie actuelle ou chaîne vide
       * - location: Localisation actuelle ou chaîne vide
       * - avatarUrl: URL de l'avatar actuelle ou chaîne vide
       */
      reset({
        displayName: user.displayName || '',
        bio: user.bio || '',
        location: user.location || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user, reset]);

  // ============================================
  // FONCTION: onSubmit
  // ============================================

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
   * 2. Appelle la fonction updateProfile() du store auth
   * 3. Le store appelle l'API PUT /users/me avec les nouvelles données
   * 4. L'API met à jour le profil dans la base de données
   * 5. L'API retourne l'utilisateur mis à jour
   * 6. Le store met à jour l'état (user)
   * 7. Affiche un toast de succès
   * 8. Désactive le mode édition (isEditing = false)
   * 9. Le formulaire est synchronisé via useEffect
   *
   * DONNÉES ENVOYÉES:
   * - displayName: Nouveau nom d'affichage
   * - bio: Nouvelle biographie (peut être vide)
   * - location: Nouvelle localisation (peut être vide)
   * - avatarUrl: Nouvelle URL d'avatar (peut être vide)
   *
   * GESTION D'ERREUR:
   * - Si updateProfile() échoue (erreur réseau, validation serveur, etc.)
   * - Affiche un toast d'erreur avec message approprié
   * - Le mode édition reste activé (l'utilisateur peut réessayer)
   *
   * UX:
   * - Confirmation visuelle avec toast de succès
   * - Désactivation automatique du mode édition après succès
   * - Possibilité de continuer à modifier si erreur
   *
   * @param data - Données du formulaire validées par Zod (displayName, bio, location, avatarUrl)
   */
  const onSubmit = async (data: ProfileForm) => {
    try {
      /**
       * Appeler la fonction updateProfile du store auth
       *
       * updateProfile(data) fait:
       * 1. PUT /users/me avec les nouvelles données
       * 2. Le serveur valide et met à jour le profil
       * 3. Le serveur retourne l'utilisateur mis à jour
       * 4. Le store met à jour l'état (user)
       *
       * ERREUR:
       * - Si validation serveur échoue: erreur 400
       * - Si erreur réseau: erreur réseau
       * - L'erreur est propagée et catchée dans le bloc catch
       */
      await updateProfile(data);

      /**
       * Afficher un toast de succès
       *
       * toast.success() affiche une notification verte en haut de l'écran
       * avec le message "Profil mis à jour avec succès !"
       *
       * UX:
       * - Confirme visuellement à l'utilisateur que la mise à jour a réussi
       * - Disparaît automatiquement après quelques secondes
       */
      toast.success('Profil mis à jour avec succès !');

      /**
       * Désactiver le mode édition
       *
       * setIsEditing(false) passe le formulaire en mode consultation
       * - Les champs redeviennent en lecture seule
       * - Les boutons de sauvegarde disparaissent
       * - Le bouton "Modifier" réapparaît
       */
      setIsEditing(false);
    } catch (error) {
      /**
       * En cas d'erreur, afficher un toast d'erreur
       *
       * ERREURS POSSIBLES:
       * - Erreur de validation serveur (données invalides)
       * - Erreur réseau (pas de connexion, serveur inaccessible)
       * - Erreur serveur (500, etc.)
       *
       * MESSAGE:
       * - "Erreur lors de la mise à jour du profil" pour toutes les erreurs
       * - toast.error() affiche une notification rouge en haut de l'écran
       *
       * UX:
       * - Le mode édition reste activé (isEditing reste true)
       * - L'utilisateur peut corriger les erreurs et réessayer
       */
      toast.error('Erreur lors de la mise à jour du profil');
    }
  };

  // ============================================
  // FONCTION: handleLogout
  // ============================================

  // ============================================
  // FONCTION: handleLogout
  // ============================================

  /**
   * FONCTION: handleLogout
   *
   * Gère la déconnexion de l'utilisateur.
   *
   * FLUX:
   * 1. Appelle la fonction logout() du store auth
   * 2. Le store supprime les tokens du localStorage
   * 3. Le store réinitialise l'état (user = null, isAuthenticated = false)
   * 4. Affiche un toast de succès
   * 5. Redirige vers la page d'accueil (/)
   *
   * ACTIONS EFFECTUÉES:
   * - Suppression des tokens (accessToken, refreshToken)
   * - Réinitialisation de l'état d'authentification
   * - Nettoyage des données utilisateur du store
   *
   * GESTION D'ERREUR:
   * - Si logout() échoue (rare, généralement pas d'erreur)
   * - Affiche un toast d'erreur
   * - Redirige quand même vers la page d'accueil
   *
   * REDIRECTION:
   * - Toujours vers '/' (page d'accueil) après déconnexion
   * - L'utilisateur peut se reconnecter depuis la page d'accueil
   *
   * UX:
   * - Confirmation visuelle avec toast de succès
   * - Redirection automatique pour éviter l'accès à la page protégée
   */
  const handleLogout = async () => {
    try {
      /**
       * Appeler la fonction logout du store auth
       *
       * logout() fait:
       * 1. Supprime accessToken et refreshToken du localStorage
       * 2. Réinitialise l'état du store (user = null, isAuthenticated = false)
       * 3. Nettoyage des données utilisateur
       *
       * NOTE:
       * - Généralement pas d'erreur (action locale)
       * - Peut échouer si localStorage n'est pas accessible (rare)
       */
      await logout();

      /**
       * Afficher un toast de succès
       *
       * toast.success() affiche une notification verte en haut de l'écran
       * avec le message "Déconnexion réussie"
       */
      toast.success('Déconnexion réussie');

      /**
       * Rediriger vers la page d'accueil
       *
       * router.push() navigue vers la page sans rechargement complet
       * (navigation côté client, plus rapide)
       *
       * NAVIGATION:
       * - /: Page d'accueil où l'utilisateur peut se reconnecter
       * - L'utilisateur n'est plus authentifié (tokens supprimés)
       */
      router.push('/');
    } catch (error) {
      /**
       * En cas d'erreur, afficher un toast d'erreur
       *
       * ERREURS POSSIBLES:
       * - localStorage non accessible (rare)
       * - Erreur lors de la réinitialisation du store
       *
       * MESSAGE:
       * - "Erreur lors de la déconnexion" pour toutes les erreurs
       * - toast.error() affiche une notification rouge
       *
       * REDIRECTION:
       * - Redirige quand même vers '/' pour éviter l'accès à la page protégée
       */
      toast.error('Erreur lors de la déconnexion');
      router.push('/');
    }
  };

  // ============================================
  // FONCTION: handleDeleteAccount
  // ============================================

  // ============================================
  // FONCTION: handleDeleteAccount
  // ============================================

  /**
   * FONCTION: handleDeleteAccount
   *
   * Gère la suppression du compte utilisateur.
   *
   * ⚠️ ATTENTION: Cette action est irréversible!
   *
   * SÉCURITÉ:
   * - Une confirmation est demandée via AlertDialog avant exécution
   * - L'utilisateur doit cliquer sur "Supprimer définitivement"
   * - Double confirmation pour éviter les suppressions accidentelles
   *
   * FLUX:
   * 1. Utilisateur clique sur "Supprimer mon compte"
   * 2. AlertDialog s'affiche avec message d'avertissement
   * 3. Utilisateur confirme en cliquant sur "Supprimer définitivement"
   * 4. Appelle la fonction deleteAccount() du store auth
   * 5. Le store appelle l'API DELETE /users/me
   * 6. L'API supprime toutes les données utilisateur de la base de données
   * 7. Le store supprime les tokens et réinitialise l'état
   * 8. Affiche un toast de succès
   * 9. Redirige vers la page d'accueil (/)
   *
   * DONNÉES SUPPRIMÉES:
   * - Compte utilisateur (email, displayName, etc.)
   * - Items publiés (cascade)
   * - Échanges initiés/reçus (cascade)
   * - Messages de chat (cascade)
   * - Photos uploadées (Cloudinary)
   * - Toutes les données associées
   *
   * GESTION D'ERREUR:
   * - Si deleteAccount() échoue (erreur réseau, serveur, etc.)
   * - Affiche un toast d'erreur avec message approprié
   * - Le compte n'est pas supprimé (l'utilisateur peut réessayer)
   *
   * REDIRECTION:
   * - Toujours vers '/' (page d'accueil) après suppression
   * - L'utilisateur n'est plus authentifié (tokens supprimés)
   *
   * UX:
   * - Confirmation obligatoire pour éviter les suppressions accidentelles
   * - Message d'avertissement clair sur l'irréversibilité
   * - Confirmation visuelle avec toast de succès
   */
  const handleDeleteAccount = async () => {
    try {
      /**
       * Appeler la fonction deleteAccount du store auth
       *
       * deleteAccount() fait:
       * 1. DELETE /users/me (suppression du compte)
       * 2. Le serveur supprime toutes les données utilisateur (cascade)
       * 3. Le serveur supprime les photos Cloudinary associées
       * 4. Le store supprime les tokens du localStorage
       * 5. Le store réinitialise l'état (user = null, isAuthenticated = false)
       *
       * ERREUR:
       * - Si erreur réseau: erreur réseau
       * - Si erreur serveur: erreur serveur
       * - L'erreur est propagée et catchée dans le bloc catch
       *
       * ⚠️ IRRÉVERSIBLE:
       * - Une fois supprimé, le compte ne peut pas être restauré
       * - Toutes les données sont définitivement perdues
       */
      await deleteAccount();

      /**
       * Afficher un toast de succès
       *
       * toast.success() affiche une notification verte en haut de l'écran
       * avec le message "Compte supprimé avec succès"
       */
      toast.success('Compte supprimé avec succès');

      /**
       * Rediriger vers la page d'accueil
       *
       * router.push() navigue vers la page sans rechargement complet
       * (navigation côté client, plus rapide)
       *
       * NAVIGATION:
       * - /: Page d'accueil
       * - L'utilisateur n'est plus authentifié (compte supprimé)
       */
      router.push('/');
    } catch (error) {
      /**
       * En cas d'erreur, afficher un toast d'erreur
       *
       * ERREURS POSSIBLES:
       * - Erreur réseau (pas de connexion, serveur inaccessible)
       * - Erreur serveur (500, etc.)
       *
       * MESSAGE:
       * - "Erreur lors de la suppression du compte" pour toutes les erreurs
       * - toast.error() affiche une notification rouge en haut de l'écran
       *
       * UX:
       * - Le compte n'est pas supprimé (l'utilisateur peut réessayer)
       * - L'utilisateur reste sur la page de profil
       */
      toast.error('Erreur lors de la suppression du compte');
    }
  };

  // ============================================
  // VÉRIFICATION DE L'UTILISATEUR
  // ============================================

  /**
   * Vérification que l'utilisateur existe
   *
   * PROTECTION:
   * - ProtectedRoute devrait déjà vérifier l'authentification
   * - Cette vérification est une sécurité supplémentaire
   * - Retourne null si user est null (ne devrait pas arriver)
   *
   * NOTE:
   * - En production, cette vérification ne devrait jamais être nécessaire
   * - ProtectedRoute redirige vers /login si non authentifié
   */
  if (!user) {
    return null;
  }

  // ============================================
  // RENDU DU COMPOSANT
  // ============================================

  /**
   * Rendu de la page de profil
   *
   * STRUCTURE:
   * - Header: Titre et bouton de déconnexion
   * - Grille principale: Profil (2/3) + Sidebar (1/3)
   * - Profil: Formulaire avec mode édition/consultation
   * - Sidebar: Statistiques, actions rapides, zone de danger
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* ============================================
            HEADER
            ============================================ */}
        {/* Header avec titre et bouton de déconnexion
         *
         * ANIMATION:
         * - initial: État initial (opacity: 0, y: 20) - invisible et décalé vers le bas
         * - animate: État final (opacity: 1, y: 0) - visible et à sa position
         * - transition: Durée de 0.6s pour une animation fluide
         */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">Mon Profil</h1>
              <p className="text-muted-foreground">
                Gérez vos informations personnelles et vos préférences
              </p>
            </div>
            {/* Bouton de déconnexion
             *
             * FONCTIONNEMENT:
             * - onClick: Appelle handleLogout()
             * - Déconnecte l'utilisateur et redirige vers /
             *
             * STYLE:
             * - variant="outline": Style avec bordure
             * - flex items-center gap-2: Alignement horizontal avec icône
             */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ============================================
              PROFIL PRINCIPAL
              ============================================ */}
          {/* Section principale du profil (2/3 de la largeur)
           *
           * ANIMATION:
           * - initial: État initial (opacity: 0, y: 20)
           * - animate: État final (opacity: 1, y: 0)
           * - transition: Durée de 0.6s avec délai de 0.1s
           *
           * STYLE:
           * - lg:col-span-2: Prend 2 colonnes sur 3 en large écran
           * - Responsive: 1 colonne sur mobile
           */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Informations personnelles
                  </CardTitle>
                  {/* Bouton pour activer/désactiver le mode édition
                   *
                   * FONCTIONNEMENT:
                   * - onClick: Inverse l'état isEditing
                   * - isEditing === true: Affiche "Annuler"
                   * - isEditing === false: Affiche "Modifier"
                   *
                   * STYLE:
                   * - variant="outline": Style avec bordure
                   * - size="sm": Taille petite
                   */}
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    {isEditing ? 'Annuler' : 'Modifier'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Formulaire avec validation React Hook Form
                 *
                 * handleSubmit(onSubmit):
                 * - handleSubmit: wrapper de React Hook Form qui valide avant soumission
                 * - onSubmit: fonction appelée si validation réussie
                 *
                 * space-y-6: espacement vertical de 1.5rem entre les sections
                 */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* ============================================
                      AVATAR ET NOM
                      ============================================ */}
                  {/* Section avatar et informations de base
                   *
                   * STRUCTURE:
                   * - AvatarUpload: Composant pour upload/modification d'avatar
                   * - Informations: Nom, email, badge "Membre depuis"
                   */}
                  <div className="flex items-center gap-4">
                    {/* Composant AvatarUpload
                     *
                     * PROPS:
                     * - currentAvatarUrl: URL actuelle de l'avatar (depuis watch ou user)
                     * - displayName: Nom d'affichage pour les initiales (fallback)
                     * - onUploadComplete: Callback appelé après upload réussi
                     *   - Reçoit la nouvelle URL et met à jour le formulaire via setValue
                     * - disabled: Désactivé si pas en mode édition
                     *
                     * FONCTIONNEMENT:
                     * - Si disabled === false: Permet l'upload de nouveau avatar
                     * - Si disabled === true: Affiche seulement l'avatar actuel
                     */}
                    <AvatarUpload
                      currentAvatarUrl={avatarUrl || user?.avatarUrl}
                      displayName={user?.displayName || ''}
                      onUploadComplete={(url) => setValue('avatarUrl', url)}
                      disabled={!isEditing}
                    />
                    <div>
                      {/* Nom d'affichage
                       * - text-2xl font-semibold: Taille et poids de police
                       */}
                      <h2 className="text-2xl font-semibold">
                        {user.displayName}
                      </h2>
                      {/* Email
                       * - text-muted-foreground: Couleur atténuée
                       * - Non modifiable (pas dans le formulaire)
                       */}
                      <p className="text-muted-foreground">{user.email}</p>
                      {/* Badge "Membre depuis"
                       * - Affiche l'année de création du compte
                       * - variant="secondary": Style secondaire
                       */}
                      <Badge variant="secondary" className="mt-1">
                        Membre depuis {new Date(user.createdAt).getFullYear()}
                      </Badge>
                    </div>
                  </div>

                  {/* ============================================
                      INFORMATIONS
                      ============================================ */}
                  {/* Grille des informations (2 colonnes sur desktop)
                   *
                   * STRUCTURE:
                   * - Email: Affichage en lecture seule (non modifiable)
                   * - Localisation: Éditable si isEditing === true
                   * - Nom d'affichage: Éditable si isEditing === true
                   *
                   * STYLE:
                   * - grid grid-cols-1: 1 colonne sur mobile
                   * - md:grid-cols-2: 2 colonnes sur desktop
                   * - gap-4: Espacement entre les champs
                   */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Champ Email (lecture seule)
                     *
                     * AFFICHAGE:
                     * - Toujours en lecture seule (non modifiable)
                     * - Email utilisé pour la connexion, ne peut pas être changé
                     *
                     * STYLE:
                     * - Icône Mail à gauche
                     * - Texte de l'email
                     */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Email
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                    </div>

                    {/* Champ Localisation (éditable)
                     *
                     * MODE ÉDITION:
                     * - isEditing === true: Affiche un Input pour modifier
                     * - isEditing === false: Affiche le texte (ou "Non précisée")
                     *
                     * VALIDATION:
                     * - Optionnel (pas de validation stricte)
                     * - Affiche l'erreur si validation échoue
                     */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Localisation
                      </label>
                      {isEditing ? (
                        <div className="mt-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {/* Input pour la localisation
                           *
                           * {...register('location')}:
                           * - Enregistre le champ dans React Hook Form
                           * - Active la validation Zod (optionnel)
                           */}
                          <Input
                            {...register('location')}
                            placeholder="Votre localisation"
                          />
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{user.location || 'Non précisée'}</span>
                        </div>
                      )}
                      {/* Affichage de l'erreur de validation */}
                      {errors.location && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.location.message}
                        </p>
                      )}
                    </div>

                    {/* Champ Nom d'affichage (éditable)
                     *
                     * MODE ÉDITION:
                     * - isEditing === true: Affiche un Input pour modifier
                     * - isEditing === false: Affiche le texte
                     *
                     * VALIDATION:
                     * - Minimum 3 caractères (requis)
                     * - Affiche l'erreur si validation échoue
                     *
                     * STYLE:
                     * - md:col-span-2: Prend 2 colonnes sur desktop (pleine largeur)
                     */}
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Nom d'affichage
                      </label>
                      {isEditing ? (
                        /* Input pour le nom d'affichage
                         *
                         * {...register('displayName')}:
                         * - Enregistre le champ dans React Hook Form
                         * - Active la validation Zod (minimum 3 caractères)
                         */
                        <Input
                          {...register('displayName')}
                          placeholder="Votre nom d'affichage"
                          className="mt-1"
                        />
                      ) : (
                        <span className="mt-1 block">{user.displayName}</span>
                      )}
                      {/* Affichage de l'erreur de validation */}
                      {errors.displayName && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.displayName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ============================================
                      BIOGRAPHIE
                      ============================================ */}
                  {/* Champ Biographie (éditable)
                   *
                   * MODE ÉDITION:
                   * - isEditing === true: Affiche un textarea pour modifier
                   * - isEditing === false: Affiche le texte (ou "Aucune biographie renseignée")
                   *
                   * VALIDATION:
                   * - Optionnel (pas de validation stricte)
                   * - Affiche l'erreur si validation échoue
                   */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Biographie
                    </label>
                    {isEditing ? (
                      /* Textarea pour la biographie
                       *
                       * {...register('bio')}:
                       * - Enregistre le champ dans React Hook Form
                       * - Active la validation Zod (optionnel)
                       *
                       * STYLE:
                       * - min-h-[100px]: Hauteur minimale de 100px
                       * - resize-none: Empêche le redimensionnement
                       * - border-input: Couleur de bordure selon le thème
                       */
                      <textarea
                        {...register('bio')}
                        placeholder="Parlez-nous de vous..."
                        className="mt-1 min-h-[100px] w-full resize-none rounded-md border border-input bg-background p-3 text-sm"
                      />
                    ) : (
                      <p className="mt-1 text-sm">
                        {user.bio || 'Aucune biographie renseignée'}
                      </p>
                    )}
                    {/* Affichage de l'erreur de validation */}
                    {errors.bio && (
                      <p className="mt-1 text-sm text-destructive">
                        {errors.bio.message}
                      </p>
                    )}
                  </div>

                  {/* ============================================
                      BOUTONS DE SOUMISSION
                      ============================================ */}
                  {/* Boutons affichés seulement en mode édition
                   *
                   * CONDITION:
                   * - Affiche seulement si isEditing === true
                   *
                   * BOUTONS:
                   * - Sauvegarder: Soumet le formulaire (type="submit")
                   * - Annuler: Désactive le mode édition (type="button")
                   */}
                  {isEditing && (
                    <div className="flex gap-2">
                      {/* Bouton de sauvegarde
                       *
                       * ÉTAT:
                       * - disabled={isLoading}: Désactivé pendant le chargement
                       * - Empêche les soumissions multiples
                       *
                       * TEXTE DYNAMIQUE:
                       * - isLoading === true: "Sauvegarde..." (pendant l'appel API)
                       * - isLoading === false: "Sauvegarder" (état normal)
                       *
                       * STYLE:
                       * - type="submit": Déclenche la soumission du formulaire
                       */}
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                      {/* Bouton d'annulation
                       *
                       * FONCTIONNEMENT:
                       * - type="button": Empêche le submit du formulaire
                       * - onClick: Désactive le mode édition (setIsEditing(false))
                       *
                       * STYLE:
                       * - variant="outline": Style avec bordure
                       */}
                      <Button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                      >
                        Annuler
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* ============================================
              SIDEBAR
              ============================================ */}
          {/* Sidebar avec statistiques, actions rapides et zone de danger
           *
           * ANIMATION:
           * - initial: État initial (opacity: 0, y: 20)
           * - animate: État final (opacity: 1, y: 0)
           * - transition: Durée de 0.6s avec délai de 0.2s
           *
           * STYLE:
           * - space-y-6: Espacement vertical de 1.5rem entre les cartes
           * - 1 colonne sur 3 en large écran
           */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* ============================================
                STATISTIQUES
                ============================================ */}
            {/* Carte des statistiques utilisateur
             *
             * CONTENU:
             * - Objets publiés: Nombre d'items créés par l'utilisateur
             * - Échanges initiés: Nombre d'échanges où l'utilisateur est demandeur
             * - Échanges reçus: Nombre d'échanges où l'utilisateur est répondant
             *
             * NOTE:
             * - Actuellement affiche 0 (statistiques à implémenter)
             * - Pourrait être récupéré depuis l'API /users/me/stats
             */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Statistique: Objets publiés */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Objets publiés
                  </span>
                  <Badge variant="secondary">0</Badge>
                </div>
                {/* Statistique: Échanges initiés */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Échanges initiés
                  </span>
                  <Badge variant="secondary">0</Badge>
                </div>
                {/* Statistique: Échanges reçus */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Échanges reçus
                  </span>
                  <Badge variant="secondary">0</Badge>
                </div>
              </CardContent>
            </Card>

            {/* ============================================
                ACTIONS RAPIDES
                ============================================ */}
            {/* Carte des actions rapides
             *
             * CONTENU:
             * - Publier un objet: Lien vers /explore (ou /item/new)
             * - Explorer les objets: Lien vers /explore
             *
             * UTILISATION:
             * - Accès rapide aux fonctionnalités principales
             * - Améliore la navigation
             */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Bouton: Publier un objet
                 *
                 * NAVIGATION:
                 * - Lien vers /explore (ou /item/new pour créer un objet)
                 * - asChild: Utilise le Link comme bouton stylisé
                 */}
                <Button className="w-full" asChild>
                  <a href="/explore">Publier un objet</a>
                </Button>
                {/* Bouton: Explorer les objets
                 *
                 * NAVIGATION:
                 * - Lien vers /explore pour voir tous les objets
                 * - variant="outline": Style avec bordure
                 */}
                <Button variant="outline" className="w-full" asChild>
                  <a href="/explore">Explorer les objets</a>
                </Button>
              </CardContent>
            </Card>

            {/* ============================================
                ZONE DE DANGER
                ============================================ */}
            {/* Carte de la zone de danger
             *
             * ⚠️ ATTENTION: Actions irréversibles
             *
             * CONTENU:
             * - Bouton "Supprimer mon compte" avec confirmation AlertDialog
             * - Action critique nécessitant une double confirmation
             *
             * STYLE:
             * - border-destructive: Bordure rouge pour indiquer le danger
             * - text-destructive: Texte rouge pour le titre
             *
             * SÉCURITÉ:
             * - AlertDialog oblige l'utilisateur à confirmer
             * - Message d'avertissement clair sur l'irréversibilité
             */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">
                  Zone de danger
                </CardTitle>
                <CardDescription>
                  Actions irréversibles sur votre compte
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* AlertDialog pour la confirmation de suppression
                 *
                 * FONCTIONNEMENT:
                 * - AlertDialogTrigger: Bouton qui ouvre le dialogue
                 * - AlertDialogContent: Contenu du dialogue avec message d'avertissement
                 * - AlertDialogCancel: Bouton pour annuler
                 * - AlertDialogAction: Bouton pour confirmer (appelle handleDeleteAccount)
                 *
                 * SÉCURITÉ:
                 * - Double confirmation obligatoire
                 * - Message clair sur l'irréversibilité
                 */}
                <AlertDialog>
                  {/* Trigger: Bouton qui ouvre le dialogue
                   *
                   * STYLE:
                   * - variant="destructive": Style rouge pour indiquer le danger
                   * - w-full: Largeur complète
                   */}
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer mon compte
                    </Button>
                  </AlertDialogTrigger>
                  {/* Contenu du dialogue de confirmation
                   *
                   * STRUCTURE:
                   * - Header: Titre et description d'avertissement
                   * - Footer: Boutons Annuler et Supprimer définitivement
                   */}
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Êtes-vous absolument sûr ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action ne peut pas être annulée. Cela supprimera
                        définitivement votre compte et toutes les données
                        associées de nos serveurs.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      {/* Bouton Annuler
                       *
                       * FONCTIONNEMENT:
                       * - Ferme le dialogue sans action
                       * - L'utilisateur peut continuer à utiliser son compte
                       */}
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      {/* Bouton Supprimer définitivement
                       *
                       * FONCTIONNEMENT:
                       * - onClick: Appelle handleDeleteAccount()
                       * - Supprime le compte de manière irréversible
                       *
                       * STYLE:
                       * - bg-destructive: Fond rouge
                       * - text-destructive-foreground: Texte blanc
                       * - hover:bg-destructive/90: Fond rouge foncé au survol
                       */}
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer définitivement
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * COMPOSANT: ProfilePage
 *
 * Page de profil principale (export default).
 *
 * ARCHITECTURE:
 * - Composant wrapper qui enveloppe ProfilePageContent dans ProtectedRoute
 * - Nécessaire car la page nécessite une authentification
 *
 * PROTECTION:
 * - ProtectedRoute vérifie l'authentification avant d'afficher le contenu
 * - Si non authentifié, redirige vers /login avec paramètre 'next'
 * - Si authentifié, affiche ProfilePageContent
 *
 * UTILISATION:
 * - Route: /profile
 * - Accessible uniquement aux utilisateurs authentifiés
 * - Redirection automatique vers /login si non authentifié
 */
export default function ProfilePage() {
  /**
   * ProtectedRoute pour sécuriser l'accès à la page
   *
   * FONCTIONNEMENT:
   * - Vérifie si l'utilisateur est authentifié (isAuthenticated)
   * - Si non authentifié: redirige vers /login?next=/profile
   * - Si authentifié: affiche ProfilePageContent
   *
   * SÉCURITÉ:
   * - Empêche l'accès aux utilisateurs non authentifiés
   * - Redirection automatique pour une meilleure UX
   */
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
