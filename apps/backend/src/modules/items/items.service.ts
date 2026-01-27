/**
 * FICHIER: modules/items/items.service.ts
 *
 * OBJECTIF:
 * Service NestJS responsable de **toute** la logique métier autour des objets échangés
 * par les utilisateurs (création, lecture, mise à jour, suppression, statut, recherche).
 * Il agit comme couche intermédiaire entre:
 * - les contrôleurs REST (`ItemsController`)
 * - la base de données (via `PrismaService`)
 * - l'IA Gemini (`GeminiService`) pour l'analyse automatisée
 *
 * PRINCIPAUX CAS D'USAGE COUVERTS:
 * 1. Création d'un item avec option d'analyse IA (catégories, tags, résumés, tips)
 * 2. Listing paginé avec filtres (catégorie, état, statut, texte libre, propriétaire)
 * 3. Lecture détaillée d'un item avec propriétaire + photos
 * 4. Mise à jour d'un item / de son statut (contrôle strict du propriétaire)
 * 5. Suppression d'un item (cascade sur les photos via Prisma)
 * 6. Recherche par tags (utilisé pour les recommandations rapides)
 *
 * GARANTIES MÉTIER & SÉCURITÉ:
 * - Toutes les opérations d'écriture vérifient que l'utilisateur est propriétaire
 * - Les catégories et états sont validés côté serveur (anti données invalides)
 * - Les erreurs Prisma critiques (ex: P1010) sont remontées proprement
 * - Les champs IA sont générés de manière optionnelle pour réduire les frictions UX
 *
 * NOTE:
 * Ce fichier suit une structure pédagogique similaire au composant `MessageBubble.tsx`,
 * détaillant chaque section avec des commentaires multi-niveaux pour faciliter la prise en main
 * par un étudiant ou un nouveau contributeur backend.
 */

// Import des exceptions NestJS
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

// Import des services
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';

// Import des DTOs
import { CreateItemDto } from './dtos/create-item.dto';
import { UpdateItemDto } from './dtos/update-item.dto';
import { ListItemsQueryDto } from './dtos/list-items.query.dto';

// Import des types Prisma
import {
  Item,
  ItemCategory,
  ItemCondition,
  ItemStatus,
  Prisma,
} from '@prisma/client';

/**
 * INTERFACE: ItemWithPhotos
 *
 * Étend l'interface Item de Prisma pour inclure les photos et le propriétaire.
 * Utilisée pour typer les réponses des méthodes du service.
 */
export interface ItemWithPhotos extends Item {
  photos: Array<{
    id: string;
    url: string;
    width?: number;
    height?: number;
    createdAt: Date;
  }>;
  owner: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  // Distance calculée (si lat/lng fournis dans la requête) - pas dans Prisma
  distanceKm?: number | null;
}

/**
 * INTERFACE: PaginatedItems
 *
 * Structure de réponse pour les listes paginées d'items.
 */
export interface PaginatedItems {
  items: ItemWithPhotos[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * SERVICE: ItemsService
 *
 * Service principal pour la gestion des items.
 */
@Injectable()
export class ItemsService {
  /**
   * CONSTRUCTEUR
   *
   * Injection des dépendances:
   * - prisma: pour accéder à la base de données
   * - geminiService: pour l'analyse IA des items
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
  ) {}

  // ============================================
  // MÉTHODE: createItem (Créer un item)
  // ============================================

  /**
   * Crée un nouvel item dans la base de données.
   *
   * FONCTIONNALITÉS:
   * - Analyse IA optionnelle pour catégoriser automatiquement l'item
   * - Validation de la catégorie
   * - Association automatique avec le propriétaire (userId)
   *
   * @param userId - ID de l'utilisateur créateur (propriétaire)
   * @param createItemDto - Données de l'item à créer
   * @returns Item créé avec ses photos et le propriétaire
   * @throws BadRequestException si la catégorie est invalide ou manquante
   */
  async createItem(
    userId: string,
    createItemDto: CreateItemDto,
  ): Promise<ItemWithPhotos> {
    /**
     * On sépare explicitement la bascule `aiAuto` du reste des données,
     * car elle n'est pas un champ stocké en base : elle ne sert qu'à savoir
     * si l'on doit déclencher l'analyse IA côté serveur.
     */
    const { aiAuto, ...itemData } = createItemDto;

    // ============================================
    // ANALYSE IA OPTIONNELLE
    // ============================================
    /**
     * Si aiAuto est activé, l'IA analyse le titre et la description
     * pour suggérer automatiquement:
     * - La catégorie
     * - Les tags
     * - Un résumé
     * - Des conseils de réparation
     */
    let aiAnalysis = null;
    if (aiAuto) {
      console.log('🔍 Début analyse IA pour:', itemData.title);
      aiAnalysis = await this.geminiService.analyzeItem({
        title: itemData.title,
        description: itemData.description,
      });
      console.log('🤖 Résultat analyse IA:', aiAnalysis);
    }

    // ============================================
    // PRÉPARATION DES DONNÉES FINALES
    // ============================================
    /**
     * Combiner les données fournies avec l'analyse IA.
     * L'analyse IA a la priorité, sinon on utilise les données fournies.
     */
    const finalItemData = {
      ...itemData,
      ownerId: userId, // Associer l'item au propriétaire
      category: aiAnalysis?.category || itemData.category || 'OTHER', // Catégorie IA > manuelle > OTHER
      tags: aiAnalysis?.tags || itemData.tags || [], // Tags IA > manuels > []
      aiSummary: itemData.aiSummary || aiAnalysis?.aiSummary, // Résumé DTO (pré-généré) > IA > undefined
      aiRepairTip: aiAnalysis?.aiRepairTip, // Conseils de réparation de l'IA
    };

    // ============================================
    // VALIDATION DE LA CATÉGORIE
    // ============================================
    // Vérifier que la catégorie est définie
    if (!finalItemData.category) {
      throw new BadRequestException(
        'Catégorie requise (spécifiez category ou utilisez aiAuto=true)',
      );
    }

    // Vérifier que la catégorie est valide
    const validCategories = [
      'ELECTRONICS',
      'CLOTHING',
      'BOOKS',
      'FURNITURE',
      'SPORTS',
      'TOYS',
      'OTHER',
    ];
    if (!validCategories.includes(finalItemData.category)) {
      throw new BadRequestException(
        `Catégorie invalide. Catégories valides: ${validCategories.join(', ')}`,
      );
    }

    // ============================================
    // CRÉATION DE L'ITEM DANS LA BASE DE DONNÉES
    // ============================================
    /**
     * Créer l'item avec toutes les relations nécessaires:
     * - photos: liste des photos (vide au début)
     * - owner: informations du propriétaire
     */
    const item = await this.prisma.item.create({
      data: finalItemData,
      include: {
        photos: {
          select: {
            id: true,
            url: true,
            width: true,
            height: true,
            createdAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return item;
  }

  // ============================================
  // MÉTHODE: listItems (Lister les items)
  // ============================================

  /**
   * Liste les items avec filtres et pagination.
   *
   * FILTRES DISPONIBLES:
   * - q: Recherche textuelle (titre, description, tags)
   * - category: Filtrer par catégorie
   * - condition: Filtrer par état (NEW, GOOD, FAIR, TO_REPAIR)
   * - status: Filtrer par statut (AVAILABLE, PENDING, TRADED, ARCHIVED)
   * - ownerId: Filtrer par propriétaire
   * - sort: Tri (ex: -createdAt pour plus récent en premier, distance pour proximité)
   * - lat/lng: Position de l'utilisateur pour calcul de distance
   * - radiusKm: Rayon de recherche en km
   * - city/department/region: Filtrer par localisation textuelle
   *
   * @param query - Paramètres de filtrage et pagination
   * @returns Liste paginée d'items
   */
  async listItems(query: ListItemsQueryDto): Promise<PaginatedItems> {
    const {
      page = 1,
      limit = 20,
      q,
      category,
      condition,
      status,
      ownerId,
      sort = '-createdAt',
      lat,
      lng,
      radiusKm = 25,
      city,
      department,
      region,
    } = query;

    // Convertir en numbers pour éviter les erreurs Prisma
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const skip = (pageNum - 1) * limitNum;

    // Si lat/lng fournis, utiliser PostGIS pour le calcul de distance
    const hasGeoQuery = lat !== undefined && lng !== undefined;

    if (hasGeoQuery) {
      return this.listItemsWithDistance(query, pageNum, limitNum, skip);
    }

    // Sinon, utiliser la requête Prisma classique
    // Construire les filtres
    const where: Prisma.ItemWhereInput = {
      status: status || ItemStatus.AVAILABLE,
    };

    if (category) {
      where.category = category;
    }

    if (condition) {
      where.condition = condition;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Filtres de localisation textuelle
    if (city) {
      where.city = { equals: city, mode: 'insensitive' };
    }
    if (department) {
      where.department = department;
    }
    if (region) {
      where.region = { equals: region, mode: 'insensitive' };
    }

    // Recherche full-text
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    // Construire l'ordre de tri
    const orderBy: Prisma.ItemOrderByWithRelationInput = {};
    if (sort.startsWith('-')) {
      orderBy[sort.substring(1)] = 'desc';
    } else {
      orderBy[sort] = 'asc';
    }

    // Requêtes parallèles avec gestion d'erreur
    try {
      const [items, total] = await Promise.all([
        this.prisma.item.findMany({
          where,
          orderBy,
          skip,
          take: limitNum,
          include: {
            photos: {
              select: {
                id: true,
                url: true,
                width: true,
                height: true,
                createdAt: true,
              },
            },
            owner: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        }),
        this.prisma.item.count({ where }),
      ]);

      return {
        items,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      };
    } catch (error: any) {
      if (error.code === 'P1010' || error.message?.includes('denied access')) {
        console.error('Erreur Prisma P1010:', error.message);
        return {
          items: [],
          total: 0,
          page: pageNum,
          limit: limitNum,
          totalPages: 0,
        };
      }
      throw error;
    }
  }

  // ============================================
  // MÉTHODE: listItemsWithDistance (Requête PostGIS)
  // ============================================

  /**
   * Liste les items avec calcul de distance via PostGIS.
   * Utilisée quand lat/lng sont fournis dans la requête.
   *
   * FONCTIONNEMENT:
   * - Utilise ST_Distance pour calculer la distance en mètres
   * - Utilise ST_DWithin pour filtrer par rayon
   * - Trie par distance si sort=distance
   *
   * @param query - Paramètres de filtrage
   * @param pageNum - Numéro de page
   * @param limitNum - Nombre d'éléments par page
   * @param skip - Nombre d'éléments à sauter
   * @returns Liste paginée d'items avec distance
   */
  private async listItemsWithDistance(
    query: ListItemsQueryDto,
    pageNum: number,
    limitNum: number,
    skip: number,
  ): Promise<PaginatedItems> {
    const {
      q,
      category,
      condition,
      status,
      ownerId,
      sort = '-createdAt',
      lat,
      lng,
      radiusKm = 25,
      city,
      department,
      region,
    } = query;

    // Construire les conditions WHERE
    const whereConditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Statut (par défaut: AVAILABLE)
    // IMPORTANT: i."status" est un enum PostgreSQL ("ItemStatus")
    // On caste explicitement le paramètre en "ItemStatus" pour éviter l'erreur
    // Postgres: operator does not exist: "ItemStatus" = text
    whereConditions.push(`i."status" = $${paramIndex}::"ItemStatus"`);
    params.push(status || ItemStatus.AVAILABLE);
    paramIndex++;

    // Catégorie
    if (category) {
      whereConditions.push(`i."category" = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    // Condition
    if (condition) {
      whereConditions.push(`i."condition" = $${paramIndex}`);
      params.push(condition);
      paramIndex++;
    }

    // Propriétaire
    if (ownerId) {
      whereConditions.push(`i."ownerId" = $${paramIndex}`);
      params.push(ownerId);
      paramIndex++;
    }

    // Filtres de localisation textuelle
    if (city) {
      whereConditions.push(`LOWER(i."city") = LOWER($${paramIndex})`);
      params.push(city);
      paramIndex++;
    }
    if (department) {
      whereConditions.push(`i."department" = $${paramIndex}`);
      params.push(department);
      paramIndex++;
    }
    if (region) {
      whereConditions.push(`LOWER(i."region") = LOWER($${paramIndex})`);
      params.push(region);
      paramIndex++;
    }

    // Recherche textuelle
    if (q) {
      whereConditions.push(`(
        i."title" ILIKE $${paramIndex} OR
        i."description" ILIKE $${paramIndex} OR
        $${paramIndex + 1} = ANY(i."tags")
      )`);
      params.push(`%${q}%`);
      params.push(q);
      paramIndex += 2;
    }

    // Filtre par rayon (seulement les items avec location)
    const radiusMeters = radiusKm * 1000;
    const userPointParam = paramIndex;
    params.push(lng); // longitude d'abord (format PostGIS)
    paramIndex++;
    params.push(lat);
    paramIndex++;
    params.push(radiusMeters);
    paramIndex++;

    whereConditions.push(`(
      i."location" IS NULL OR
      ST_DWithin(
        i."location",
        ST_SetSRID(ST_MakePoint($${userPointParam}, $${userPointParam + 1}), 4326)::geography,
        $${userPointParam + 2}
      )
    )`);

    const whereClause = whereConditions.join(' AND ');

    // Construire l'ORDER BY
    let orderByClause = '';
    if (sort === 'distance') {
      orderByClause = 'ORDER BY distance_km ASC NULLS LAST';
    } else if (sort === '-distance') {
      orderByClause = 'ORDER BY distance_km DESC NULLS LAST';
    } else if (sort.startsWith('-')) {
      orderByClause = `ORDER BY i."${sort.substring(1)}" DESC`;
    } else {
      orderByClause = `ORDER BY i."${sort}" ASC`;
    }

    try {
      // Requête principale avec calcul de distance
      const itemsQuery = `
        SELECT
          i.*,
          CASE
            WHEN i."location" IS NOT NULL THEN
              ROUND(
                (ST_Distance(
                  i."location",
                  ST_SetSRID(ST_MakePoint($${userPointParam}, $${userPointParam + 1}), 4326)::geography
                ) / 1000)::numeric,
                1
              )
            ELSE NULL
          END as distance_km
        FROM "items" i
        WHERE ${whereClause}
        ${orderByClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limitNum);
      params.push(skip);

      // Requête de comptage
      const countQuery = `
        SELECT COUNT(*) as total
        FROM "items" i
        WHERE ${whereClause}
      `;

      // Exécuter les requêtes
      const [itemsRaw, countResult] = await Promise.all([
        this.prisma.$queryRawUnsafe<any[]>(itemsQuery, ...params),
        this.prisma.$queryRawUnsafe<{ total: bigint }[]>(
          countQuery,
          ...params.slice(0, -2), // Exclure LIMIT et OFFSET
        ),
      ]);

      const total = Number(countResult[0]?.total || 0);

      // Récupérer les photos et owners pour chaque item
      const itemIds = itemsRaw.map((item) => item.id);

      if (itemIds.length === 0) {
        return {
          items: [],
          total: 0,
          page: pageNum,
          limit: limitNum,
          totalPages: 0,
        };
      }

      // Récupérer les photos
      const photos = await this.prisma.itemPhoto.findMany({
        where: { itemId: { in: itemIds } },
        select: {
          id: true,
          itemId: true,
          url: true,
          width: true,
          height: true,
          createdAt: true,
        },
      });

      // Récupérer les owners
      const ownerIds = [...new Set(itemsRaw.map((item) => item.ownerId))];
      const owners = await this.prisma.user.findMany({
        where: { id: { in: ownerIds } },
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      });

      // Mapper les photos et owners aux items
      const photosByItem = photos.reduce(
        (acc, photo) => {
          if (!acc[photo.itemId]) acc[photo.itemId] = [];
          acc[photo.itemId].push({
            id: photo.id,
            url: photo.url,
            width: photo.width,
            height: photo.height,
            createdAt: photo.createdAt,
          });
          return acc;
        },
        {} as Record<string, any[]>,
      );

      const ownersById = owners.reduce(
        (acc, owner) => {
          acc[owner.id] = owner;
          return acc;
        },
        {} as Record<string, any>,
      );

      // Assembler les items complets
      const items: ItemWithPhotos[] = itemsRaw.map((item) => ({
        ...item,
        distanceKm: item.distance_km ? parseFloat(item.distance_km) : null,
        photos: photosByItem[item.id] || [],
        owner: ownersById[item.ownerId] || {
          id: item.ownerId,
          displayName: 'Utilisateur inconnu',
          avatarUrl: null,
        },
      }));

      return {
        items,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      };
    } catch (error: any) {
      console.error('Erreur PostGIS:', error.message);
      // Fallback sur la requête standard sans distance
      return this.listItems({
        ...query,
        lat: undefined,
        lng: undefined,
      });
    }
  }

  // ============================================
  // MÉTHODE: getItemById (Récupérer un item)
  // ============================================

  /**
   * Récupère un item par son ID avec toutes ses relations.
   * Si lat/lng sont fournis, calcule également la distance.
   *
   * @param id - ID de l'item
   * @param lat - Latitude de l'utilisateur (optionnel)
   * @param lng - Longitude de l'utilisateur (optionnel)
   * @returns Item avec photos, propriétaire et distance optionnelle
   * @throws NotFoundException si l'item n'existe pas
   */
  async getItemById(
    id: string,
    lat?: number,
    lng?: number,
  ): Promise<ItemWithPhotos> {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        photos: {
          select: {
            id: true,
            url: true,
            width: true,
            height: true,
            createdAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item non trouvé');
    }

    // Si lat/lng fournis et item a une location, calculer la distance
    if (lat !== undefined && lng !== undefined && item.latitude && item.longitude) {
      try {
        const distanceResult = await this.prisma.$queryRaw<{ distance_km: number }[]>`
          SELECT ROUND(
            (ST_Distance(
              ST_SetSRID(ST_MakePoint(${item.longitude}, ${item.latitude}), 4326)::geography,
              ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
            ) / 1000)::numeric,
            1
          ) as distance_km
        `;

        return {
          ...item,
          distanceKm: distanceResult[0]?.distance_km || null,
        };
      } catch (error) {
        // Si PostGIS n'est pas disponible, retourner sans distance
        console.warn('PostGIS distance calculation failed:', error.message);
        return item;
      }
    }

    return item;
  }

  // ============================================
  // MÉTHODE: updateItem (Mettre à jour un item)
  // ============================================

  /**
   * Met à jour un item existant.
   *
   * SÉCURITÉ:
   * - Vérifie que l'item existe
   * - Vérifie que l'utilisateur est le propriétaire
   *
   * FONCTIONNALITÉS:
   * - Analyse IA optionnelle si aiAuto est activé et que les données ont changé
   * - Mise à jour partielle (seuls les champs fournis sont mis à jour)
   *
   * @param id - ID de l'item à mettre à jour
   * @param userId - ID de l'utilisateur (doit être le propriétaire)
   * @param updateItemDto - Données à mettre à jour
   * @returns Item mis à jour
   * @throws NotFoundException si l'item n'existe pas
   * @throws ForbiddenException si l'utilisateur n'est pas le propriétaire
   */
  async updateItem(
    id: string,
    userId: string,
    updateItemDto: UpdateItemDto,
  ): Promise<ItemWithPhotos> {
    // ============================================
    // VÉRIFICATION DES PERMISSIONS
    // ============================================
    // Vérifier que l'item existe
    const existingItem = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!existingItem) {
      throw new NotFoundException('Item non trouvé');
    }

    if (existingItem.ownerId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres items',
      );
    }

    // Analyse IA si demandée et si les données ont changé
    let aiAnalysis = null;
    if (
      updateItemDto.aiAuto &&
      (updateItemDto.title || updateItemDto.description)
    ) {
      aiAnalysis = await this.geminiService.analyzeItem({
        title: updateItemDto.title || existingItem.title,
        description: updateItemDto.description || existingItem.description,
      });
    }

    // Préparer les données de mise à jour
    const { aiAuto, ...updateData } = updateItemDto;

    if (aiAnalysis) {
      updateData.category = aiAnalysis.category;
      updateData.tags = aiAnalysis.tags;
      (updateData as any).aiSummary = aiAnalysis.aiSummary;
      (updateData as any).aiRepairTip = aiAnalysis.aiRepairTip;
    }

    const updatedItem = await this.prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        photos: {
          select: {
            id: true,
            url: true,
            width: true,
            height: true,
            createdAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedItem;
  }

  // ============================================
  // MÉTHODE: deleteItem (Supprimer un item)
  // ============================================

  /**
   * Supprime un item de la base de données.
   *
   * SÉCURITÉ:
   * - Vérifie que l'item existe
   * - Vérifie que l'utilisateur est le propriétaire
   *
   * NOTE:
   * - Les photos sont supprimées automatiquement en cascade (configuration Prisma)
   * - Les échanges liés peuvent être affectés selon la configuration
   *
   * @param id - ID de l'item à supprimer
   * @param userId - ID de l'utilisateur (doit être le propriétaire)
   * @throws NotFoundException si l'item n'existe pas
   * @throws ForbiddenException si l'utilisateur n'est pas le propriétaire
   */
  async deleteItem(id: string, userId: string): Promise<void> {
    // Vérifier que l'item existe et que l'utilisateur est le propriétaire
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Item non trouvé');
    }

    if (item.ownerId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres items',
      );
    }

    // Supprimer l'item (les photos seront supprimées en cascade)
    await this.prisma.item.delete({
      where: { id },
    });
  }

  // ============================================
  // MÉTHODE: getUserItems (Items d'un utilisateur)
  // ============================================

  /**
   * Récupère les items d'un utilisateur spécifique.
   *
   * @param userId - ID de l'utilisateur
   * @param query - Paramètres de filtrage et pagination (sans ownerId)
   * @returns Liste paginée des items de l'utilisateur
   */
  async getUserItems(
    userId: string,
    query: Omit<ListItemsQueryDto, 'ownerId'>,
  ): Promise<PaginatedItems> {
    // Utiliser listItems avec ownerId fixé à userId
    // (DRY: on réutilise l'implémentation existante plutôt qu'écrire une requête dédiée)
    return this.listItems({ ...query, ownerId: userId });
  }

  // ============================================
  // MÉTHODE: updateItemStatus (Mettre à jour le statut)
  // ============================================

  /**
   * Met à jour uniquement le statut d'un item.
   *
   * STATUTS POSSIBLES:
   * - AVAILABLE: Disponible pour échange
   * - PENDING: En attente d'échange
   * - TRADED: Échangé
   * - ARCHIVED: Archivé
   *
   * @param id - ID de l'item
   * @param userId - ID de l'utilisateur (doit être le propriétaire)
   * @param status - Nouveau statut
   * @returns Item mis à jour
   * @throws NotFoundException si l'item n'existe pas
   * @throws ForbiddenException si l'utilisateur n'est pas le propriétaire
   */
  async updateItemStatus(
    id: string,
    userId: string,
    status: ItemStatus,
  ): Promise<ItemWithPhotos> {
    // Vérifier que l'item existe et que l'utilisateur est le propriétaire
    const existingItem = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!existingItem) {
      throw new NotFoundException('Item non trouvé');
    }

    if (existingItem.ownerId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres items',
      );
    }

    const updatedItem = await this.prisma.item.update({
      where: { id },
      data: { status },
      include: {
        photos: {
          select: {
            id: true,
            url: true,
            width: true,
            height: true,
            createdAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedItem;
  }

  // ============================================
  // MÉTHODE: searchByTags (Recherche par tags)
  // ============================================

  /**
   * Recherche des items disponibles qui contiennent au moins un des tags fournis.
   *
   * @param tags - Liste de tags à rechercher
   * @param limit - Nombre maximum d'items à retourner (défaut: 20)
   * @returns Liste d'items correspondants, triés par date de création (plus récent en premier)
   */
  async searchByTags(
    tags: string[],
    limit: number = 20,
  ): Promise<ItemWithPhotos[]> {
    return this.prisma.item.findMany({
      where: {
        status: ItemStatus.AVAILABLE,
        tags: {
          hasSome: tags,
        },
      },
      take: limit,
      include: {
        photos: {
          select: {
            id: true,
            url: true,
            width: true,
            height: true,
            createdAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
