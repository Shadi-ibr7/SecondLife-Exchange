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
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './chat.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      });

      const user = await this.chatService.validateUser(payload.sub);
      if (!user) {
        client.disconnect();
        return;
      }

      client.data.user = user;
      console.log(`User ${user.username} connected to chat`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      console.log(`User ${client.data.user.username} disconnected from chat`);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { exchangeId: string },
  ) {
    if (!client.data.user) {
      return { error: 'Non authentifié' };
    }

    const exchange = await this.chatService.validateExchangeAccess(
      data.exchangeId,
      client.data.user.id,
    );

    if (!exchange) {
      return { error: 'Accès refusé à cet échange' };
    }

    client.join(`exchange_${data.exchangeId}`);
    return { success: true, room: `exchange_${data.exchangeId}` };
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { exchangeId: string },
  ) {
    client.leave(`exchange_${data.exchangeId}`);
    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { exchangeId: string; content: string },
  ) {
    if (!client.data.user) {
      return { error: 'Non authentifié' };
    }

    const exchange = await this.chatService.validateExchangeAccess(
      data.exchangeId,
      client.data.user.id,
    );

    if (!exchange) {
      return { error: 'Accès refusé à cet échange' };
    }

    const message = await this.chatService.createMessage({
      content: data.content,
      senderId: client.data.user.id,
      exchangeId: data.exchangeId,
    });

    // Envoyer le message à tous les clients dans la room
    this.server.to(`exchange_${data.exchangeId}`).emit('new_message', {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      exchangeId: message.exchangeId,
      createdAt: message.createdAt,
      sender: {
        id: client.data.user.id,
        username: client.data.user.username,
        firstName: client.data.user.firstName,
        lastName: client.data.user.lastName,
        avatar: client.data.user.avatar,
      },
    });

    return { success: true, message };
  }
}
