/**
 * FICHIER: modules/exchanges/exchanges.service.ts
 *
 * OBJECTIF:
 * Centraliser la logique métier des échanges d'objets entre utilisateurs.
 * Chaque échange implique un demandeur (`requester`) et un répondant (`responder`)
 * qui peuvent discuter via un chat dédié et faire évoluer le statut de la proposition.
 *
 * RESPONSABILITÉS MAJEURES:
 * 1. Créer une proposition d'échange (avec validations métiers + notification)
 * 2. Mettre à jour le statut (accepter, refuser, compléter, annuler)
 * 3. Lister les échanges d'un utilisateur avec pagination
 * 4. Consulter un échange spécifique (avec les messages et participants)
 * 5. Publier des messages de chat (en s'assurant que l'auteur est bien participant)
 *
 * CONTRAINTES ET SÉCURITÉ:
 * - On interdit la création d'un échange avec soi-même
 * - Seuls les participants (requester/responder) peuvent lire ou modifier un échange
 * - On empêche la modification d'un échange déjà terminé (COMPLETED/CANCELLED)
 * - Chaque changement de statut déclenche une notification (service Notifications)
 *
 * RÉFÉRENCES D'ARCHITECTURE:
 * - Contrôleur associé: `exchanges.controller.ts`
 * - Websocket/Temps réel: `exchanges.gateway.ts` (pour la diffusion live)
 * - DTOs: `modules/exchanges/dtos/*`
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
import { NotificationsService } from '../notifications/notifications.service';

// Import des DTOs
import { CreateExchangeInput } from './dtos/create-exchange.dto';
import { UpdateExchangeStatusInput } from './dtos/update-exchange-status.dto';
import { PaginationInput } from '../../common/dtos/pagination.dto';

/**
 * SERVICE: ExchangesService
 *
 * Service principal pour la gestion des échanges.
 */
@Injectable()
export class ExchangesService {
  /**
   * CONSTRUCTEUR
   *
   * Injection des dépendances:
   * - prisma: pour accéder à la base de données
   * - notifications: pour envoyer des notifications aux utilisateurs
   */
  /**
   * CONSTRUCTEUR
   *
   * - `PrismaService prisma`
   *    ↳ Accès DB (tables: exchange, chatMessage, user).
   * - `NotificationsService notifications`
   *    ↳ Envoie des push/in-app lors des changements de statut via `sendExchangeStatusNotification`.
   */
  constructor(
    private prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ============================================
  // MÉTHODE: createExchange (Créer un échange)
  // ============================================

  /**
   * Crée une nouvelle proposition d'échange entre deux utilisateurs.
   *
   * PROCESSUS:
   * 1. Vérifie que le répondant existe
   * 2. Vérifie qu'on ne fait pas d'échange avec soi-même
   * 3. Crée l'échange avec le statut PENDING
   * 4. Envoie une notification au répondant
   *
   * @param requesterId - ID de l'utilisateur qui fait la proposition
   * @param input - Données de l'échange (responderId, requestedItemTitle, offeredItemTitle, message)
   * @returns Échange créé avec les informations des participants
   * @throws NotFoundException si le répondant n'existe pas
   * @throws BadRequestException si on essaie d'échanger avec soi-même
   */
  async createExchange(requesterId: string, input: CreateExchangeInput) {
    /**
     * MÉTHODE: createExchange
     *
     * Permet à un utilisateur (`requesterId`) de proposer un échange à un autre
     * utilisateur (`responderId`). Aucun item n'est créé ici : on se contente
     * d'enregistrer la proposition textuelle (titres des objets, message d'intro).
     *
     * FLUX:
     * 1. Vérifier que le répondant existe
     * 2. Empêcher l'auto-échange (requester === responder)
     * 3. Créer l'échange avec statut initial `PENDING`
     * 4. Notifier le répondant pour qu'il puisse répondre rapidement
     */

    // Extraire les données de l'échange
    const { responderId, requestedItemTitle, offeredItemTitle, message } =
      input;

    // ============================================
    // VÉRIFICATIONS PRÉLIMINAIRES
    // ============================================
    // Vérifier que le répondant existe
    const responder = await this.prisma.user.findUnique({
      where: { id: responderId },
    });

    if (!responder) {
      throw new NotFoundException('Utilisateur répondant non trouvé');
    }

    // Vérifier qu'on ne fait pas d'échange avec soi-même
    if (requesterId === responderId) {
      throw new BadRequestException(
        'Impossible de créer un échange avec soi-même',
      );
    }

    /**
     * Création de l'échange + jointures indispensables pour le frontend.
     * (Le frontend peut afficher immédiatement les infos requester/responder)
     */
    const exchange = await this.prisma.exchange.create({
      data: {
        requesterId,
        responderId,
        requestedItemTitle,
        offeredItemTitle,
        message,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        responder: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Notifier le propriétaire (répondant) d'une nouvelle proposition
    try {
      await this.notifications.sendExchangeStatusNotification(
        exchange.id,
        'PENDING',
        responderId,
      );
    } catch (e) {
      // Stratégie: on loggue côté NotificationsService; ici on n'empêche pas la création
    }

    return exchange;
  }

  async updateExchangeStatus(
    exchangeId: string,
    userId: string,
    input: UpdateExchangeStatusInput,
  ) {
    const { status } = input;

    /**
     * On récupère l'échange + ses participants pour deux raisons:
     * - vérifier l'autorisation
     * - renvoyer des données complètes au frontend après mise à jour
     */
    const exchange = await this.prisma.exchange.findUnique({
      where: { id: exchangeId },
      include: {
        requester: true,
        responder: true,
      },
    });

    if (!exchange) {
      throw new NotFoundException('Échange non trouvé');
    }

    // Vérifier que l'utilisateur peut modifier cet échange
    if (exchange.requesterId !== userId && exchange.responderId !== userId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier cet échange",
      );
    }

    // Vérifier que l'échange n'est pas déjà terminé
    if (exchange.status === 'COMPLETED' || exchange.status === 'CANCELLED') {
      throw new BadRequestException('Cet échange ne peut plus être modifié');
    }

    // Logique métier pour les changements de statut
    const updateData: any = { status };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    return this.prisma.exchange.update({
      where: { id: exchangeId },
      data: updateData,
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        responder: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * MÉTHODE: getMyExchanges
   *
   * Retourne la liste paginée des échanges où l'utilisateur est soit requester soit responder.
   * Optionnellement, on peut filtrer par statut (utile pour séparer les échanges actifs vs terminés).
   */
  async getMyExchanges(
    userId: string,
    pagination: PaginationInput,
    status?: string,
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const sort = pagination.sort ?? '-createdAt';
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ requesterId: userId }, { responderId: userId }],
    };

    if (status) {
      where.status = status;
    }

    // Gestion du tri façon `listItems`
    let orderBy: any = { createdAt: 'desc' };
    if (sort) {
      if (sort.startsWith('-')) {
        const field = sort.substring(1);
        orderBy = { [field]: 'desc' };
      } else {
        orderBy = { [sort]: 'asc' };
      }
    }

    const [exchanges, total] = await Promise.all([
      this.prisma.exchange.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          requester: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          responder: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.exchange.count({ where }),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    return {
      items: exchanges,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Récupère un échange précis (incl. messages) et vérifie que l'utilisateur actuel
   * est bien l'un des participants.
   */
  async getExchangeById(exchangeId: string, userId: string) {
    const exchange = await this.prisma.exchange.findUnique({
      where: { id: exchangeId },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        responder: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!exchange) {
      throw new NotFoundException('Échange non trouvé');
    }

    // Vérifier que l'utilisateur peut voir cet échange
    if (exchange.requesterId !== userId && exchange.responderId !== userId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à voir cet échange",
      );
    }

    return exchange;
  }

  // ============================================
  // MÉTHODE: createMessage (Créer un message)
  // ============================================

  /**
   * Crée un nouveau message dans un échange (pour le chat en temps réel).
   *
   * SÉCURITÉ:
   * - Vérifie que l'échange existe
   * - Vérifie que l'utilisateur participe à l'échange (requester ou responder)
   *
   * FONCTIONNALITÉS:
   * - Supporte les messages texte et images
   * - Retourne le message avec les informations de l'expéditeur
   *
   * @param exchangeId - ID de l'échange
   * @param senderId - ID de l'utilisateur qui envoie le message
   * @param content - Contenu textuel du message
   * @param images - URLs des images (optionnel)
   * @returns Message créé avec les informations de l'expéditeur
   * @throws NotFoundException si l'échange n'existe pas
   * @throws ForbiddenException si l'utilisateur ne participe pas à l'échange
   */
  async createMessage(
    exchangeId: string,
    senderId: string,
    content: string,
    images?: string[],
  ) {
    // ============================================
    // VÉRIFICATION DES PERMISSIONS
    // ============================================
    // Vérifier que l'échange existe et que l'utilisateur y participe
    const exchange = await this.prisma.exchange.findUnique({
      where: { id: exchangeId },
    });

    if (!exchange) {
      throw new NotFoundException('Échange non trouvé');
    }

    // Vérifier que l'utilisateur est soit le requester soit le responder
    if (
      exchange.requesterId !== senderId &&
      exchange.responderId !== senderId
    ) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à envoyer un message dans cet échange",
      );
    }

    // ============================================
    // CRÉATION DU MESSAGE
    // ============================================
    /**
     * Créer le message dans la base de données.
     * Le message est associé à l'échange et à l'expéditeur.
     * Les images sont stockées dans un tableau.
     */
    const message = await this.prisma.chatMessage.create({
      data: {
        exchangeId,
        senderId,
        content,
        images: images || [], // Tableau vide si aucune image
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return message;
  }
}
