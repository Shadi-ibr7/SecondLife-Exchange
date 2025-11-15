/**
 * FICHIER: socket.ts
 *
 * DESCRIPTION:
 * Ce fichier contient le service Socket.IO pour la communication en temps réel.
 * Il gère la connexion WebSocket, l'envoi/réception de messages de chat,
 * et les événements liés aux échanges (typing, user joined/left).
 *
 * FONCTIONNALITÉS:
 * - Connexion/déconnexion au serveur Socket.IO
 * - Gestion des rooms (salles) par échange
 * - Envoi de messages de chat en temps réel
 * - Émission d'événements de frappe (typing)
 * - Écoute des événements (messages, typing, user joined/left)
 * - Gestion des listeners (ajout/suppression)
 *
 * ARCHITECTURE:
 * - Une seule connexion Socket.IO partagée
 * - Changement de room selon l'échange actuel
 * - Les messages sont émis dans la room de l'échange
 */

// Import de Socket.IO Client
import { io, Socket } from 'socket.io-client';

// Import des types
import { ChatMessage } from '@/types';

/**
 * CLASSE: SocketService
 *
 * Service pour gérer la connexion Socket.IO et la communication en temps réel.
 */
class SocketService {
  /**
   * Instance Socket.IO (null si non connecté)
   */
  private socket: Socket | null = null;

  /**
   * ID de l'échange actuellement connecté (room)
   */
  private currentExchangeId: string | null = null;

  // ============================================
  // MÉTHODE: connect
  // ============================================

  /**
   * Établit la connexion Socket.IO avec le serveur.
   *
   * Si déjà connecté, ne fait rien.
   *
   * CONFIGURATION:
   * - withCredentials: true (envoie les cookies)
   * - transports: ['websocket', 'polling'] (fallback sur polling si websocket échoue)
   */
  connect() {
    // Ne pas reconnecter si déjà connecté
    if (this.socket?.connected) return;

    // URL de base du serveur (depuis les variables d'environnement ou localhost)
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    // Créer la connexion Socket.IO
    this.socket = io(baseURL, {
      withCredentials: true, // Envoyer les cookies (pour l'authentification)
      transports: ['websocket', 'polling'], // Essayer websocket d'abord, puis polling
    });

    // Écouter l'événement de connexion
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    // Écouter l'événement de déconnexion
    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Écouter les erreurs de connexion
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  // ============================================
  // MÉTHODE: disconnect
  // ============================================

  /**
   * Déconnecte le socket et nettoie l'état.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentExchangeId = null;
    }
  }

  // ============================================
  // MÉTHODE: connectToExchange
  // ============================================

  /**
   * Connecte le socket à la room d'un échange spécifique.
   *
   * FONCTIONNEMENT:
   * - Si le socket n'est pas connecté, le connecte d'abord
   * - Quitte la room précédente si on change d'échange
   * - Rejoint la nouvelle room
   *
   * @param exchangeId - ID de l'échange (room) à rejoindre
   */
  connectToExchange(exchangeId: string) {
    // Connecter si nécessaire
    if (!this.socket) {
      this.connect();
    }

    // Si on change d'échange, quitter l'ancien et rejoindre le nouveau
    if (this.currentExchangeId !== exchangeId) {
      // Quitter la room précédente si elle existe
      if (this.currentExchangeId) {
        this.socket?.emit('leave', this.currentExchangeId);
      }

      // Rejoindre la nouvelle room
      this.socket?.emit('join', exchangeId);
      this.currentExchangeId = exchangeId;
    }
  }

  // ============================================
  // MÉTHODE: leaveExchange
  // ============================================

  /**
   * Quitte la room de l'échange actuel.
   */
  leaveExchange() {
    if (this.socket && this.currentExchangeId) {
      this.socket.emit('leave', this.currentExchangeId);
      this.currentExchangeId = null;
    }
  }

  // ============================================
  // MÉTHODE: sendMessage
  // ============================================

  /**
   * Envoie un message de chat dans un échange.
   *
   * @param exchangeId - ID de l'échange
   * @param content - Contenu textuel du message
   * @param images - URLs des images (optionnel)
   * @param userId - ID de l'utilisateur expéditeur (optionnel)
   * @throws Error si le socket n'est pas connecté
   */
  sendMessage(
    exchangeId: string,
    content: string,
    images?: string[],
    userId?: string
  ) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    // Émettre l'événement 'message:new' avec les données du message
    this.socket.emit('message:new', {
      exchangeId,
      content,
      images: images || [],
      userId,
    });
  }

  // ============================================
  // MÉTHODE: emitTyping
  // ============================================

  /**
   * Émet un événement de frappe (typing) pour indiquer que l'utilisateur est en train d'écrire.
   *
   * @param exchangeId - ID de l'échange
   */
  emitTyping(exchangeId: string) {
    if (!this.socket) return;

    this.socket.emit('typing', exchangeId);
  }

  // ============================================
  // ÉCOUTEURS D'ÉVÉNEMENTS
  // ============================================

  /**
   * Écoute les nouveaux messages reçus.
   *
   * @param callback - Fonction appelée quand un nouveau message arrive
   */
  onMessage(callback: (message: ChatMessage) => void) {
    if (!this.socket) return;

    this.socket.on('message:new', callback);
  }

  /**
   * Écoute les événements de frappe (typing).
   *
   * @param callback - Fonction appelée quand un utilisateur commence/arrête de taper
   */
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

  /**
   * Écoute les événements d'utilisateur rejoint.
   *
   * @param callback - Fonction appelée quand un utilisateur rejoint un échange
   */
  onUserJoined(
    callback: (data: { exchangeId: string; userId: string }) => void
  ) {
    if (!this.socket) return;

    this.socket.on('user:joined', callback);
  }

  /**
   * Écoute les événements d'utilisateur quitté.
   *
   * @param callback - Fonction appelée quand un utilisateur quitte un échange
   */
  onUserLeft(callback: (data: { exchangeId: string; userId: string }) => void) {
    if (!this.socket) return;

    this.socket.on('user:left', callback);
  }

  // ============================================
  // SUPPRESSION DES ÉCOUTEURS
  // ============================================

  /**
   * Supprime l'écouteur de messages.
   *
   * @param callback - Callback spécifique à supprimer (optionnel, supprime tous si non fourni)
   */
  offMessage(callback?: (message: ChatMessage) => void) {
    if (!this.socket) return;

    this.socket.off('message:new', callback);
  }

  /**
   * Supprime l'écouteur de typing.
   *
   * @param callback - Callback spécifique à supprimer (optionnel)
   */
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

  /**
   * Supprime l'écouteur de user joined.
   *
   * @param callback - Callback spécifique à supprimer (optionnel)
   */
  offUserJoined(
    callback?: (data: { exchangeId: string; userId: string }) => void
  ) {
    if (!this.socket) return;

    this.socket.off('user:joined', callback);
  }

  /**
   * Supprime l'écouteur de user left.
   *
   * @param callback - Callback spécifique à supprimer (optionnel)
   */
  offUserLeft(
    callback?: (data: { exchangeId: string; userId: string }) => void
  ) {
    if (!this.socket) return;

    this.socket.off('user:left', callback);
  }

  // ============================================
  // MÉTHODE: removeAllListeners
  // ============================================

  /**
   * Supprime tous les écouteurs d'événements.
   *
   * Utile pour nettoyer lors du démontage d'un composant.
   */
  removeAllListeners() {
    if (!this.socket) return;

    this.socket.removeAllListeners();
  }

  // ============================================
  // MÉTHODE: isConnected
  // ============================================

  /**
   * Vérifie si le socket est connecté.
   *
   * @returns true si connecté, false sinon
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// ============================================
// EXPORT DU SERVICE
// ============================================

/**
 * Instance unique du service Socket.
 * Utilisée dans toute l'application pour la communication en temps réel.
 */
export const socketService = new SocketService();
