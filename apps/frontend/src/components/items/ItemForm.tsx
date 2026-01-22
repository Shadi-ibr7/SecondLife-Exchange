/**
 * FICHIER: components/items/ItemForm.tsx
 *
 * DESCRIPTION:
 * Ce composant affiche un formulaire complet pour créer ou modifier un item (objet).
 * Il gère tous les champs nécessaires avec validation en temps réel, gestion des tags,
 * et option d'aide IA pour automatiser certaines tâches. Ce composant est utilisé
 * dans les pages de création et d'édition d'items.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Formulaire avec validation Zod (validation côté client)
 * - Gestion des tags (ajout/suppression dynamique, maximum 10 tags)
 * - Option d'aide IA (Gemini) pour catégorie et tags automatiques
 * - Mode création ou édition (adaptation selon le contexte)
 * - Validation en temps réel avec affichage des erreurs
 * - Gestion des erreurs avec toast notifications
 * - Intégration avec React Hook Form pour la gestion du formulaire
 *
 * CHAMPS DU FORMULAIRE:
 * - title: Titre de l'item (3-120 caractères, requis)
 * - description: Description détaillée (10-2000 caractères, requis)
 * - category: Catégorie (optionnel si IA activée, sinon requis)
 * - condition: État de l'item (requis: NEW, GOOD, FAIR, TO_REPAIR)
 * - tags: Tags personnalisés (max 10, 2-24 caractères chacun, optionnel)
 * - aiAuto: Activer l'aide IA (optionnel, boolean)
 *
 * VALIDATION:
 * - Validation côté client avec Zod (avant soumission)
 * - Validation côté serveur via l'API (double vérification)
 * - Messages d'erreur en français affichés sous chaque champ
 *
 * GESTION DES TAGS:
 * - Ajout de tags via input + bouton ou touche Enter
 * - Suppression de tags via bouton X sur chaque badge
 * - Limite de 10 tags maximum
 * - Validation: 2-24 caractères par tag
 * - Pas de doublons (vérification avant ajout)
 *
 * AIDE IA (Gemini):
 * - Option pour activer l'aide IA
 * - L'IA peut suggérer automatiquement:
 *   - La catégorie appropriée
 *   - Des tags pertinents
 *   - Un résumé de l'objet
 * - Si activée, la catégorie devient optionnelle (l'IA peut la fournir)
 *
 * UTILISATION:
 * ```tsx
 * <ItemForm
 *   mode="create"
 *   onSubmit={async (data) => {
 *     await createItem(data);
 *   }}
 * />
 * ```
 *
 * @module components/items/ItemForm
 */

'use client';

// Import de React
import { useState } from 'react';

// Import de React Hook Form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Import de Zod pour la validation
import { z } from 'zod';

// Import des composants UI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Import des constantes
import {
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  ITEM_CATEGORY_LABELS,
  ITEM_CONDITION_LABELS,
  UPLOAD_CONFIG,
} from '@/lib/constants';

// Import des types
import {
  CreateItemDto,
  UpdateItemDto,
  Item,
  ItemCategory,
  ItemCondition,
} from '@/types';

// Import de react-hot-toast
import { toast } from 'react-hot-toast';

// Import des icônes
import { Sparkles, Tag, X } from 'lucide-react';

// Import du composant de sélection de photos
import { PhotoSelector } from './PhotoSelector';

/**
 * SCHÉMA DE VALIDATION: itemSchema
 *
 * Définit les règles de validation Zod pour le formulaire d'item.
 * Ce schéma est utilisé par React Hook Form via zodResolver pour valider
 * les données du formulaire avant la soumission.
 *
 * RÈGLES DE VALIDATION:
 * - title: String, 3-120 caractères (requis)
 * - description: String, 10-2000 caractères (requis)
 * - category: String (optionnel si IA activée, sinon requis côté serveur)
 * - condition: String, non vide (requis)
 * - tags: Array de strings, max 10 tags, chaque tag 2-24 caractères (optionnel)
 * - aiAuto: Boolean, défaut false (optionnel)
 *
 * VALIDATION CONDITIONNELLE:
 * - Si aiAuto === true, category devient optionnel (l'IA peut la fournir)
 * - Si aiAuto === false, category devrait être requis (vérifié côté serveur)
 *
 * MESSAGES D'ERREUR:
 * Tous les messages sont en français pour une meilleure UX.
 */
const itemSchema = z.object({
  /**
   * Titre de l'item
   * - Minimum 3 caractères (évite les titres trop courts)
   * - Maximum 120 caractères (limite pour l'affichage)
   * - Requis (pas de valeur par défaut)
   */
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(120, 'Le titre ne peut pas dépasser 120 caractères'),

  /**
   * Description détaillée de l'item
   * - Minimum 10 caractères (évite les descriptions trop courtes)
   * - Maximum 2000 caractères (limite raisonnable pour une description)
   * - Requis (pas de valeur par défaut)
   */
  description: z
    .string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(2000, 'La description ne peut pas dépasser 2000 caractères'),

  /**
   * Catégorie de l'item
   * - Optionnel si IA activée (l'IA peut suggérer la catégorie)
   * - Sinon requis (vérifié côté serveur si aiAuto === false)
   * - Doit correspondre à une valeur de ITEM_CATEGORIES
   */
  category: z.string().optional(),

  /**
   * État de l'item
   * - Requis (minimum 1 caractère)
   * - Doit correspondre à une valeur de ITEM_CONDITIONS (NEW, GOOD, FAIR, TO_REPAIR)
   */
  condition: z.string().min(1, "L'état est requis"),

  /**
   * Tags personnalisés
   * - Array de strings
   * - Maximum 10 tags (limite pour éviter la surcharge)
   * - Chaque tag: 2-24 caractères (évite les tags trop courts/longs)
   * - Optionnel (peut être vide)
   */
  tags: z
    .array(
      z
        .string()
        .min(2, 'Un tag doit contenir au moins 2 caractères')
        .max(24, 'Un tag ne peut pas dépasser 24 caractères')
    )
    .max(10, 'Maximum 10 tags'),

  /**
   * Aide IA activée ou non
   * - Boolean
   * - Défaut: false (désactivée par défaut)
   * - Si true, l'IA peut suggérer catégorie et tags automatiquement
   */
  aiAuto: z.boolean().default(false),
});

/**
 * TYPE: ItemFormData
 *
 * Type TypeScript dérivé du schéma Zod.
 */
type ItemFormData = z.infer<typeof itemSchema>;

/**
 * INTERFACE: ItemFormProps
 *
 * Définit les propriétés acceptées par le composant.
 */
interface ItemFormProps {
  mode: 'create' | 'edit'; // Mode création ou édition
  initialData?: Item; // Données initiales (pour édition)
  onSubmit: (data: CreateItemDto | UpdateItemDto, photos?: File[]) => Promise<void>; // Fonction de soumission avec photos optionnelles
  isLoading?: boolean; // État de chargement
}

/**
 * COMPOSANT: ItemForm
 *
 * Formulaire complet pour créer ou modifier un item.
 *
 * FONCTIONNEMENT:
 * 1. Initialise le formulaire avec les données initiales (si édition)
 * 2. Gère les tags séparément (état local pour interaction dynamique)
 * 3. Valide les données avec Zod avant soumission
 * 4. Appelle onSubmit avec les données validées
 * 5. Affiche les erreurs de validation sous chaque champ
 *
 * MODES:
 * - 'create': Mode création (pas de données initiales)
 * - 'edit': Mode édition (initialData requis)
 *
 * GESTION DES TAGS:
 * Les tags sont gérés dans un état local séparé pour permettre:
 * - Ajout/suppression dynamique sans re-render complet
 * - Validation en temps réel
 * - Synchronisation avec React Hook Form via setValue
 *
 * @param mode - Mode création ou édition
 * @param initialData - Données initiales (pour édition, optionnel en création)
 * @param onSubmit - Fonction appelée lors de la soumission avec les données validées
 * @param isLoading - État de chargement (désactive le bouton submit pendant la soumission)
 */
export function ItemForm({
  mode,
  initialData,
  onSubmit,
  isLoading = false,
}: ItemFormProps) {
  // ============================================
  // GESTION DE L'ÉTAT LOCAL
  // ============================================

  /**
   * État pour la liste des tags
   *
   * INITIALISATION:
   * - Si initialData existe (mode édition), utilise les tags de l'item
   * - Sinon, commence avec un tableau vide
   *
   * UTILISATION:
   * - Affichage des badges de tags
   * - Ajout/suppression de tags
   * - Synchronisation avec React Hook Form
   */
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);

  /**
   * État pour la valeur de l'input de nouveau tag
   *
   * UTILISATION:
   * - Contrôle la valeur de l'input "Ajouter un tag"
   * - Réinitialisé à '' après ajout d'un tag
   */
  const [newTag, setNewTag] = useState('');

  /**
   * État pour les photos sélectionnées (mode création uniquement)
   *
   * UTILISATION:
   * - Stocke les fichiers sélectionnés avant la création
   * - Les photos seront uploadées après la création de l'objet
   * - Vide en mode édition (les photos existantes sont gérées ailleurs)
   */
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  
  /**
   * État pour l'erreur de validation des photos
   */
  const [photosError, setPhotosError] = useState<string | undefined>();

  // ============================================
  // CONFIGURATION DE REACT HOOK FORM
  // ============================================

  /**
   * Configuration de React Hook Form avec validation Zod
   *
   * HOOKS UTILISÉS:
   * - register: Enregistre les champs du formulaire
   * - handleSubmit: Gère la soumission avec validation
   * - formState.errors: Erreurs de validation par champ
   * - watch: Surveille les valeurs de champs spécifiques (aiAuto, category)
   * - setValue: Met à jour programmatiquement les valeurs (pour tags)
   */
  const {
    register, // Fonction pour enregistrer les champs (spread sur les inputs)
    handleSubmit, // Fonction pour gérer la soumission (wrapper avec validation)
    formState: { errors }, // Erreurs de validation par champ
    watch, // Surveille les valeurs de champs (pour aiAuto et category)
    setValue, // Met à jour programmatiquement les valeurs (pour synchroniser tags)
  } = useForm<ItemFormData>({
    /**
     * Résolveur Zod pour la validation
     * zodResolver(itemSchema) valide les données selon le schéma Zod
     * Les erreurs sont automatiquement attachées aux champs correspondants
     */
    resolver: zodResolver(itemSchema),

    /**
     * Valeurs par défaut du formulaire
     *
     * MODE CRÉATION:
     * - Tous les champs sont vides ('' ou [])
     * - aiAuto: false (désactivée par défaut)
     *
     * MODE ÉDITION:
     * - Les champs sont pré-remplis avec initialData
     * - Les tags sont initialisés depuis initialData.tags
     */
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      condition: initialData?.condition || '',
      tags: initialData?.tags || [],
      aiAuto: false,
    },
  });

  /**
   * Surveiller la valeur de aiAuto (aide IA)
   *
   * UTILISATION:
   * - Afficher/masquer le message d'aide IA
   * - Rendre la catégorie optionnelle si activée
   * - watch() retourne la valeur actuelle et déclenche un re-render si elle change
   */
  const aiAuto = watch('aiAuto');

  /**
   * Surveiller la valeur de category
   *
   * UTILISATION:
   * - Afficher le label conditionnel (optionnel si IA activée)
   * - watch() retourne la valeur actuelle
   */
  const category = watch('category');

  // ============================================
  // FONCTIONS DE GESTION DES TAGS
  // ============================================

  /**
   * FONCTION: addTag
   *
   * Ajoute un nouveau tag à la liste.
   *
   * VALIDATION:
   * - Le tag ne doit pas être vide (après trim)
   * - La liste ne doit pas dépasser 10 tags
   * - Le tag ne doit pas déjà exister (pas de doublons)
   *
   * ACTIONS:
   * 1. Vérifie les conditions de validation
   * 2. Ajoute le tag à la liste (état local)
   * 3. Synchronise avec React Hook Form (setValue)
   * 4. Réinitialise l'input (setNewTag(''))
   *
   * UTILISATION:
   * - Appelé via le bouton "Ajouter un tag"
   * - Appelé via la touche Enter dans l'input
   */
  const addTag = () => {
    /**
     * VALIDATION:
     * - newTag.trim(): le tag ne doit pas être vide (après suppression des espaces)
     * - tags.length < 10: la liste ne doit pas dépasser 10 tags
     * - !tags.includes(newTag.trim()): le tag ne doit pas déjà exister (pas de doublons)
     */
    if (newTag.trim() && tags.length < 10 && !tags.includes(newTag.trim())) {
      /**
       * Créer une nouvelle liste avec le tag ajouté
       * [...tags, newTag.trim()] crée un nouveau tableau (immutabilité)
       * trim() supprime les espaces en début/fin
       */
      const updatedTags = [...tags, newTag.trim()];

      /**
       * Mettre à jour l'état local
       * setTags() déclenche un re-render pour afficher le nouveau tag
       */
      setTags(updatedTags);

      /**
       * Synchroniser avec React Hook Form
       * setValue() met à jour la valeur du champ 'tags' dans le formulaire
       * Cela permet à la validation Zod de vérifier les tags
       */
      setValue('tags', updatedTags);

      /**
       * Réinitialiser l'input
       * setNewTag('') vide l'input pour permettre l'ajout d'un nouveau tag
       */
      setNewTag('');
    }
  };

  /**
   * FONCTION: removeTag
   *
   * Supprime un tag de la liste.
   *
   * ACTIONS:
   * 1. Filtre la liste pour retirer le tag spécifié
   * 2. Met à jour l'état local
   * 3. Synchronise avec React Hook Form
   *
   * UTILISATION:
   * - Appelé via le bouton X sur chaque badge de tag
   *
   * @param tagToRemove - Le tag à supprimer (string)
   */
  const removeTag = (tagToRemove: string) => {
    /**
     * Filtrer la liste pour retirer le tag spécifié
     * tags.filter() crée un nouveau tableau sans le tag à supprimer
     * (tag) => tag !== tagToRemove: garde tous les tags sauf celui à supprimer
     */
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);

    /**
     * Mettre à jour l'état local
     * setTags() déclenche un re-render pour retirer le tag de l'affichage
     */
    setTags(updatedTags);

    /**
     * Synchroniser avec React Hook Form
     * setValue() met à jour la valeur du champ 'tags' dans le formulaire
     */
    setValue('tags', updatedTags);
  };

  // ============================================
  // FONCTION: handleFormSubmit
  // ============================================

  /**
   * FONCTION: handleFormSubmit
   *
   * Gère la soumission du formulaire après validation.
   *
   * FLUX:
   * 1. Les données sont déjà validées par Zod (via handleSubmit)
   * 2. Valide les photos (obligatoires en mode création)
   * 3. Transforme les données pour correspondre au format API
   * 4. Appelle onSubmit avec les données transformées et les photos
   * 5. Affiche un toast d'erreur si la soumission échoue
   *
   * TRANSFORMATIONS:
   * - tags: Convertit en undefined si vide (pour ne pas envoyer un tableau vide)
   * - category: Cast en ItemCategory (type-safe)
   * - condition: Cast en ItemCondition (type-safe)
   *
   * VALIDATION PHOTOS:
   * - En mode création: les photos sont obligatoires (au moins 1)
   * - En mode édition: les photos sont optionnelles (on peut modifier sans changer les photos)
   *
   * GESTION D'ERREUR:
   * - Si onSubmit échoue (erreur API, validation serveur, etc.)
   * - Affiche un toast d'erreur générique
   * - L'erreur spécifique est gérée par le composant parent
   *
   * @param data - Données du formulaire validées par Zod
   */
  const handleFormSubmit = async (data: ItemFormData) => {
    try {
      // Validation des photos en mode création
      if (mode === 'create' && selectedPhotos.length === 0) {
        setPhotosError('Au moins une photo est requise');
        toast.error('Veuillez sélectionner au moins une photo');
        return;
      }
      setPhotosError(undefined);

      /**
       * Transformer les données pour correspondre au format API
       *
       * TRANSFORMATIONS:
       * - ...data: Spread toutes les propriétés de data
       * - tags: Si tags.length > 0, garde les tags, sinon undefined
       *   (pour ne pas envoyer un tableau vide à l'API)
       * - category: Cast en ItemCategory pour le type-safety
       * - condition: Cast en ItemCondition pour le type-safety
       */
      const submitData = {
        ...data,
        tags: tags.length > 0 ? tags : undefined, // undefined si vide (pas de tableau vide)
        category: data.category as ItemCategory | undefined, // Cast pour type-safety
        condition: data.condition as ItemCondition, // Cast pour type-safety
      };

      /**
       * Appeler la fonction onSubmit du parent avec les photos
       * onSubmit est une fonction async qui fait l'appel API
       * (ex: createItem() ou updateItem())
       * Les photos seront uploadées après la création de l'objet
       */
      await onSubmit(submitData, mode === 'create' ? selectedPhotos : undefined);
    } catch (error) {
      /**
       * En cas d'erreur, afficher un toast d'erreur
       *
       * NOTE:
       * L'erreur spécifique est généralement gérée par le composant parent
       * (ex: toast d'erreur avec le message du serveur)
       * Ici, on affiche juste un message générique en fallback
       */
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  // ============================================
  // RENDU DU COMPOSANT
  // ============================================

  /**
   * Rendu du formulaire avec tous les champs
   *
   * STRUCTURE:
   * - Card: Conteneur principal avec header et content
   * - Form: Formulaire avec validation React Hook Form
   * - Champs: Titre, Description, État, Catégorie, Tags, IA Auto
   * - Bouton: Soumission avec état de chargement
   */
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {/**
           * Titre dynamique selon le mode
           * - 'create': "Créer un nouvel objet"
           * - 'edit': "Modifier l'objet"
           */}
          {mode === 'create' ? 'Créer un nouvel objet' : "Modifier l'objet"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/**
         * Formulaire avec validation React Hook Form
         *
         * handleSubmit(handleFormSubmit):
         * - handleSubmit: wrapper de React Hook Form qui valide avant soumission
         * - handleFormSubmit: fonction appelée si validation réussie
         *
         * space-y-6: espacement vertical de 1.5rem entre les champs
         */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* ============================================
              CHAMP: Titre
              ============================================ */}
          <div>
            <Label htmlFor="title">Titre *</Label>
            {/**
             * Input pour le titre
             *
             * {...register('title')}:
             * - Enregistre le champ dans React Hook Form
             * - Ajoute les props nécessaires (onChange, onBlur, ref, etc.)
             * - Active la validation Zod pour ce champ
             */}
            <Input
              id="title"
              {...register('title')}
              placeholder="Titre de votre objet"
              className="mt-1"
            />
            {/**
             * Affichage de l'erreur de validation
             *
             * errors.title:
             * - Contient l'erreur si la validation échoue
             * - undefined si pas d'erreur
             *
             * errors.title.message:
             * - Message d'erreur défini dans le schéma Zod
             * - Ex: "Le titre doit contenir au moins 3 caractères"
             */}
            {errors.title && (
              <p className="mt-1 text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* ============================================
              CHAMP: Description
              ============================================ */}
          <div>
            <Label htmlFor="description">Description *</Label>
            {/**
             * Textarea pour la description
             *
             * NOTE: Utilisation d'un textarea natif au lieu du composant Textarea
             * pour avoir plus de contrôle sur le style (min-h, resize-none)
             *
             * {...register('description')}:
             * - Enregistre le champ dans React Hook Form
             * - Active la validation Zod
             *
             * STYLE:
             * - min-h-[120px]: hauteur minimale de 120px
             * - resize-none: empêche le redimensionnement par l'utilisateur
             * - border-input: couleur de bordure selon le thème
             * - bg-background: couleur de fond selon le thème
             */}
            <textarea
              id="description"
              {...register('description')}
              placeholder="Décrivez votre objet en détail..."
              className="mt-1 min-h-[120px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {/**
             * Affichage de l'erreur de validation
             */}
            {errors.description && (
              <p className="mt-1 text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* ============================================
              CHAMP: Photos (mode création uniquement)
              ============================================ */}
          {mode === 'create' && (
            <div>
              <Label>Photos *</Label>
              <PhotoSelector
                maxFiles={UPLOAD_CONFIG.maxFiles}
                onPhotosChange={(files) => {
                  setSelectedPhotos(files);
                  setPhotosError(undefined);
                }}
                required={true}
                error={photosError}
              />
            </div>
          )}

          {/* ============================================
              CHAMP: État (Condition)
              ============================================ */}
          <div>
            <Label htmlFor="condition">État *</Label>
            {/**
             * Select pour l'état de l'item
             *
             * {...register('condition')}:
             * - Enregistre le champ dans React Hook Form
             * - Active la validation Zod
             *
             * OPTIONS:
             * - Option vide par défaut (placeholder)
             * - Options générées depuis ITEM_CONDITIONS
             * - Labels en français via ITEM_CONDITION_LABELS
             */}
            <select
              id="condition"
              {...register('condition')}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sélectionner un état</option>
              {/**
               * Générer les options depuis ITEM_CONDITIONS
               *
               * ITEM_CONDITIONS: ['NEW', 'GOOD', 'FAIR', 'TO_REPAIR']
               * ITEM_CONDITION_LABELS: { NEW: 'Neuf', GOOD: 'Bon état', ... }
               *
               * key={condition}: clé unique pour React
               * value={condition}: valeur envoyée au formulaire (ex: 'NEW')
               * {ITEM_CONDITION_LABELS[condition]}: label affiché (ex: 'Neuf')
               */}
              {ITEM_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {ITEM_CONDITION_LABELS[condition]}
                </option>
              ))}
            </select>
            {/**
             * Affichage de l'erreur de validation
             */}
            {errors.condition && (
              <p className="mt-1 text-sm text-destructive">
                {errors.condition.message}
              </p>
            )}
          </div>

          {/* ============================================
              CHAMP: Catégorie
              ============================================ */}
          <div>
            {/**
             * Label dynamique selon l'état de l'aide IA
             *
             * LOGIQUE:
             * - Si aiAuto === true: "(optionnel - peut être fournie par l'IA)"
             * - Si aiAuto === false: "*" (requis)
             *
             * POURQUOI:
             * Si l'aide IA est activée, la catégorie peut être suggérée
             * automatiquement par l'IA, donc elle devient optionnelle.
             */}
            <Label htmlFor="category">
              Catégorie{' '}
              {aiAuto ? "(optionnel - peut être fournie par l'IA)" : '*'}
            </Label>
            {/**
             * Select pour la catégorie
             *
             * {...register('category')}:
             * - Enregistre le champ dans React Hook Form
             * - Active la validation Zod (optionnel dans le schéma)
             *
             * OPTIONS:
             * - Option vide par défaut (placeholder)
             * - Options générées depuis ITEM_CATEGORIES
             * - Labels en français via ITEM_CATEGORY_LABELS
             */}
            <select
              id="category"
              {...register('category')}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sélectionner une catégorie</option>
              {/**
               * Générer les options depuis ITEM_CATEGORIES
               *
               * ITEM_CATEGORIES: ['CLOTHING', 'ELECTRONICS', 'BOOKS', ...]
               * ITEM_CATEGORY_LABELS: { CLOTHING: 'Vêtements', ... }
               */}
              {ITEM_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {ITEM_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
            {/**
             * Affichage de l'erreur de validation
             */}
            {errors.category && (
              <p className="mt-1 text-sm text-destructive">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* ============================================
              CHAMP: Tags
              ============================================ */}
          <div>
            <Label>Tags (optionnel)</Label>
            {/**
             * Conteneur pour l'input et le bouton d'ajout
             * flex gap-2: affichage horizontal avec espacement
             */}
            <div className="mt-1 flex gap-2">
              {/**
               * Input pour ajouter un nouveau tag
               *
               * value={newTag}: valeur contrôlée par l'état local
               * onChange: met à jour newTag à chaque frappe
               * onKeyPress: ajoute le tag si Enter est pressé
               *
               * GESTION DE LA TOUCHE ENTER:
               * - e.preventDefault(): empêche le submit du formulaire
               * - addTag(): ajoute le tag à la liste
               */}
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Ajouter un tag"
                onKeyPress={(e) => {
                  /**
                   * Si la touche Enter est pressée, ajouter le tag
                   * e.preventDefault() empêche le submit du formulaire
                   */
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1"
              />
              {/**
               * Bouton pour ajouter un tag
               *
               * type="button": empêche le submit du formulaire
               * disabled: désactivé si:
               *   - newTag est vide (après trim)
               *   - tags.length >= 10 (limite atteinte)
               */}
              <Button
                type="button"
                onClick={addTag}
                disabled={!newTag.trim() || tags.length >= 10}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            {/**
             * Affichage des tags existants
             *
             * CONDITION:
             * - Affiche seulement si tags.length > 0
             *
             * STRUCTURE:
             * - Badge pour chaque tag avec bouton X pour supprimer
             * - flex-wrap: permet le retour à la ligne si nécessaire
             */}
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {/**
                 * Générer un badge pour chaque tag
                 *
                 * key={tag}: clé unique pour React (le tag lui-même est unique)
                 * variant="secondary": style secondaire pour les badges
                 */}
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {/**
                     * Texte du tag
                     */}
                    {tag}
                    {/**
                     * Bouton pour supprimer le tag
                     *
                     * type="button": empêche le submit du formulaire
                     * onClick: appelle removeTag() avec le tag à supprimer
                     * hover:text-destructive: change la couleur au survol
                     */}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {/**
             * Message d'information si la limite est atteinte
             *
             * AFFICHAGE:
             * - Seulement si tags.length >= 10
             * - Message informatif (pas d'erreur)
             */}
            {tags.length >= 10 && (
              <p className="mt-1 text-sm text-muted-foreground">
                Maximum 10 tags atteint
              </p>
            )}
          </div>

          {/* ============================================
              OPTION: Aide IA (Gemini)
              ============================================ */}
          <div className="flex items-center space-x-2">
            {/**
             * Switch pour activer/désactiver l'aide IA
             *
             * checked={aiAuto}: état contrôlé par watch('aiAuto')
             * onCheckedChange: met à jour la valeur dans React Hook Form
             *
             * FONCTIONNEMENT:
             * - Si activé, l'IA peut suggérer catégorie et tags
             * - La catégorie devient optionnelle si activée
             */}
            <Switch
              id="aiAuto"
              checked={aiAuto}
              onCheckedChange={(checked) => setValue('aiAuto', checked)}
            />
            <Label htmlFor="aiAuto" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Aider avec Gemini (IA)
            </Label>
          </div>
          {/**
           * Message d'information si l'aide IA est activée
           *
           * AFFICHAGE:
           * - Seulement si aiAuto === true
           * - Message informatif sur les capacités de l'IA
           *
           * STYLE:
           * - bg-primary/10: fond avec opacité 10% de la couleur primaire
           * - text-primary: texte en couleur primaire
           */}
          {aiAuto && (
            <div className="rounded-md bg-primary/10 p-3 text-sm">
              <p className="text-primary">
                💡 L'IA peut automatiquement suggérer la catégorie, générer des
                tags et créer un résumé de votre objet.
              </p>
            </div>
          )}

          {/* ============================================
              BOUTON DE SOUMISSION
              ============================================ */}
          <div className="flex gap-2">
            {/**
             * Bouton de soumission du formulaire
             *
             * type="submit": déclenche la soumission du formulaire
             * disabled={isLoading}: désactivé pendant la soumission
             *
             * TEXTE DYNAMIQUE:
             * - isLoading: "Sauvegarde..." (pendant la soumission)
             * - mode === 'create': "Créer l'objet" (création)
             * - mode === 'edit': "Sauvegarder" (édition)
             */}
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading
                ? 'Sauvegarde...'
                : mode === 'create'
                  ? "Créer l'objet"
                  : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
