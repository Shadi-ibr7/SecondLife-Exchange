/**
 * FICHIER: app/item/[id]/page.tsx
 *
 * DESCRIPTION:
 * Page de détail d'un objet (item). Elle présente toutes les informations
 * d'un objet : photos, caractéristiques, propriétaire, localisation, tags,
 * analyse IA, et permet de proposer un échange ou de gérer ses propres items
 * (édition, archivage, suppression). Cette page est accessible publiquement
 * mais certaines actions nécessitent une authentification.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Chargement dynamique de l'item via React Query (itemsApi.getItem)
 * - Gestion d'un mode "mock" pour prévisualiser le design sans backend
 * - Bannière de recommandation (MatchBanner) si l'algorithme a scoré l'item
 * - Affichage des photos avec galerie (ItemPhotos)
 * - Modal de proposition d'échange (ProposeExchangeModal) pour les non-propriétaires
 * - Actions spécifiques au propriétaire (ItemOwnerActions: édition, archivage, suppression)
 * - Badges d'état, catégorie, condition, tags
 * - Informations IA (résumé, conseils de réparation) si disponibles
 * - Informations du propriétaire (avatar, nom, localisation, date de publication)
 *
 * ARCHITECTURE:
 * - Route dynamique: /item/[id] où [id] est l'ID de l'item
 * - Composant unique: ItemDetailPage (export default)
 * - Pas besoin de Suspense (pas d'utilisation de useSearchParams)
 *
 * MODE MOCK:
 * - Si l'ID commence par "mock-", utilise des données mockées
 * - Permet de prévisualiser le design sans backend
 * - Utile pour le développement et les démos
 * - Les données mockées sont définies dans MOCK_ITEM
 *
 * FLUX DE DONNÉES:
 * 1. Récupération de l'ID depuis les paramètres de route (useParams)
 * 2. Vérification si c'est un item mock (isMock)
 * 3. Si non mock: Appel API via React Query (itemsApi.getItem)
 * 4. Si mock: Utilisation des données MOCK_ITEM
 * 5. Vérification si l'utilisateur est le propriétaire (isOwner)
 * 6. Affichage conditionnel selon le rôle (propriétaire vs visiteur)
 *
 * GESTION DES RÔLES:
 * - Propriétaire (isOwner === true):
 *   - Voit ItemOwnerActions (édition, archivage, suppression)
 *   - Peut modifier les photos
 *   - Ne voit pas le bouton "Proposer un échange"
 *
 * - Visiteur (isOwner === false):
 *   - Voit le bouton "Proposer un échange" si item.status === 'AVAILABLE'
 *   - Doit être connecté pour proposer un échange
 *   - Redirection vers /login si non connecté
 *
 * COMPOSANTS UTILISÉS:
 * - ItemPhotos: Galerie de photos avec lightbox
 * - MatchBanner: Bannière de recommandation IA (si score disponible)
 * - ItemOwnerActions: Actions pour le propriétaire
 * - ProposeExchangeModal: Modal pour proposer un échange
 *
 * UX:
 * - Bouton retour vers /explore
 * - Animations Framer Motion pour les transitions
 * - Formatage des dates relatif (formatDistanceToNow avec locale française)
 * - États de chargement avec skeleton loaders
 * - Gestion d'erreur avec message informatif
 *
 * UTILISATION:
 * - Route: /item/[id] (ex: /item/123, /item/mock-1)
 * - Accessible publiquement (pas de protection d'authentification)
 * - Certaines actions nécessitent une authentification
 *
 * @module app/item/[id]/page
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ItemPhotos } from '@/components/items/ItemPhotos';
import { ItemOwnerActions } from '@/components/items/ItemOwnerActions';
import { ProposeExchangeModal } from '@/components/exchanges/ProposeExchangeModal';
import { MatchBanner } from '@/components/matching/MatchBanner';
import { itemsApi } from '@/lib/items.api';
import { useAuthStore } from '@/store/auth';
import {
  ITEM_CATEGORY_LABELS,
  ITEM_CONDITION_LABELS,
  ITEM_STATUS_LABELS,
} from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Sparkles,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';

/**
 * COMPOSANT: ItemDetailPage
 *
 * Page de détail d'un objet.
 *
 * FONCTIONNEMENT:
 * 1. Récupère l'ID de l'item depuis les paramètres de route
 * 2. Vérifie si c'est un item mock
 * 3. Charge l'item via React Query (si non mock)
 * 4. Vérifie si l'utilisateur est le propriétaire
 * 5. Affiche les informations et actions selon le rôle
 *
 * GESTION DES ÉTATS:
 * - Chargement: Affiche des skeleton loaders
 * - Erreur: Affiche un message d'erreur avec bouton retour
 * - Succès: Affiche toutes les informations de l'item
 */
export default function ItemDetailPage() {
  // ============================================
  // RÉCUPÉRATION DES HOOKS ET PARAMÈTRES
  // ============================================

  /**
   * Hook Next.js pour récupérer les paramètres de route
   *
   * UTILISATION:
   * - params.id: ID de l'item depuis l'URL
   * - Exemple: /item/123 -> params.id = "123"
   * - Exemple: /item/mock-1 -> params.id = "mock-1"
   *
   * TYPE:
   * - Cast en string pour TypeScript
   */
  const params = useParams();

  /**
   * Hook Next.js pour la navigation programmatique
   *
   * UTILISATION:
   * - router.push(path): Navigue vers une page sans rechargement
   * - Utilisé pour la redirection après certaines actions
   */
  const router = useRouter();

  /**
   * Récupération de l'utilisateur depuis le store auth
   *
   * UTILISATION:
   * - user: Objet User complet (null si non authentifié)
   * - Utilisé pour vérifier si l'utilisateur est le propriétaire
   * - Utilisé pour afficher conditionnellement certaines actions
   */
  const { user } = useAuthStore();

  /**
   * ID de l'item extrait des paramètres de route
   *
   * TYPE:
   * - string: ID de l'item (ex: "123", "mock-1")
   *
   * UTILISATION:
   * - Utilisé pour charger l'item via l'API
   * - Utilisé pour déterminer si c'est un item mock
   */
  const itemId = params.id as string;

  // ============================================
  // DÉTECTION DU MODE MOCK
  // ============================================

  /**
   * Vérification si l'item est un item mock
   *
   * LOGIQUE:
   * - Si l'ID commence par "mock-", c'est un item mock
   * - Les items mock sont utilisés pour prévisualiser le design sans backend
   *
   * EXEMPLES:
   * - "mock-1" -> isMock = true
   * - "mock-2" -> isMock = true
   * - "123" -> isMock = false
   *
   * UTILISATION:
   * - Si isMock === true: Utilise MOCK_ITEM au lieu de l'API
   * - Si isMock === false: Charge l'item via l'API
   */
  const isMock = itemId?.startsWith('mock-');

  // ============================================
  // DONNÉES MOCK (pour développement)
  // ============================================

  /**
   * DONNÉES MOCK: MOCK_ITEM
   *
   * Item mock utilisé pour prévisualiser le design sans backend.
   *
   * UTILISATION:
   * - Seulement si isMock === true
   * - Permet de tester l'interface sans connexion au backend
   * - Utile pour le développement et les démos
   *
   * STRUCTURE:
   * - Contient toutes les propriétés d'un Item réel
   * - Données varient selon l'ID (mock-1, mock-2, mock-3)
   * - Photos depuis Unsplash pour un rendu réaliste
   *
   * EXEMPLES:
   * - mock-1: Chaise vintage en bois (HOME, GOOD)
   * - mock-2: Roman policier (BOOKS, NEW)
   * - mock-3: Perceuse sans fil (TOOLS, GOOD)
   *
   * NOTE:
   * - null si isMock === false (pas de données mock)
   */
  const MOCK_ITEM = isMock
    ? {
        id: itemId,
        ownerId: 'u-mock',
        /**
         * Titre de l'item selon l'ID mock
         * - mock-1: "Chaise vintage en bois"
         * - mock-2: "Roman policier - état neuf"
         * - mock-3: "Perceuse sans fil 18V"
         */
        title:
          itemId === 'mock-1'
            ? 'Chaise vintage en bois'
            : itemId === 'mock-2'
              ? 'Roman policier - état neuf'
              : 'Perceuse sans fil 18V',
        /**
         * Description de l'item selon l'ID mock
         * - mock-1: Description d'une chaise vintage
         * - mock-2: Description d'un livre
         * - mock-3: Description d'un outil
         */
        description:
          itemId === 'mock-1'
            ? 'Chaise en bois massif restaurée, idéale pour un intérieur rétro.'
            : itemId === 'mock-2'
              ? 'Livre lu une fois, comme neuf. Échange contre livre de science-fiction.'
              : 'Outil en bon état, batterie récente. Échange contre outils de jardinage.',
        /**
         * Catégorie de l'item selon l'ID mock
         * - mock-1: 'HOME'
         * - mock-2: 'BOOKS'
         * - mock-3: 'TOOLS'
         */
        category:
          itemId === 'mock-2'
            ? 'BOOKS'
            : itemId === 'mock-3'
              ? 'TOOLS'
              : 'HOME',
        /**
         * Condition de l'item selon l'ID mock
         * - mock-1: 'GOOD'
         * - mock-2: 'NEW'
         * - mock-3: 'GOOD'
         */
        condition: itemId === 'mock-2' ? 'NEW' : 'GOOD',
        /**
         * Statut de l'item (toujours 'AVAILABLE' pour les mocks)
         */
        status: 'AVAILABLE',
        /**
         * Tags de l'item selon l'ID mock
         * - mock-1: ['vintage', 'bois', 'restauré']
         * - mock-2: ['livre', 'roman', 'policier']
         * - mock-3: ['outil', 'bricolage']
         */
        tags:
          itemId === 'mock-1'
            ? ['vintage', 'bois', 'restauré']
            : itemId === 'mock-2'
              ? ['livre', 'roman', 'policier']
              : ['outil', 'bricolage'],
        /**
         * Analyse IA (non disponible pour les mocks)
         */
        aiSummary: undefined,
        aiRepairTip: undefined,
        /**
         * Score de popularité (0 pour les mocks)
         */
        popularityScore: 0,
        /**
         * Photos de l'item depuis Unsplash
         *
         * STRUCTURE:
         * - Une photo par item mock
         * - URL depuis Unsplash pour un rendu réaliste
         * - publicId: 'mock' (identifiant mock)
         */
        photos: [
          {
            id: 'p-mock',
            itemId,
            /**
             * URL de la photo depuis Unsplash selon l'ID mock
             * - mock-1: Photo de chaise
             * - mock-2: Photo de livre
             * - mock-3: Photo d'outil
             */
            url:
              itemId === 'mock-1'
                ? 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?q=80&w=1200&auto=format&fit=crop'
                : itemId === 'mock-2'
                  ? 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0ea?q=80&w=1200&auto=format&fit=crop'
                  : 'https://images.unsplash.com/photo-1563453392212-326f5e854473?q=80&w=1200&auto=format&fit=crop',
            publicId: 'mock',
            createdAt: new Date().toISOString(),
          },
        ],
        /**
         * Date de création (il y a 24 heures pour les mocks)
         */
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        /**
         * Date de mise à jour (maintenant pour les mocks)
         */
        updatedAt: new Date().toISOString(),
        /**
         * Propriétaire mock
         *
         * STRUCTURE:
         * - Utilisateur démo avec données fictives
         * - Localisation: 'France'
         * - Pas d'avatar (avatarUrl: undefined)
         */
        owner: {
          id: 'u-mock',
          email: 'mock@example.com',
          displayName: 'Utilisateur démo',
          avatarUrl: undefined,
          bio: undefined,
          location: 'France',
          roles: 'USER' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }
    : null;

  // ============================================
  // REQUÊTE REACT QUERY
  // ============================================

  /**
   * Requête React Query pour récupérer l'item depuis l'API
   *
   * CONFIGURATION:
   * - queryKey: ['item', itemId] - Clé unique incluant l'ID
   * - queryFn: () => itemsApi.getItem(itemId) - Fonction de récupération
   * - enabled: !!itemId && !isMock - Active seulement si itemId existe et pas mock
   *
   * ÉTATS:
   * - data (itemApi): Item récupéré depuis l'API (si succès)
   * - isLoading: true pendant le chargement
   * - error: Erreur si la requête échoue
   *
   * CACHE:
   * - Les données sont mises en cache par React Query
   * - Réutilisées si la même requête est faite
   * - Invalidées si nécessaire (après modification, etc.)
   */
  const {
    data: itemApi,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => itemsApi.getItem(itemId),
    /**
     * enabled: Active la requête seulement si:
     * - itemId existe (!!itemId)
     * - Ce n'est pas un item mock (!isMock)
     *
     * POURQUOI:
     * - Évite les appels API inutiles pour les items mock
     * - Évite les appels API si itemId est undefined
     */
    enabled: !!itemId && !isMock,
  });

  // ============================================
  // DÉTERMINATION DE L'ITEM À AFFICHER
  // ============================================

  /**
   * Item à afficher (mock ou API)
   *
   * LOGIQUE:
   * - Si isMock === true: Utilise MOCK_ITEM
   * - Si isMock === false: Utilise itemApi (depuis l'API)
   *
   * TYPE:
   * - Cast en any pour éviter les erreurs TypeScript
   * - Les deux sources ont la même structure (Item)
   */
  const item = (isMock ? MOCK_ITEM : itemApi) as any;

  // ============================================
  // VÉRIFICATION DU PROPRIÉTAIRE
  // ============================================

  /**
   * Vérification si l'utilisateur est le propriétaire de l'item
   *
   * LOGIQUE:
   * - user && item: Vérifie que user et item existent
   * - user.id === item.ownerId: Compare les IDs
   *
   * RÉSULTAT:
   * - true: L'utilisateur est le propriétaire
   * - false: L'utilisateur n'est pas le propriétaire (ou non connecté)
   *
   * UTILISATION:
   * - Affiche ItemOwnerActions si isOwner === true
   * - Affiche ProposeExchangeModal si isOwner === false
   */
  const isOwner = Boolean(user && item && user.id === item.ownerId);

  // ============================================
  // FONCTION UTILITAIRE: formatRelativeTime
  // ============================================

  /**
   * FONCTION: formatRelativeTime
   *
   * Formate une date en temps relatif (ex: "il y a 2 jours").
   *
   * PARAMÈTRES:
   * - date: String ISO de la date à formater
   *
   * RETOUR:
   * - String formatée en français (ex: "il y a 2 jours", "à l'instant")
   *
   * UTILISATION:
   * - Affiche la date de publication de l'item
   * - Format relatif plus lisible que la date absolue
   *
   * EXEMPLES:
   * - formatRelativeTime("2024-01-01T00:00:00Z") -> "il y a 2 jours"
   * - formatRelativeTime(new Date().toISOString()) -> "à l'instant"
   *
   * @param date - Date à formater (string ISO)
   * @returns Date formatée en temps relatif (string)
   */
  const formatRelativeTime = (date: string) => {
    /**
     * formatDistanceToNow formate la date en temps relatif
     *
     * OPTIONS:
     * - addSuffix: true -> Ajoute "il y a" ou "dans" (ex: "il y a 2 jours")
     * - locale: fr -> Format en français
     *
     * RETOUR:
     * - String formatée (ex: "il y a 2 jours", "il y a 3 heures")
     */
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: fr,
    });
  };

  // ============================================
  // ÉTAT DE CHARGEMENT
  // ============================================

  /**
   * Affichage du skeleton loader pendant le chargement
   *
   * CONDITION:
   * - Affiche seulement si isLoading === true
   * - Seulement pour les items non mock (les mocks sont instantanés)
   *
   * STRUCTURE:
   * - Skeleton pour le bouton retour
   * - Skeleton pour la galerie de photos (h-96)
   * - Skeleton pour les informations (h-32)
   * - Skeleton pour la sidebar (h-64, h-32)
   *
   * UX:
   * - Donne un feedback visuel pendant le chargement
   * - Indique que la page est en train de charger
   * - Évite un écran blanc
   */
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Skeleton pour le bouton retour */}
          <div className="mb-8 h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Skeleton pour le contenu principal (2/3) */}
            <div className="space-y-6 lg:col-span-2">
              {/* Skeleton pour la galerie de photos */}
              <div className="h-96 animate-pulse rounded-lg bg-muted" />
              {/* Skeleton pour les informations */}
              <div className="h-32 animate-pulse rounded-lg bg-muted" />
            </div>
            {/* Skeleton pour la sidebar (1/3) */}
            <div className="space-y-6">
              {/* Skeleton pour les informations du propriétaire */}
              <div className="h-64 animate-pulse rounded-lg bg-muted" />
              {/* Skeleton pour les actions */}
              <div className="h-32 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // GESTION D'ERREUR
  // ============================================

  /**
   * Affichage de l'erreur si l'item n'est pas trouvé
   *
   * CONDITION:
   * - Affiche seulement si !isMock (pas pour les items mock)
   * - Affiche si error existe ou si item est null/undefined
   *
   * ERREURS POSSIBLES:
   * - Item n'existe pas (404)
   * - Item a été supprimé
   * - Erreur réseau
   * - Erreur serveur
   *
   * UX:
   * - Message d'erreur clair et informatif
   * - Bouton pour retourner à l'exploration
   * - Permet à l'utilisateur de continuer à naviguer
   */
  if (!isMock && (error || !item)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          {/* Icône d'erreur */}
          <div className="mb-4 text-6xl">❌</div>
          {/* Titre d'erreur */}
          <h2 className="mb-2 text-2xl font-semibold">Objet non trouvé</h2>
          {/* Message d'erreur */}
          <p className="mb-4 text-muted-foreground">
            L'objet que vous recherchez n'existe pas ou a été supprimé.
          </p>
          {/* Bouton pour retourner à l'exploration
           *
           * NAVIGATION:
           * - Lien vers /explore pour voir tous les objets
           * - Permet à l'utilisateur de continuer à naviguer
           */}
          <Button asChild>
            <Link href="/explore">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'exploration
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDU DU COMPOSANT
  // ============================================

  /**
   * Rendu de la page de détail de l'item
   *
   * STRUCTURE:
   * - Conteneur principal avec animation Framer Motion
   * - Bouton retour vers /explore
   * - Bannière de recommandation (MatchBanner)
   * - Grille principale: Contenu (2/3) + Sidebar (1/3)
   * - Contenu: Photos, informations, badges, tags, analyse IA
   * - Sidebar: Propriétaire, actions (propriétaire ou visiteur)
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
       * - mx-auto max-w-4xl: Centré avec largeur maximale de 56rem (896px)
       * - Responsive: S'adapte à la taille de l'écran
       */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-4xl"
      >
        {/* ============================================
            NAVIGATION
            ============================================ */}
        {/* Bouton retour vers l'exploration
         *
         * NAVIGATION:
         * - Lien vers /explore pour voir tous les objets
         * - Permet de revenir à la liste après avoir vu les détails
         *
         * STYLE:
         * - variant="ghost": Style transparent (pas de bordure)
         * - mb-8: Marge-bottom pour séparer du contenu
         */}
        <div className="mb-8">
          <Button variant="ghost" asChild>
            <Link href="/explore">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'exploration
            </Link>
          </Button>
        </div>

        {/* ============================================
            BANNIÈRE DE RECOMMANDATION
            ============================================ */}
        {/* Bannière de recommandation IA
         *
         * FONCTIONNEMENT:
         * - Affiche seulement si l'item a un score de correspondance
         * - Score calculé par l'algorithme de matching
         * - Affiche le score et les raisons de la recommandation
         *
         * COMPOSANT:
         * - MatchBanner: Composant qui affiche la bannière
         * - Reçoit l'item complet pour calculer/afficher le score
         */}
        <MatchBanner item={item} />

        {/* ============================================
            GRILLE PRINCIPALE
            ============================================ */}
        {/* Grille principale avec contenu et sidebar
         *
         * STRUCTURE:
         * - grid grid-cols-1: 1 colonne sur mobile
         * - lg:grid-cols-3: 3 colonnes sur desktop
         * - gap-8: Espacement de 2rem entre les colonnes
         *
         * LAYOUT:
         * - Contenu principal: 2 colonnes sur 3 (lg:col-span-2)
         * - Sidebar: 1 colonne sur 3
         */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ============================================
              CONTENU PRINCIPAL
              ============================================ */}
          {/* Section principale du contenu (2/3 de la largeur)
           *
           * CONTENU:
           * - Photos de l'item (ItemPhotos)
           * - Informations de base (titre, description, badges)
           * - Tags
           * - Analyse IA (si disponible)
           *
           * STYLE:
           * - lg:col-span-2: Prend 2 colonnes sur 3 en large écran
           * - space-y-6: Espacement vertical de 1.5rem entre les sections
           */}
          <div className="space-y-6 lg:col-span-2">
            {/* ============================================
                PHOTOS
                ============================================ */}
            {/* Galerie de photos de l'item
             *
             * COMPOSANT:
             * - ItemPhotos: Composant qui affiche la galerie
             *   - Gère l'affichage des photos avec lightbox
             *   - Permet l'upload de nouvelles photos si isOwner === true
             *
             * PROPS:
             * - photos: Array de photos de l'item
             * - itemId: ID de l'item (pour l'upload)
             * - isOwner: true si l'utilisateur est le propriétaire
             */}
            <ItemPhotos
              photos={item.photos}
              itemId={item.id}
              isOwner={isOwner}
            />

            {/* ============================================
                INFORMATIONS DE BASE
                ============================================ */}
            {/* Carte avec les informations principales de l'item
             *
             * CONTENU:
             * - Titre de l'item
             * - Badges: Catégorie, condition, statut
             * - Description détaillée
             * - Tags (si disponibles)
             * - Analyse IA (si disponible)
             */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    {/* Titre de l'item
                     * - text-2xl: Taille de police grande
                     */}
                    <CardTitle className="text-2xl">{item.title}</CardTitle>
                    {/* Badges de métadonnées
                     *
                     * CONTENU:
                     * - Badge catégorie (variant="secondary")
                     * - Badge condition (variant="outline")
                     * - Badge statut (variant dynamique selon le statut)
                     *
                     * STYLE:
                     * - flex flex-wrap gap-2: Affichage horizontal avec retour à la ligne
                     * - mt-2: Marge-top pour séparer du titre
                     */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {/* Badge de catégorie
                       * - Affiche le label français de la catégorie
                       * - Fallback sur la valeur brute si le label n'existe pas
                       */}
                      <Badge variant="secondary">
                        {ITEM_CATEGORY_LABELS[item.category] || item.category}
                      </Badge>
                      {/* Badge de condition
                       * - Affiche le label français de la condition
                       * - Fallback sur la valeur brute si le label n'existe pas
                       */}
                      <Badge variant="outline">
                        {ITEM_CONDITION_LABELS[item.condition] ||
                          item.condition}
                      </Badge>
                      {/* Badge de statut
                       *
                       * VARIANT DYNAMIQUE:
                       * - item.status === 'AVAILABLE': variant="default" (vert)
                       * - Sinon: variant="secondary" (gris)
                       *
                       * AFFICHAGE:
                       * - Affiche le label français du statut
                       * - Fallback sur la valeur brute si le label n'existe pas
                       */}
                      <Badge
                        variant={
                          item.status === 'AVAILABLE' ? 'default' : 'secondary'
                        }
                      >
                        {ITEM_STATUS_LABELS[item.status] || item.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description de l'item
                 * - text-muted-foreground: Couleur atténuée
                 */}
                <p className="text-muted-foreground">{item.description}</p>

                {/* ============================================
                    TAGS
                    ============================================ */}
                {/* Section des tags (affichage conditionnel)
                 *
                 * CONDITION:
                 * - Affiche seulement si item.tags.length > 0
                 *
                 * CONTENU:
                 * - Titre "Tags"
                 * - Liste de badges pour chaque tag
                 */}
                {item.tags.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-medium">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {/* Générer un badge pour chaque tag
                       *
                       * key={tag}: Clé unique pour React (le tag lui-même est unique)
                       * variant="outline": Style avec bordure
                       */}
                      {item.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* ============================================
                    ANALYSE IA
                    ============================================ */}
                {/* Section d'analyse IA (affichage conditionnel)
                 *
                 * CONDITION:
                 * - Affiche seulement si item.aiSummary ou item.aiRepairTip existe
                 *
                 * CONTENU:
                 * - Résumé IA (si disponible)
                 * - Conseil de réparation (si disponible)
                 *
                 * STYLE:
                 * - bg-primary/10: Fond avec opacité 10% de la couleur primaire
                 * - p-4: Padding pour l'espacement
                 * - rounded-lg: Coins arrondis
                 */}
                {(item.aiSummary || item.aiRepairTip) && (
                  <div className="rounded-lg bg-primary/10 p-4">
                    {/* Titre de la section avec icône
                     * - flex items-center gap-2: Alignement horizontal avec icône
                     * - text-primary: Couleur primaire
                     */}
                    <h4 className="mb-3 flex items-center gap-2 font-medium text-primary">
                      <Sparkles className="h-4 w-4" />
                      Analyse IA
                    </h4>
                    {/* Résumé IA (affichage conditionnel)
                     *
                     * CONDITION:
                     * - Affiche seulement si item.aiSummary existe
                     *
                     * CONTENU:
                     * - Résumé généré par l'IA (Gemini)
                     * - Description courte de l'objet
                     */}
                    {item.aiSummary && (
                      <div className="mb-3">
                        <h5 className="mb-1 text-sm font-medium">Résumé</h5>
                        <p className="text-sm text-muted-foreground">
                          {item.aiSummary}
                        </p>
                      </div>
                    )}
                    {/* Conseil de réparation (affichage conditionnel)
                     *
                     * CONDITION:
                     * - Affiche seulement si item.aiRepairTip existe
                     *
                     * CONTENU:
                     * - Conseil de réparation généré par l'IA (Gemini)
                     * - Astuces pour réparer/maintenir l'objet
                     */}
                    {item.aiRepairTip && (
                      <div>
                        <h5 className="mb-1 flex items-center gap-1 text-sm font-medium">
                          <Wrench className="h-3 w-3" />
                          Conseil de réparation
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {item.aiRepairTip}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ============================================
              SIDEBAR
              ============================================ */}
          {/* Sidebar avec informations du propriétaire et actions
           *
           * CONTENU:
           * - Informations du propriétaire (avatar, nom, localisation, date)
           * - Actions du propriétaire (si isOwner === true)
           * - Actions pour les visiteurs (si isOwner === false et status === 'AVAILABLE')
           *
           * STYLE:
           * - space-y-6: Espacement vertical de 1.5rem entre les cartes
           * - 1 colonne sur 3 en large écran
           */}
          <div className="space-y-6">
            {/* ============================================
                INFORMATIONS DU PROPRIÉTAIRE
                ============================================ */}
            {/* Carte avec les informations du propriétaire
             *
             * CONTENU:
             * - Avatar du propriétaire (ou icône User si pas d'avatar)
             * - Nom d'affichage
             * - Localisation (si disponible)
             * - Date de publication (format relatif)
             */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Propriétaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Section avatar et nom
                 *
                 * STRUCTURE:
                 * - Avatar circulaire (image ou icône)
                 * - Nom d'affichage
                 * - Localisation (si disponible)
                 */}
                <div className="flex items-center gap-3">
                  {/* Conteneur de l'avatar
                   *
                   * STYLE:
                   * - h-10 w-10: Taille de 40px (cercle)
                   * - rounded-full: Forme circulaire
                   * - bg-primary/10: Fond avec opacité 10% de la couleur primaire
                   */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {/* Image de l'avatar (affichage conditionnel)
                     *
                     * CONDITION:
                     * - Affiche l'image si item.owner.avatarUrl existe
                     * - Sinon, affiche l'icône User
                     *
                     * STYLE:
                     * - h-full w-full: Taille complète du conteneur
                     * - rounded-full: Forme circulaire
                     * - object-cover: Couvre tout l'espace sans déformation
                     */}
                    {item.owner.avatarUrl ? (
                      <img
                        src={item.owner.avatarUrl}
                        alt={item.owner.displayName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      /* Icône User si pas d'avatar
                       * - h-5 w-5: Taille de 20px
                       */
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    {/* Nom d'affichage du propriétaire
                     * - font-medium: Poids de police moyen
                     */}
                    <p className="font-medium">{item.owner.displayName}</p>
                    {/* Localisation (affichage conditionnel)
                     *
                     * CONDITION:
                     * - Affiche seulement si item.owner.location existe
                     *
                     * STYLE:
                     * - flex items-center gap-1: Alignement horizontal avec icône
                     * - text-sm text-muted-foreground: Taille petite et couleur atténuée
                     */}
                    {item.owner.location && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {item.owner.location}
                      </p>
                    )}
                  </div>
                </div>
                {/* Date de publication
                 *
                 * FORMAT:
                 * - formatRelativeTime(item.createdAt): Format relatif (ex: "il y a 2 jours")
                 * - formatDistanceToNow avec locale française
                 *
                 * STYLE:
                 * - flex items-center gap-2: Alignement horizontal avec icône
                 * - text-sm text-muted-foreground: Taille petite et couleur atténuée
                 */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Publié {formatRelativeTime(item.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* ============================================
                ACTIONS DU PROPRIÉTAIRE
                ============================================ */}
            {/* Actions spécifiques au propriétaire (affichage conditionnel)
             *
             * CONDITION:
             * - Affiche seulement si isOwner === true
             *
             * COMPOSANT:
             * - ItemOwnerActions: Composant qui affiche les actions
             *   - Édition de l'item
             *   - Archivage de l'item
             *   - Suppression de l'item
             *
             * PROPS:
             * - itemId: ID de l'item à gérer
             * - currentStatus: Statut actuel de l'item (pour les actions conditionnelles)
             */}
            {isOwner && (
              <ItemOwnerActions itemId={item.id} currentStatus={item.status} />
            )}

            {/* ============================================
                ACTIONS POUR LES VISITEURS
                ============================================ */}
            {/* Actions pour les non-propriétaires (affichage conditionnel)
             *
             * CONDITION:
             * - Affiche seulement si isOwner === false
             * - Affiche seulement si item.status === 'AVAILABLE'
             *
             * CONTENU:
             * - Message d'invitation à proposer un échange
             * - Bouton "Proposer un échange" (si connecté)
             * - Bouton "Se connecter pour contacter" (si non connecté)
             */}
            {!isOwner && item.status === 'AVAILABLE' && (
              <Card>
                <CardContent className="p-6 text-center">
                  {/* Titre de la section */}
                  <h3 className="mb-2 font-semibold">
                    Intéressé par cet objet ?
                  </h3>
                  {/* Message d'invitation */}
                  <p className="mb-4 text-sm text-muted-foreground">
                    Proposez un de vos objets en échange
                  </p>
                  {/* Actions selon l'état d'authentification
                   *
                   * CONDITION:
                   * - Si user existe: Affiche ProposeExchangeModal
                   * - Si user n'existe pas: Affiche bouton de connexion
                   */}
                  {user ? (
                    /* Modal de proposition d'échange
                     *
                     * COMPOSANT:
                     * - ProposeExchangeModal: Modal qui permet de proposer un échange
                     *   - Affiche la liste des items de l'utilisateur
                     *   - Permet de sélectionner un item à échanger
                     *   - Crée l'échange via l'API
                     *
                     * PROPS:
                     * - requestedItem: Item demandé (celui affiché sur cette page)
                     * - responderId: ID du propriétaire de l'item demandé
                     *
                     * TRIGGER:
                     * - Bouton "Proposer un échange" qui ouvre le modal
                     */
                    <ProposeExchangeModal
                      requestedItem={item}
                      responderId={item.ownerId}
                    >
                      <Button className="w-full">Proposer un échange</Button>
                    </ProposeExchangeModal>
                  ) : (
                    /* Bouton de connexion
                     *
                     * NAVIGATION:
                     * - Lien vers /login avec paramètre 'next'
                     * - Redirige vers cette page après connexion
                     *
                     * STYLE:
                     * - w-full: Largeur complète
                     * - asChild: Utilise le Link comme bouton stylisé
                     */
                    <Button className="w-full" asChild>
                      <Link href={`/login?next=/item/${item.id}`}>
                        Se connecter pour contacter
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
