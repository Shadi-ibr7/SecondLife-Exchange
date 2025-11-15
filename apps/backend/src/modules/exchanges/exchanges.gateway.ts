/**
 * FICHIER: exchanges.gateway.ts
 *
 * DESCRIPTION:
 * Ce gateway WebSocket gère la communication en temps réel pour les échanges.
 * Il permet aux utilisateurs de communiquer via un chat pendant un échange.
 *
 * FONCTIONNALITÉS:
 * - Connexion/déconnexion des clients WebSocket
 * - Rejoindre/quitter une salle d'échange spécifique
 * - Envoi de messages en temps réel (texte + images)
 * - Diffusion des messages à tous les participants d'un échange
 *
 * ARCHITECTURE:
 * - Utilise Socket.io pour la communication WebSocket
 * - Chaque échange a sa propre "room" (salle) pour isoler les conversations
 * - Les messages sont persistés dans la base de données via ExchangesService
 *
 * SÉCURITÉ:
 * - CORS configuré pour autoriser uniquement le frontend
 * - Les messages sont validés avant d'être sauvegardés
 */

// Import des décorateurs WebSocket de NestJS
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';

// Import de Socket.io
import { Server, Socket } from 'socket.io';

// Import des classes NestJS
import { Logger, UseGuards } from '@nestjs/common';

// Import du service
import { ExchangesService } from './exchanges.service';
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';

/**
 * GATEWAY: ExchangesGateway
 *
 * Gateway WebSocket pour la communication en temps réel dans les échanges.
 *
 * @WebSocketGateway: Configure le serveur WebSocket avec CORS
 * - cors.origin: URL du frontend autorisée
 * - cors.credentials: Autorise l'envoi de cookies/credentials
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ExchangesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  /**
   * SERVEUR WEBSOCKET
   *
   * Instance du serveur Socket.io, injectée automatiquement par NestJS.
   * Utilisée pour diffuser des messages à tous les clients connectés.
   */
  @WebSocketServer()
  server: Server;

  /**
   * LOGGER
   *
   * Pour enregistrer les événements (connexions, messages, etc.)
   */
  private readonly logger = new Logger(ExchangesGateway.name);

  /**
   * MAPPING UTILISATEURS -> SOCKETS
   *
   * Mappe l'ID d'un utilisateur à son ID de socket.
   * Utile pour envoyer des messages directs à un utilisateur spécifique.
   */
  private readonly userSockets = new Map<string, string>(); // userId -> socketId

  /**
   * CONSTRUCTEUR
   *
   * Injection du service d'échanges
   */
  constructor(private exchangesService: ExchangesService) {}

  // ============================================
  // GESTION DES CONNEXIONS
  // ============================================

  /**
   * MÉTHODE: handleConnection
   *
   * Appelée automatiquement quand un client se connecte au WebSocket.
   *
   * @param client - Le socket du client qui se connecte
   */
  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // L'authentification sera gérée via le token dans la query ou les headers
  }

  /**
   * MÉTHODE: handleDisconnect
   *
   * Appelée automatiquement quand un client se déconnecte.
   * Nettoie les mappings utilisateur -> socket.
   *
   * @param client - Le socket du client qui se déconnecte
   */
  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Nettoyer les mappings
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  // ============================================
  // GESTION DES ROOMS (SALLES D'ÉCHANGE)
  // ============================================

  /**
   * MÉTHODE: handleJoin
   *
   * Permet à un client de rejoindre la salle d'un échange spécifique.
   * Une fois dans la salle, le client recevra tous les messages de cet échange.
   *
   * @param client - Le socket du client
   * @param data - { exchangeId: ID de l'échange, userId: ID de l'utilisateur }
   */
  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { exchangeId: string; userId: string },
  ) {
    const { exchangeId, userId } = data;
    // Rejoindre la salle spécifique à cet échange
    await client.join(`exchange:${exchangeId}`);
    // Mapper l'utilisateur à son socket
    this.userSockets.set(userId, client.id);
    this.logger.log(`User ${userId} joined exchange ${exchangeId}`);
  }

  /**
   * MÉTHODE: handleLeave
   *
   * Permet à un client de quitter la salle d'un échange.
   *
   * @param client - Le socket du client
   * @param data - { exchangeId: ID de l'échange }
   */
  @SubscribeMessage('leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { exchangeId: string },
  ) {
    const { exchangeId } = data;
    // Quitter la salle
    await client.leave(`exchange:${exchangeId}`);
    this.logger.log(`Client left exchange ${exchangeId}`);
  }

  // ============================================
  // GESTION DES MESSAGES
  // ============================================

  /**
   * MÉTHODE: handleMessage
   *
   * Gère l'envoi d'un nouveau message dans un échange.
   *
   * PROCESSUS:
   * 1. Reçoit le message du client (texte + images optionnelles)
   * 2. Sauvegarde le message dans la base de données via ExchangesService
   * 3. Diffuse le message à tous les participants de l'échange (via la room)
   *
   * @param client - Le socket du client qui envoie le message
   * @param data - { exchangeId, content, images?, userId }
   */
  @SubscribeMessage('message:new')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      exchangeId: string;
      content: string;
      images?: string[];
      userId: string;
    },
  ) {
    const { exchangeId, content, images, userId } = data;

    try {
      // ============================================
      // SAUVEGARDE DU MESSAGE
      // ============================================
      /**
       * Créer le message dans la base de données.
       * ExchangesService vérifie que l'utilisateur participe à l'échange.
       */
      const message = await this.exchangesService.createMessage(
        exchangeId,
        userId,
        content,
        images,
      );

      // ============================================
      // DIFFUSION DU MESSAGE
      // ============================================
      /**
       * Diffuser le message à tous les clients dans la salle de l'échange.
       * server.to('exchange:${exchangeId}') cible tous les clients dans cette salle.
       * emit('message:new', ...) envoie l'événement 'message:new' avec les données.
       */
      this.server.to(`exchange:${exchangeId}`).emit('message:new', {
        id: message.id,
        exchangeId: message.exchangeId,
        senderId: message.senderId,
        content: message.content,
        images: message.images,
        createdAt: message.createdAt.toISOString(), // Convertir Date en string ISO
        sender: message.sender, // Informations de l'expéditeur
      });

      this.logger.log(
        `Message sent in exchange ${exchangeId} by user ${userId}`,
      );
    } catch (error: any) {
      // ============================================
      // GESTION DES ERREURS
      // ============================================
      /**
       * En cas d'erreur (échange inexistant, permissions, etc.),
       * envoyer un message d'erreur uniquement au client qui a tenté d'envoyer.
       */
      this.logger.error(`Error handling message: ${error.message}`);
      client.emit('error', {
        message: error.message || "Erreur lors de l'envoi du message",
      });
    }
  }
}
