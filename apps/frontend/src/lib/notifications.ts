/**
 * FICHIER: lib/notifications.ts
 *
 * DESCRIPTION:
 * Service singleton pour gérer les notifications push dans l'application.
 * Il centralise toute la logique liée aux permissions, tokens, et envoi de notifications.
 * Utilise l'API Web Notifications du navigateur et les Service Workers pour les notifications push.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Gestion des permissions de notification (demande, vérification)
 * - Génération et enregistrement de tokens pour les notifications push
 * - Envoi de notifications de test
 * - Affichage de notifications locales
 * - Vérification du support navigateur
 * - Pattern Singleton pour une instance unique dans toute l'application
 *
 * ARCHITECTURE:
 * - Pattern Singleton: une seule instance du service dans toute l'application
 * - État privé pour la permission actuelle
 * - Méthodes asynchrones pour les opérations réseau
 * - Gestion d'erreurs avec try/catch et notifications toast
 *
 * SÉCURITÉ:
 * - Vérification du support navigateur avant toute opération
 * - Tokens générés de manière sécurisée (mock actuellement, Firebase en production)
 * - Enregistrement des tokens côté serveur pour authentification
 *
 * UX:
 * - Messages toast clairs pour informer l'utilisateur
 * - Gestion gracieuse des erreurs
 * - Support des différents états de permission (default, granted, denied)
 */

// Import de l'API de notifications pour communiquer avec le backend
import { notificationsApi } from './notifications.api';
// Import de react-hot-toast pour afficher des notifications à l'utilisateur
import { toast } from 'react-hot-toast';

/**
 * CLASSE: NotificationService
 *
 * Service singleton pour gérer les notifications push.
 * Utilise le pattern Singleton pour garantir une seule instance dans toute l'application.
 */
export class NotificationService {
  /**
   * Instance statique du service (partagée par toute l'application)
   * null au départ, créée lors du premier appel à getInstance()
   */
  private static instance: NotificationService;

  /**
   * État actuel de la permission de notification
   * - 'default': l'utilisateur n'a pas encore été demandé
   * - 'granted': l'utilisateur a accordé la permission
   * - 'denied': l'utilisateur a refusé la permission
   */
  private permission: NotificationPermission = 'default';

  /**
   * Constructeur privé pour empêcher l'instanciation directe
   * Seule la méthode getInstance() peut créer une instance
   *
   * Vérifie automatiquement l'état des permissions au démarrage
   */
  private constructor() {
    this.checkPermission();
  }

  /**
   * MÉTHODE STATIQUE: getInstance
   *
   * Retourne l'instance unique du service (pattern Singleton).
   * Si l'instance n'existe pas encore, elle est créée.
   *
   * @returns L'instance unique de NotificationService
   */
  public static getInstance(): NotificationService {
    // Si l'instance n'existe pas encore, la créer
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    // Retourner l'instance existante ou nouvellement créée
    return NotificationService.instance;
  }

  // ============================================
  // MÉTHODES PRIVÉES
  // ============================================

  /**
   * MÉTHODE PRIVÉE: checkPermission
   *
   * Vérifie l'état actuel des permissions de notification.
   * Cette méthode est appelée au démarrage du service et peut être appelée
   * manuellement pour mettre à jour l'état des permissions.
   *
   * IMPORTANT: Vérifie d'abord que window existe (SSR-safe) et que
   * l'API Notification est disponible dans le navigateur.
   */
  private checkPermission(): void {
    /**
     * Vérifier que:
     * 1. window existe (on est côté client, pas côté serveur)
     * 2. L'API Notification est disponible dans le navigateur
     *
     * typeof window !== 'undefined': vérifie qu'on est dans un environnement navigateur
     * 'Notification' in window: vérifie que l'API Notification existe
     */
    if (typeof window !== 'undefined' && 'Notification' in window) {
      /**
       * Récupérer l'état actuel de la permission depuis l'API du navigateur
       * Notification.permission peut être 'default', 'granted', ou 'denied'
       */
      this.permission = Notification.permission;
    }
    // Si les notifications ne sont pas supportées, permission reste à 'default'
  }

  // ============================================
  // MÉTHODES PUBLIQUES
  // ============================================

  /**
   * MÉTHODE PUBLIQUE: requestPermission
   *
   * Demande la permission à l'utilisateur pour afficher des notifications.
   * Cette méthode doit être appelée en réponse à une action utilisateur
   * (ex: clic sur un bouton) car les navigateurs bloquent les demandes
   * de permission non sollicitées.
   *
   * FLUX:
   * 1. Vérifier le support navigateur
   * 2. Si déjà accordée, retourner true immédiatement
   * 3. Demander la permission via l'API Notification
   * 4. Mettre à jour l'état interne
   * 5. Afficher un message toast selon le résultat
   *
   * @returns true si la permission est accordée, false sinon
   */
  async requestPermission(): Promise<boolean> {
    /**
     * Vérifier que les notifications sont supportées par le navigateur
     * Si ce n'est pas le cas, afficher un message d'erreur et retourner false
     */
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Les notifications ne sont pas supportées par ce navigateur');
      return false;
    }

    /**
     * Si la permission est déjà accordée, pas besoin de redemander
     * Retourner true immédiatement
     */
    if (this.permission === 'granted') {
      return true;
    }

    try {
      /**
       * Demander la permission à l'utilisateur via l'API Notification
       * Cette méthode affiche une popup native du navigateur
       * Elle retourne une Promise qui se résout avec le résultat
       *
       * IMPORTANT: Cette méthode doit être appelée en réponse à une action utilisateur
       * (clic, touche, etc.) sinon elle sera bloquée par le navigateur
       */
      const permission = await Notification.requestPermission();

      /**
       * Mettre à jour l'état interne avec le résultat
       */
      this.permission = permission;

      /**
       * Traiter le résultat selon la valeur retournée
       */
      if (permission === 'granted') {
        /**
         * Permission accordée: afficher un message de succès
         */
        toast.success('Notifications activées !');
        return true;
      } else if (permission === 'denied') {
        /**
         * Permission refusée: afficher un message d'erreur avec instructions
         * Une fois refusée, l'utilisateur doit aller dans les paramètres du navigateur
         * pour la réactiver
         */
        toast.error(
          'Notifications refusées. Vous pouvez les activer dans les paramètres du navigateur.'
        );
        return false;
      } else {
        /**
         * Permission en état 'default' (l'utilisateur a fermé la popup sans répondre)
         * Afficher un message d'erreur
         */
        toast.error('Permission de notification refusée');
        return false;
      }
    } catch (error) {
      /**
       * En cas d'erreur (ex: API indisponible, erreur réseau, etc.)
       * Logger l'erreur pour le debug et afficher un message à l'utilisateur
       */
      console.error('Erreur lors de la demande de permission:', error);
      toast.error("Erreur lors de l'activation des notifications");
      return false;
    }
  }

  /**
   * MÉTHODE PUBLIQUE: getToken
   *
   * Obtient un token de notification push pour l'appareil actuel.
   * Ce token est utilisé par le serveur pour envoyer des notifications push
   * à cet appareil spécifique.
   *
   * FLUX:
   * 1. Vérifier que la permission est accordée
   * 2. Vérifier que le Service Worker est disponible
   * 3. Attendre que le Service Worker soit prêt
   * 4. Générer un token (mock actuellement, Firebase en production)
   * 5. Enregistrer le token côté serveur
   * 6. Retourner le token
   *
   * NOTE: Actuellement, cette méthode génère un token mock.
   * En production, il faudrait utiliser Firebase Cloud Messaging (FCM)
   * ou un autre service de notifications push.
   *
   * @returns Le token de notification push, ou null si impossible à obtenir
   */
  async getToken(): Promise<string | null> {
    /**
     * Si la permission n'est pas accordée, on ne peut pas obtenir de token
     * Retourner null immédiatement
     */
    if (this.permission !== 'granted') {
      return null;
    }

    try {
      /**
       * Vérifier que:
       * 1. window existe (on est côté client)
       * 2. Le Service Worker est disponible dans le navigateur
       *
       * Les Service Workers sont nécessaires pour recevoir des notifications push
       * même quand l'application n'est pas ouverte
       */
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        /**
         * Attendre que le Service Worker soit enregistré et prêt
         * navigator.serviceWorker.ready retourne une Promise qui se résout
         * quand le Service Worker est actif
         */
        const registration = await navigator.serviceWorker.ready;

        /**
         * Générer un token mock pour les tests
         * EN PRODUCTION: Utiliser Firebase Cloud Messaging (FCM) ou un autre service
         * Exemple avec FCM:
         * const messaging = getMessaging();
         * const token = await getToken(messaging, { vapidKey: '...' });
         */
        const token = this.generateMockToken();

        /**
         * Enregistrer le token côté serveur pour que le backend puisse
         * envoyer des notifications push à cet appareil
         */
        await this.registerToken(token);

        /**
         * Retourner le token pour utilisation ultérieure (ex: stockage local)
         */
        return token;
      }

      /**
       * Si le Service Worker n'est pas disponible, retourner null
       */
      return null;
    } catch (error) {
      /**
       * En cas d'erreur (ex: Service Worker indisponible, erreur réseau, etc.)
       * Logger l'erreur pour le debug et retourner null
       */
      console.error("Erreur lors de l'obtention du token:", error);
      return null;
    }
  }

  /**
   * MÉTHODE PUBLIQUE: registerToken
   *
   * Enregistre un token de notification push côté serveur.
   * Le serveur stocke ce token pour pouvoir envoyer des notifications push
   * à cet appareil spécifique plus tard.
   *
   * @param token - Le token de notification push à enregistrer
   * @returns true si l'enregistrement a réussi, false sinon
   */
  async registerToken(token: string): Promise<boolean> {
    try {
      /**
       * Appeler l'API backend pour enregistrer le token
       * provider: 'webpush' indique qu'on utilise Web Push (standard web)
       * D'autres providers possibles: 'fcm' (Firebase), 'apns' (Apple), etc.
       */
      await notificationsApi.registerToken({
        token,
        provider: 'webpush', // Provider Web Push standard
      });

      /**
       * Logger un message de succès (en développement)
       * En production, on pourrait vouloir logger moins d'informations
       */
      console.log('Token de notification enregistré');
      return true;
    } catch (error) {
      /**
       * En cas d'erreur (ex: serveur indisponible, token invalide, etc.)
       * Logger l'erreur pour le debug et retourner false
       */
      console.error("Erreur lors de l'enregistrement du token:", error);
      return false;
    }
  }

  /**
   * MÉTHODE PUBLIQUE: sendTestNotification
   *
   * Envoie une notification de test via le serveur.
   * Cette méthode est utile pour vérifier que les notifications push fonctionnent
   * correctement et que le token est bien enregistré côté serveur.
   *
   * FLUX:
   * 1. Appeler l'API backend pour envoyer une notification de test
   * 2. Le serveur envoie la notification à tous les appareils enregistrés de l'utilisateur
   * 3. Afficher un message de succès avec le nombre d'appareils notifiés
   *
   * @returns true si l'envoi a réussi, false sinon
   */
  async sendTestNotification(): Promise<boolean> {
    try {
      /**
       * Appeler l'API backend pour envoyer une notification de test
       * Le serveur va envoyer cette notification à tous les tokens enregistrés
       * pour l'utilisateur connecté
       */
      const response = await notificationsApi.sendTestNotification({
        title: 'Test SecondLife', // Titre de la notification de test
        body: 'Ceci est une notification de test !', // Corps de la notification
      });

      /**
       * Vérifier si l'envoi a réussi
       * response.success indique si au moins un appareil a reçu la notification
       * response.sentCount indique le nombre d'appareils qui ont reçu la notification
       */
      if (response.success) {
        /**
         * Afficher un message de succès avec le nombre d'appareils notifiés
         * Cela permet à l'utilisateur de savoir combien d'appareils ont reçu la notification
         */
        toast.success(
          `Notification envoyée à ${response.sentCount} appareil(s)`
        );
        return true;
      } else {
        /**
         * Si l'envoi a échoué (ex: aucun token enregistré, erreur serveur, etc.)
         * Afficher un message d'erreur
         */
        toast.error("Erreur lors de l'envoi de la notification");
        return false;
      }
    } catch (error) {
      /**
       * En cas d'erreur (ex: serveur indisponible, erreur réseau, etc.)
       * Logger l'erreur pour le debug et afficher un message à l'utilisateur
       */
      console.error(
        "Erreur lors de l'envoi de la notification de test:",
        error
      );
      toast.error("Erreur lors de l'envoi de la notification");
      return false;
    }
  }

  /**
   * MÉTHODE PUBLIQUE: showLocalNotification
   *
   * Affiche une notification locale directement depuis le navigateur.
   * Contrairement aux notifications push (envoyées par le serveur), cette méthode
   * affiche une notification immédiatement dans le navigateur.
   *
   * UTILISATION:
   * - Notifications instantanées (ex: nouveau message reçu en temps réel)
   * - Notifications qui ne nécessitent pas de serveur
   * - Feedback immédiat à l'utilisateur
   *
   * @param title - Le titre de la notification
   * @param options - Options supplémentaires pour la notification (corps, icône, etc.)
   */
  showLocalNotification(title: string, options?: NotificationOptions): void {
    /**
     * Vérifier que la permission est accordée avant d'afficher la notification
     * Si la permission n'est pas accordée, la notification ne s'affichera pas
     */
    if (this.permission === 'granted') {
      /**
       * Créer et afficher une nouvelle notification
       *
       * icon: '/logo.svg' - Icône affichée dans la notification (logo de l'application)
       * badge: '/badge.png' - Badge affiché sur l'icône de l'application (petite icône)
       * tag: 'secondlife-notification' - Tag pour regrouper les notifications similaires
       *      (si plusieurs notifications ont le même tag, seule la dernière est affichée)
       * ...options - Options supplémentaires passées en paramètre (corps, actions, etc.)
       */
      new Notification(title, {
        icon: '/logo.svg', // Icône de l'application
        badge: '/badge.png', // Badge sur l'icône de l'application
        tag: 'secondlife-notification', // Tag pour regrouper les notifications
        ...options, // Options supplémentaires (body, actions, etc.)
      });
    }
    // Si la permission n'est pas accordée, la méthode ne fait rien (silencieux)
  }

  /**
   * MÉTHODE PUBLIQUE: isSupported
   *
   * Vérifie si les notifications sont supportées par le navigateur.
   * Les notifications nécessitent:
   * - L'API Notification (pour afficher des notifications)
   * - Les Service Workers (pour recevoir des notifications push même quand l'app est fermée)
   *
   * @returns true si les notifications sont supportées, false sinon
   */
  isSupported(): boolean {
    /**
     * Vérifier que:
     * 1. L'API Notification existe dans window
     * 2. Les Service Workers sont disponibles dans navigator
     *
     * Les deux sont nécessaires pour un support complet des notifications push
     */
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * MÉTHODE PUBLIQUE: isGranted
   *
   * Vérifie si la permission de notification a été accordée par l'utilisateur.
   *
   * @returns true si la permission est accordée, false sinon
   */
  isGranted(): boolean {
    /**
     * Retourner true seulement si la permission est 'granted'
     * 'default' et 'denied' retournent false
     */
    return this.permission === 'granted';
  }

  /**
   * MÉTHODE PUBLIQUE: isEnabled
   *
   * Alias pour isGranted().
   * Fournit une méthode plus sémantique pour vérifier si les notifications sont activées.
   *
   * @returns true si les notifications sont activées (permission accordée), false sinon
   */
  isEnabled(): boolean {
    /**
     * Déléguer à isGranted() pour éviter la duplication de code
     */
    return this.isGranted();
  }

  /**
   * MÉTHODE PUBLIQUE: getPermissionStatus
   *
   * Retourne l'état actuel de la permission de notification.
   * Utile pour afficher l'état dans l'UI ou pour des logs.
   *
   * @returns L'état actuel de la permission ('default', 'granted', ou 'denied')
   */
  getPermissionStatus(): NotificationPermission {
    /**
     * Retourner directement l'état stocké dans la propriété privée
     */
    return this.permission;
  }

  /**
   * MÉTHODE PRIVÉE: generateMockToken
   *
   * Génère un token mock aléatoire pour les tests.
   *
   * EN PRODUCTION: Cette méthode ne devrait pas être utilisée.
   * Il faudrait utiliser Firebase Cloud Messaging (FCM) ou un autre service
   * pour générer de vrais tokens de notification push.
   *
   * Le token généré est une chaîne aléatoire de 64 caractères alphanumériques.
   *
   * @returns Un token mock aléatoire de 64 caractères
   */
  private generateMockToken(): string {
    /**
     * Caractères possibles pour le token (lettres majuscules, minuscules, chiffres)
     */
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    /**
     * Initialiser une chaîne vide pour le résultat
     */
    let result = '';

    /**
     * Générer 64 caractères aléatoires
     * Math.random() génère un nombre entre 0 et 1
     * Math.floor() arrondit vers le bas
     * chars.charAt() récupère le caractère à l'index donné
     */
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    /**
     * Retourner le token généré
     */
    return result;
  }

  /**
   * MÉTHODE PUBLIQUE: initialize
   *
   * Initialise le service de notifications en enregistrant le Service Worker.
   * Cette méthode doit être appelée au démarrage de l'application pour activer
   * les notifications push.
   *
   * FLUX:
   * 1. Vérifier que les notifications sont supportées
   * 2. Enregistrer le Service Worker pour les notifications push
   * 3. Retourner true si l'initialisation a réussi
   *
   * NOTE: Le Service Worker doit être présent dans le dossier public de l'application.
   * Pour Firebase, il s'agit généralement de 'firebase-messaging-sw.js'.
   *
   * @returns true si l'initialisation a réussi, false sinon
   */
  async initialize(): Promise<boolean> {
    /**
     * Vérifier d'abord que les notifications sont supportées
     * Si ce n'est pas le cas, on ne peut pas initialiser le service
     */
    if (!this.isSupported()) {
      console.warn('Les notifications ne sont pas supportées');
      return false;
    }

    /**
     * Enregistrer le Service Worker si disponible
     * Le Service Worker est nécessaire pour recevoir des notifications push
     * même quand l'application n'est pas ouverte
     */
    if ('serviceWorker' in navigator) {
      try {
        /**
         * Enregistrer le Service Worker pour Firebase Cloud Messaging
         * '/firebase-messaging-sw.js' est le fichier Service Worker standard pour FCM
         *
         * EN PRODUCTION: Ce fichier doit être présent dans le dossier public
         * et configuré avec les clés Firebase appropriées
         */
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker enregistré');
      } catch (error) {
        /**
         * En cas d'erreur (ex: fichier Service Worker introuvable, erreur de syntaxe, etc.)
         * Logger l'erreur mais ne pas bloquer l'application
         * Les notifications locales fonctionneront toujours, mais pas les push
         */
        console.error(
          "Erreur lors de l'enregistrement du Service Worker:",
          error
        );
      }
    }

    /**
     * Retourner true même si l'enregistrement du Service Worker a échoué
     * car les notifications locales peuvent toujours fonctionner
     */
    return true;
  }
}

// ============================================
// EXPORT DE L'INSTANCE SINGLETON
// ============================================

/**
 * Instance unique du service de notifications (pattern Singleton)
 *
 * Cette instance est créée automatiquement lors du premier import de ce module.
 * Tous les composants qui importent notificationService utilisent la même instance,
 * garantissant un état cohérent dans toute l'application.
 *
 * UTILISATION:
 * ```typescript
 * import { notificationService } from '@/lib/notifications';
 *
 * // Demander la permission
 * await notificationService.requestPermission();
 *
 * // Obtenir un token
 * const token = await notificationService.getToken();
 *
 * // Vérifier si les notifications sont activées
 * if (notificationService.isEnabled()) {
 *   // Faire quelque chose
 * }
 * ```
 */
export const notificationService = NotificationService.getInstance();
