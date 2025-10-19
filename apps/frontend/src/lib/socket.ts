import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '@/types';

class SocketService {
  private socket: Socket | null = null;
  private currentExchangeId: string | null = null;

  connect() {
    if (this.socket?.connected) return;

    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    this.socket = io(baseURL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentExchangeId = null;
    }
  }

  connectToExchange(exchangeId: string) {
    if (!this.socket) {
      this.connect();
    }

    if (this.currentExchangeId !== exchangeId) {
      // Leave previous room if any
      if (this.currentExchangeId) {
        this.socket?.emit('leave', this.currentExchangeId);
      }

      // Join new room
      this.socket?.emit('join', exchangeId);
      this.currentExchangeId = exchangeId;
    }
  }

  leaveExchange() {
    if (this.socket && this.currentExchangeId) {
      this.socket.emit('leave', this.currentExchangeId);
      this.currentExchangeId = null;
    }
  }

  sendMessage(exchangeId: string, content: string) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('message:new', {
      exchangeId,
      content,
    });
  }

  emitTyping(exchangeId: string) {
    if (!this.socket) return;

    this.socket.emit('typing', exchangeId);
  }

  // Event listeners
  onMessage(callback: (message: ChatMessage) => void) {
    if (!this.socket) return;

    this.socket.on('message:new', callback);
  }

  onTyping(
    callback: (data: {
      exchangeId: string;
      userId: string;
      isTyping: boolean;
    }) => void
  ) {
    if (!this.socket) return;

    this.socket.on('typing', callback);
  }

  onUserJoined(
    callback: (data: { exchangeId: string; userId: string }) => void
  ) {
    if (!this.socket) return;

    this.socket.on('user:joined', callback);
  }

  onUserLeft(callback: (data: { exchangeId: string; userId: string }) => void) {
    if (!this.socket) return;

    this.socket.on('user:left', callback);
  }

  // Remove listeners
  offMessage(callback?: (message: ChatMessage) => void) {
    if (!this.socket) return;

    this.socket.off('message:new', callback);
  }

  offTyping(
    callback?: (data: {
      exchangeId: string;
      userId: string;
      isTyping: boolean;
    }) => void
  ) {
    if (!this.socket) return;

    this.socket.off('typing', callback);
  }

  offUserJoined(
    callback?: (data: { exchangeId: string; userId: string }) => void
  ) {
    if (!this.socket) return;

    this.socket.off('user:joined', callback);
  }

  offUserLeft(
    callback?: (data: { exchangeId: string; userId: string }) => void
  ) {
    if (!this.socket) return;

    this.socket.off('user:left', callback);
  }

  // Remove all listeners
  removeAllListeners() {
    if (!this.socket) return;

    this.socket.removeAllListeners();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
