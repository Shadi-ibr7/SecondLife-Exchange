import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../../common/guards/jwt-access.guard';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/community',
})
export class CommunityGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CommunityGateway.name);
  private readonly connectedUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private readonly typingUsers = new Map<string, Set<string>>(); // threadId -> Set<userId>

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Nettoyer les utilisateurs connectés
    for (const [userId, socketIds] of this.connectedUsers.entries()) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }

    // Nettoyer les utilisateurs en train de taper
    for (const [threadId, userIds] of this.typingUsers.entries()) {
      // On ne peut pas identifier l'utilisateur depuis le socket sans auth
      // On laisse le timeout gérer le nettoyage
    }
  }

  @SubscribeMessage('join-thread')
  async handleJoinThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; userId: string },
  ) {
    const { threadId, userId } = data;

    // Rejoindre la room du thread
    await client.join(`thread:${threadId}`);

    // Ajouter l'utilisateur aux utilisateurs connectés
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(client.id);

    this.logger.log(`User ${userId} joined thread ${threadId}`);

    // Notifier les autres utilisateurs
    client.to(`thread:${threadId}`).emit('user-joined', {
      userId,
      threadId,
    });
  }

  @SubscribeMessage('leave-thread')
  async handleLeaveThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; userId: string },
  ) {
    const { threadId, userId } = data;

    // Quitter la room du thread
    await client.leave(`thread:${threadId}`);

    // Retirer l'utilisateur des utilisateurs connectés
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(client.id);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }

    this.logger.log(`User ${userId} left thread ${threadId}`);

    // Notifier les autres utilisateurs
    client.to(`thread:${threadId}`).emit('user-left', {
      userId,
      threadId,
    });
  }

  @SubscribeMessage('post:new')
  async handleNewPost(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; post: any },
  ) {
    const { threadId, post } = data;

    // Diffuser le nouveau post à tous les utilisateurs du thread
    this.server.to(`thread:${threadId}`).emit('post:new', {
      threadId,
      post,
    });

    this.logger.log(`New post in thread ${threadId}: ${post.id}`);
  }

  @SubscribeMessage('post:update')
  async handlePostUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; post: any },
  ) {
    const { threadId, post } = data;

    // Diffuser la mise à jour du post
    this.server.to(`thread:${threadId}`).emit('post:update', {
      threadId,
      post,
    });

    this.logger.log(`Post updated in thread ${threadId}: ${post.id}`);
  }

  @SubscribeMessage('post:delete')
  async handlePostDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; postId: string },
  ) {
    const { threadId, postId } = data;

    // Diffuser la suppression du post
    this.server.to(`thread:${threadId}`).emit('post:delete', {
      threadId,
      postId,
    });

    this.logger.log(`Post deleted in thread ${threadId}: ${postId}`);
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; userId: string; userName: string },
  ) {
    const { threadId, userId, userName } = data;

    // Ajouter l'utilisateur aux utilisateurs en train de taper
    if (!this.typingUsers.has(threadId)) {
      this.typingUsers.set(threadId, new Set());
    }
    this.typingUsers.get(threadId)!.add(userId);

    // Diffuser l'état de frappe
    client.to(`thread:${threadId}`).emit('typing:start', {
      threadId,
      userId,
      userName,
    });

    // Nettoyer après 3 secondes
    setTimeout(() => {
      this.handleTypingStop(client, { threadId, userId });
    }, 3000);
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; userId: string },
  ) {
    const { threadId, userId } = data;

    // Retirer l'utilisateur des utilisateurs en train de taper
    const typingUsers = this.typingUsers.get(threadId);
    if (typingUsers) {
      typingUsers.delete(userId);
      if (typingUsers.size === 0) {
        this.typingUsers.delete(threadId);
      }
    }

    // Diffuser l'arrêt de frappe
    client.to(`thread:${threadId}`).emit('typing:stop', {
      threadId,
      userId,
    });
  }

  // Méthodes publiques pour les services
  broadcastNewPost(threadId: string, post: any) {
    this.server.to(`thread:${threadId}`).emit('post:new', {
      threadId,
      post,
    });
  }

  broadcastPostUpdate(threadId: string, post: any) {
    this.server.to(`thread:${threadId}`).emit('post:update', {
      threadId,
      post,
    });
  }

  broadcastPostDelete(threadId: string, postId: string) {
    this.server.to(`thread:${threadId}`).emit('post:delete', {
      threadId,
      postId,
    });
  }

  getConnectedUsers(threadId: string): string[] {
    // Retourner les utilisateurs connectés à un thread
    // Cette méthode pourrait être améliorée pour être plus précise
    return Array.from(this.connectedUsers.keys());
  }
}

