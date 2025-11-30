/**
 * FICHIER: app/item/new/page.tsx
 *
 * DESCRIPTION:
 * Page de création d'un nouvel objet (item). Cette page permet aux utilisateurs
 * authentifiés de créer et publier un nouvel objet sur la plateforme. Elle affiche
 * le formulaire ItemForm en mode "create" et redirige vers la page de détail de
 * l'objet créé après succès. Cette page est protégée et nécessite une authentification.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Redirection automatique vers /login si l'utilisateur n'est pas authentifié
 * - Formulaire complet de création (ItemForm en mode "create")
 * - Validation côté client avec Zod (via ItemForm)
 * - Soumission via itemsApi.createItem
 * - Toasts de succès/erreur (react-hot-toast)
 * - Loader plein écran durant la vérification d'authentification
 * - Redirection vers la page de détail après création réussie
 * - Animations Framer Motion pour une meilleure UX
 *
 * ARCHITECTURE:
 * - Composant unique: NewItemPage (export default)
 * - Pas besoin de Suspense (pas d'utilisation de useSearchParams)
 * - Protection d'authentification via useEffect et redirection
 *
 * FLUX DE CRÉATION:
 * 1. Vérification de l'authentification (useEffect)
 * 2. Si non authentifié: redirection vers /login?next=/item/new
 * 3. Si authentifié: affichage du formulaire ItemForm
 * 4. Utilisateur remplit le formulaire (titre, description, catégorie, etc.)
 * 5. Validation côté client avec Zod (via ItemForm)
 * 6. Soumission du formulaire (handleSubmit)
 * 7. Appel à itemsApi.createItem() avec les données validées
 * 8. L'API crée l'item dans la base de données
 * 9. L'API retourne l'item créé avec son ID
 * 10. Toast de succès affiché
 * 11. Redirection vers /item/[id] (page de détail de l'item créé)
 *
 * PROTECTION D'AUTHENTIFICATION:
 * - Vérification via useAuthStore.isAuthenticated
 * - Redirection automatique vers /login si non authentifié
 * - Paramètre 'next' pour rediriger vers cette page après connexion
 * - Loader affiché pendant la vérification
 *
 * GESTION D'ERREUR:
 * - Si itemsApi.createItem() échoue (validation serveur, erreur réseau, etc.)
 * - Toast d'erreur affiché
 * - L'utilisateur reste sur la page (peut corriger et réessayer)
 * - L'erreur est propagée pour être gérée par ItemForm
 *
 * UTILISATION:
 * - Route: /item/new
 * - Accessible uniquement aux utilisateurs authentifiés
 * - Redirection automatique vers /login si non authentifié
 * - Lien depuis d'autres pages: <Link href="/item/new">Publier un objet</Link>
 *
 * @module app/item/new/page
 */

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ItemForm } from '@/components/items/ItemForm';
import { itemsApi } from '@/lib/items.api';
import { CreateItemDto, UpdateItemDto } from '@/types';
import { useAuthStore } from '@/store/auth';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';

/**
 * COMPOSANT: NewItemPage
 *
 * Page de création d'un nouvel objet.
 *
 * FONCTIONNEMENT:
 * 1. Vérifie l'authentification via useEffect
 * 2. Redirige vers /login si non authentifié
 * 3. Affiche le formulaire ItemForm si authentifié
 * 4. Gère la soumission du formulaire
 * 5. Redirige vers la page de détail après création
 *
 * PROTECTION:
 * - Vérification d'authentification avant affichage
 * - Redirection automatique si non authentifié
 * - Loader pendant la vérification
 */
export default function NewItemPage() {
  // ============================================
  // RÉCUPÉRATION DES HOOKS ET STORES
  // ============================================

  /**
   * Hook Next.js pour la navigation programmatique
   *
   * UTILISATION:
   * - router.push(path): Navigue vers une page sans rechargement
   * - Utilisé pour rediriger vers /login ou /item/[id]
   */
  const router = useRouter();

  /**
   * Récupération de l'état d'authentification depuis le store auth
   *
   * ÉTAT:
   * - isAuthenticated: true si l'utilisateur est connecté, false sinon
   *   - Utilisé pour vérifier si l'utilisateur peut accéder à la page
   *   - Utilisé pour afficher le loader ou le formulaire
   */
  const { isAuthenticated } = useAuthStore();

  // ============================================
  // EFFET: Vérification d'authentification
  // ============================================

  /**
   * EFFET: Vérifie l'authentification et redirige si nécessaire
   *
   * DÉCLENCHEMENT:
   * - Quand isAuthenticated change (connexion/déconnexion)
   * - Quand router change (référence de fonction, rare)
   *
   * FONCTIONNEMENT:
   * 1. Vérifie si isAuthenticated === false
   * 2. Si false: Redirige vers /login?next=/item/new
   * 3. Si true: Ne fait rien (le formulaire s'affiche)
   *
   * REDIRECTION:
   * - Vers /login avec paramètre 'next=/item/new'
   * - Après connexion, l'utilisateur est redirigé vers cette page
   *
   * UX:
   * - Redirection automatique pour éviter l'accès non autorisé
   * - Paramètre 'next' pour une meilleure expérience utilisateur
   */
  useEffect(() => {
    if (!isAuthenticated) {
      /**
       * Rediriger vers la page de connexion
       *
       * NAVIGATION:
       * - /login?next=/item/new: Page de connexion avec redirection
       * - Après connexion, l'utilisateur est redirigé vers /item/new
       *
       * POURQUOI:
       * - Évite l'accès non autorisé à la page
       * - Améliore l'UX en redirigeant vers la page après connexion
       */
      router.push('/login?next=/item/new');
    }
  }, [isAuthenticated, router]);

  // ============================================
  // FONCTION: handleSubmit
  // ============================================

  /**
   * FONCTION: handleSubmit
   *
   * Gère la soumission du formulaire de création d'item.
   *
   * FLUX:
   * 1. Les données sont déjà validées par Zod (via ItemForm)
   * 2. Appelle itemsApi.createItem() avec les données validées
   * 3. L'API crée l'item dans la base de données
   * 4. L'API retourne l'item créé avec son ID
   * 5. Affiche un toast de succès
   * 6. Redirige vers la page de détail de l'item créé (/item/[id])
   *
   * DONNÉES ENVOYÉES:
   * - title: Titre de l'item
   * - description: Description détaillée
   * - category: Catégorie (optionnel si IA activée)
   * - condition: État de l'item
   * - tags: Tags personnalisés (optionnel)
   * - aiAuto: Aide IA activée ou non (optionnel)
   *
   * GESTION D'ERREUR:
   * - Si itemsApi.createItem() échoue (validation serveur, erreur réseau, etc.)
   * - Affiche un toast d'erreur
   * - Propage l'erreur pour être gérée par ItemForm
   * - L'utilisateur reste sur la page (peut corriger et réessayer)
   *
   * REDIRECTION:
   * - Toujours vers /item/[id] après création réussie
   * - L'utilisateur peut voir immédiatement son item créé
   *
   * UX:
   * - Confirmation visuelle avec toast de succès
   * - Redirection automatique vers la page de détail
   * - Permet de voir immédiatement le résultat
   *
   * @param data - Données du formulaire validées par Zod (CreateItemDto | UpdateItemDto)
   */
  const handleSubmit = async (data: CreateItemDto | UpdateItemDto) => {
    try {
      /**
       * Appeler l'API pour créer l'item
       *
       * itemsApi.createItem(data) fait:
       * 1. POST /items avec les données de l'item
       * 2. Le serveur valide les données
       * 3. Le serveur crée l'item dans la base de données
       * 4. Si aiAuto === true: Le serveur appelle l'IA (Gemini) pour analyser l'item
       * 5. Le serveur retourne l'item créé avec son ID
       *
       * RETOUR:
       * - item: Objet Item complet avec toutes les propriétés
       *   - Contient l'ID généré par la base de données
       *   - Contient les données analysées par l'IA (si aiAuto === true)
       *
       * ERREUR:
       * - Si validation serveur échoue: erreur 400
       * - Si erreur réseau: erreur réseau
       * - L'erreur est propagée et catchée dans le bloc catch
       */
      const item = await itemsApi.createItem(data as CreateItemDto);

      /**
       * Afficher un toast de succès
       *
       * toast.success() affiche une notification verte en haut de l'écran
       * avec le message "Objet créé avec succès !"
       *
       * UX:
       * - Confirme visuellement à l'utilisateur que la création a réussi
       * - Disparaît automatiquement après quelques secondes
       */
      toast.success('Objet créé avec succès !');

      /**
       * Rediriger vers la page de détail de l'item créé
       *
       * router.push() navigue vers la page sans rechargement complet
       * (navigation côté client, plus rapide)
       *
       * NAVIGATION:
       * - /item/[id]: Page de détail de l'item créé
       * - L'utilisateur peut voir immédiatement son item avec toutes les informations
       * - L'item peut avoir été analysé par l'IA (si aiAuto === true)
       */
      router.push(`/item/${item.id}`);
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
       * - "Erreur lors de la création de l'objet" pour toutes les erreurs
       * - toast.error() affiche une notification rouge en haut de l'écran
       *
       * PROPAGATION:
       * - throw error: Propage l'erreur pour être gérée par ItemForm
       * - ItemForm peut afficher des erreurs spécifiques par champ
       *
       * UX:
       * - L'utilisateur reste sur la page de création
       * - Peut corriger les erreurs et réessayer
       */
      toast.error("Erreur lors de la création de l'objet");
      throw error;
    }
  };

  // ============================================
  // VÉRIFICATION D'AUTHENTIFICATION
  // ============================================

  /**
   * Affichage du loader pendant la vérification d'authentification
   *
   * CONDITION:
   * - Affiche seulement si isAuthenticated === false
   * - Pendant la vérification ou la redirection
   *
   * UX:
   * - Évite un écran blanc pendant la redirection
   * - Donne un feedback visuel à l'utilisateur
   *
   * NOTE:
   * - Ce loader est visible très brièvement (le temps de la redirection)
   * - Une fois redirigé vers /login, ce loader disparaît
   */
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {/* Spinner de chargement
         *
         * STYLE:
         * - h-32 w-32: Taille de 128px
         * - animate-spin: Animation de rotation infinie
         * - rounded-full: Forme circulaire
         * - border-b-2: Bordure en bas (2px)
         * - border-primary: Couleur primaire
         */}
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // ============================================
  // RENDU DU COMPOSANT
  // ============================================

  /**
   * Rendu de la page de création d'item
   *
   * STRUCTURE:
   * - Conteneur principal avec animation Framer Motion
   * - Header: Titre et description
   * - Formulaire: ItemForm en mode "create"
   */
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Conteneur principal avec animation Framer Motion
       *
       * ANIMATION:
       * - initial: État initial (opacity: 0, y: 20) - invisible et décalé vers le bas
       * - animate: État final (opacity: 1, y: 0) - visible et à sa position
       * - transition: Durée de 0.6s pour une animation fluide
       *
       * STYLE:
       * - mx-auto max-w-2xl: Centré avec largeur maximale de 42rem (672px)
       * - Responsive: S'adapte à la taille de l'écran
       */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-2xl"
      >
        {/* Header avec titre et description
         *
         * STYLE:
         * - mb-8: Marge-bottom pour séparer du formulaire
         */}
        <div className="mb-8">
          {/* Titre de la page
           * - text-3xl font-bold: Taille et poids de police
           * - mb-2: Marge-bottom pour séparer de la description
           */}
          <h1 className="mb-2 text-3xl font-bold">Créer un nouvel objet</h1>
          {/* Description de la page
           * - text-muted-foreground: Couleur atténuée
           */}
          <p className="text-muted-foreground">
            Partagez un objet que vous souhaitez échanger avec la communauté
          </p>
        </div>

        {/* Formulaire de création d'item
         *
         * COMPOSANT:
         * - ItemForm: Composant de formulaire complet
         *   - Gère tous les champs (titre, description, catégorie, etc.)
         *   - Validation Zod côté client
         *   - Gestion des tags
         *   - Option d'aide IA
         *
         * PROPS:
         * - mode: "create" - Mode création (pas de données initiales)
         * - onSubmit: handleSubmit - Fonction appelée lors de la soumission
         *
         * FONCTIONNEMENT:
         * - Affiche le formulaire avec tous les champs
         * - Valide les données avec Zod avant soumission
         * - Appelle handleSubmit avec les données validées
         * - Gère les erreurs et affiche les messages appropriés
         */}
        <ItemForm mode="create" onSubmit={handleSubmit} />
      </motion.div>
    </div>
  );
}
