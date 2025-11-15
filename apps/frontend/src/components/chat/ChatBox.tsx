/**
 * FICHIER: ChatBox.tsx
 *
 * DESCRIPTION:
 * Ce composant représente la boîte de chat principale pour une conversation d'échange.
 * Il gère l'affichage des messages, l'envoi de nouveaux messages, et la communication
 * en temps réel via WebSocket (socket.io).
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Affiche tous les messages de la conversation
 * - Permet d'envoyer de nouveaux messages
 * - Gère les messages optimistes (affichage immédiat avant confirmation serveur)
 * - Affiche un indicateur quand l'autre utilisateur est en train d'écrire
 * - Scroll automatique vers le bas quand de nouveaux messages arrivent
 * - Communication en temps réel via WebSocket
 */

// Import des hooks React nécessaires
// useState: pour gérer l'état local du composant (messages, texte saisi, etc.)
// useEffect: pour exécuter du code au montage/mise à jour du composant
// useRef: pour créer des références à des éléments DOM ou valeurs persistantes
// useCallback: pour mémoriser des fonctions et éviter les re-renders inutiles
import { useState, useEffect, useRef, useCallback } from 'react';

// Import de Framer Motion pour les animations
// motion: pour animer les éléments
// AnimatePresence: pour animer l'apparition/disparition d'éléments
import { motion, AnimatePresence } from 'framer-motion';

// Import des composants UI réutilisables
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import des types TypeScript pour la sécurité des types
import { ChatMessage, User } from '@/types';

// Import du service WebSocket pour la communication en temps réel
import { socketService } from '@/lib/socket';

// Import des composants enfants utilisés dans ce fichier
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

// Import du store d'authentification pour récupérer l'utilisateur connecté
import { useAuthStore } from '@/store/auth';

// Import des icônes depuis lucide-react
import { Send, MessageCircle } from 'lucide-react';

// Import de la bibliothèque de notifications toast
import { toast } from 'react-hot-toast';

/**
 * Interface TypeScript qui définit les propriétés (props) que ce composant accepte
 * Cela garantit que le composant reçoit les bonnes données avec les bons types
 */
interface ChatBoxProps {
  exchangeId: string; // L'identifiant unique de l'échange (conversation)
  messages: ChatMessage[]; // La liste de tous les messages de la conversation
  otherUser: User; // Les informations de l'autre utilisateur dans la conversation
  onNewMessage?: (message: ChatMessage) => void; // Fonction optionnelle appelée quand un nouveau message arrive
}

/**
 * COMPOSANT PRINCIPAL: ChatBox
 *
 * Ce composant est la fonction principale qui sera exportée et utilisée ailleurs dans l'application
 */
export function ChatBox({
  exchangeId,
  messages,
  otherUser,
  onNewMessage,
}: ChatBoxProps) {
  // ============================================
  // GESTION DE L'ÉTAT LOCAL DU COMPOSANT
  // ============================================

  // État pour stocker le texte que l'utilisateur est en train de taper
  // useState('') crée une variable d'état initialisée à une chaîne vide
  // setNewMessage est la fonction pour modifier cette valeur
  const [newMessage, setNewMessage] = useState('');

  // État pour savoir si l'utilisateur actuel est en train d'écrire
  // Utilisé pour envoyer un signal "en train d'écrire" à l'autre utilisateur
  const [isTyping, setIsTyping] = useState(false);

  // État pour stocker la liste des utilisateurs qui sont en train d'écrire
  // Set<string> est une structure de données qui évite les doublons
  // On stocke les IDs des utilisateurs qui tapent actuellement
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // État pour les messages optimistes
  // Les messages optimistes sont des messages affichés immédiatement avant
  // que le serveur confirme leur réception. Cela donne une meilleure expérience utilisateur
  // car le message apparaît instantanément sans attendre la réponse du serveur
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>(
    []
  );

  // Référence vers l'élément DOM en bas de la liste des messages
  // useRef permet de garder une référence à un élément HTML sans causer de re-render
  // On l'utilise pour scroller automatiquement vers le bas
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Référence pour stocker le timer qui arrête l'indicateur "en train d'écrire"
  // NodeJS.Timeout est le type retourné par setTimeout
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Récupération de l'utilisateur connecté depuis le store d'authentification
  // Le store est un système de gestion d'état global (comme Redux mais plus simple)
  const { user } = useAuthStore();

  // ============================================
  // FONCTION POUR SCROLLER AUTOMATIQUEMENT
  // ============================================

  /**
   * Fonction pour faire défiler automatiquement la liste des messages vers le bas
   * useCallback mémorise cette fonction pour éviter de la recréer à chaque render
   * Cela améliore les performances
   *
   * messagesEndRef.current?: vérifie si la référence existe avant d'utiliser scrollIntoView
   * scrollIntoView({ behavior: 'smooth' }): fait défiler la page jusqu'à cet élément avec une animation douce
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ============================================
  // EFFET POUR SCROLLER QUAND DE NOUVEAUX MESSAGES ARRIVENT
  // ============================================

  /**
   * useEffect s'exécute après chaque render du composant
   * Ici, on scroll vers le bas chaque fois que:
   * - La liste des messages change (nouveau message reçu)
   * - La liste des messages optimistes change (nouveau message envoyé)
   *
   * Le tableau de dépendances [messages, optimisticMessages, scrollToBottom] indique
   * que cet effet doit se réexécuter si l'une de ces valeurs change
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages, optimisticMessages, scrollToBottom]);

  // ============================================
  // CONNEXION AU WEBSOCKET ET GESTION DES ÉVÉNEMENTS
  // ============================================

  /**
   * useEffect pour gérer la connexion WebSocket et écouter les événements en temps réel
   * Cette fonction s'exécute une fois au montage du composant et se reconnecte si exchangeId ou user change
   */
  useEffect(() => {
    // Vérification de sécurité: on ne peut pas se connecter sans exchangeId ou utilisateur
    if (!exchangeId || !user) return;

    // Étape 1: Se connecter au serveur WebSocket
    socketService.connect();

    // Étape 2: Rejoindre la "room" (salle) spécifique à cet échange
    // Les rooms permettent d'envoyer des messages uniquement aux participants de cet échange
    socketService.connectToExchange(exchangeId);

    // ============================================
    // GESTIONNAIRE D'ÉVÉNEMENT: Nouveau message reçu
    // ============================================
    /**
     * Cette fonction est appelée automatiquement quand un nouveau message arrive via WebSocket
     * @param message - Le nouveau message reçu du serveur
     */
    const handleNewMessage = (message: ChatMessage) => {
      // Appeler la fonction callback passée en prop (si elle existe)
      // Le ?. est l'opérateur de chaînage optionnel: on appelle la fonction seulement si elle existe
      onNewMessage?.(message);

      // Retirer le message optimiste correspondant de la liste
      // On filtre la liste pour enlever le message temporaire qui avait été affiché
      // Le message réel du serveur va maintenant le remplacer
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== message.id));
    };

    // ============================================
    // GESTIONNAIRE D'ÉVÉNEMENT: Indicateur "en train d'écrire"
    // ============================================
    /**
     * Cette fonction est appelée quand l'autre utilisateur commence ou arrête d'écrire
     * @param data - Contient l'ID de l'échange, l'ID de l'utilisateur, et si il/elle est en train d'écrire
     */
    const handleTyping = (data: {
      exchangeId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      // Vérifications de sécurité:
      // - Le message doit concerner notre échange actuel
      // - On ignore les événements de frappe de nous-mêmes
      if (data.exchangeId !== exchangeId || data.userId === user.id) return;

      // Mettre à jour la liste des utilisateurs en train d'écrire
      setTypingUsers((prev) => {
        // Créer une nouvelle copie du Set (on ne modifie jamais directement l'état)
        const newSet = new Set(prev);
        if (data.isTyping) {
          // Ajouter l'utilisateur à la liste
          newSet.add(data.userId);
        } else {
          // Retirer l'utilisateur de la liste
          newSet.delete(data.userId);
        }
        return newSet;
      });
    };

    // ============================================
    // ENREGISTREMENT DES ÉCOUTEURS D'ÉVÉNEMENTS
    // ============================================
    // On enregistre nos fonctions pour qu'elles soient appelées quand les événements arrivent
    socketService.onMessage(handleNewMessage);
    socketService.onTyping(handleTyping);

    // ============================================
    // NETTOYAGE (CLEANUP) QUAND LE COMPOSANT SE DÉMONTE
    // ============================================
    /**
     * La fonction retournée par useEffect s'exécute quand le composant est démonté
     * C'est ici qu'on nettoie pour éviter les fuites mémoire:
     * - On retire les écouteurs d'événements
     * - On quitte la room WebSocket
     */
    return () => {
      socketService.offMessage(handleNewMessage);
      socketService.offTyping(handleTyping);
      socketService.leaveExchange();
    };
  }, [exchangeId, user, onNewMessage]); // Réexécuter si exchangeId, user ou onNewMessage change

  // ============================================
  // FONCTION POUR ENVOYER UN MESSAGE
  // ============================================

  /**
   * Fonction appelée quand l'utilisateur clique sur le bouton "Envoyer" ou appuie sur Entrée
   * async signifie que cette fonction peut contenir des opérations asynchrones (qui prennent du temps)
   */
  const handleSendMessage = async () => {
    // Vérifications de sécurité:
    // - trim() enlève les espaces au début et à la fin
    // - On ne peut pas envoyer un message vide ou sans être connecté
    if (!newMessage.trim() || !user) return;

    // Sauvegarder le contenu du message et vider le champ de saisie
    const messageContent = newMessage.trim();
    setNewMessage(''); // Vider le champ de texte immédiatement

    // ============================================
    // CRÉATION D'UN MESSAGE OPTIMISTE
    // ============================================
    /**
     * Un message optimiste est un message temporaire affiché immédiatement
     * avant que le serveur confirme sa réception. Cela donne l'impression
     * que l'application est très rapide et réactive.
     *
     * Date.now() génère un ID unique temporaire basé sur le timestamp actuel
     * toISOString() convertit la date en format texte standard (ex: "2024-01-20T12:00:00.000Z")
     */
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`, // ID temporaire qui sera remplacé par l'ID réel du serveur
      exchangeId, // L'ID de l'échange auquel ce message appartient
      senderId: user.id, // L'ID de l'utilisateur qui envoie
      content: messageContent, // Le texte du message
      createdAt: new Date().toISOString(), // La date/heure de création
      sender: user, // Les informations complètes de l'expéditeur
    };

    // Ajouter le message optimiste à la liste pour l'afficher immédiatement
    // [...prev, optimisticMessage] crée un nouveau tableau avec tous les anciens messages + le nouveau
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);

    // ============================================
    // ENVOI DU MESSAGE AU SERVEUR VIA WEBSOCKET
    // ============================================
    try {
      // Envoyer le message au serveur via WebSocket
      // Cette fonction est asynchrone mais on n'a pas besoin d'attendre sa réponse
      socketService.sendMessage(exchangeId, messageContent);
    } catch (error) {
      // Si une erreur se produit, afficher un message d'erreur à l'utilisateur
      toast.error("Erreur lors de l'envoi du message");

      // Retirer le message optimiste de l'affichage car l'envoi a échoué
      setOptimisticMessages((prev) =>
        prev.filter((m) => m.id !== optimisticMessage.id)
      );
    }
  };

  // ============================================
  // GESTION DE LA TOUCHE ENTRÉE POUR ENVOYER
  // ============================================

  /**
   * Fonction appelée quand l'utilisateur appuie sur une touche dans le champ de texte
   * @param e - L'événement clavier qui contient des informations sur la touche pressée
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Si l'utilisateur appuie sur Entrée SANS maintenir Shift:
    // - Envoyer le message
    // Si l'utilisateur appuie sur Entrée EN MAINTENANT Shift:
    // - Aller à la ligne (comportement par défaut du textarea)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Empêcher le comportement par défaut (aller à la ligne)
      handleSendMessage(); // Envoyer le message
    }
  };

  // ============================================
  // GESTION DE L'INDICATEUR "EN TRAIN D'ÉCRIRE"
  // ============================================

  /**
   * Fonction appelée chaque fois que l'utilisateur tape quelque chose
   * Elle envoie un signal à l'autre utilisateur pour lui dire qu'on est en train d'écrire
   */
  const handleTyping = () => {
    // Vérification de sécurité
    if (!user) return;

    // Marquer que nous sommes en train d'écrire
    setIsTyping(true);

    // Envoyer le signal "en train d'écrire" au serveur via WebSocket
    // Le serveur le transmettra ensuite à l'autre utilisateur
    socketService.emitTyping(exchangeId);

    // ============================================
    // GESTION DU TIMER POUR ARRÊTER L'INDICATEUR
    // ============================================
    /**
     * On utilise un timer pour arrêter l'indicateur "en train d'écrire" après 2 secondes
     * d'inactivité. Si l'utilisateur continue à taper, on réinitialise le timer.
     */

    // Si un timer existe déjà, on l'annule pour le remplacer par un nouveau
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Créer un nouveau timer qui s'exécutera dans 2 secondes
    // Après 2 secondes sans frappe, on arrêtera l'indicateur "en train d'écrire"
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000); // 2000 millisecondes = 2 secondes
  };

  // ============================================
  // COMBINAISON ET TRI DES MESSAGES
  // ============================================

  /**
   * On combine les messages reçus du serveur avec les messages optimistes
   * puis on les trie par date pour les afficher dans le bon ordre chronologique
   *
   * [...messages, ...optimisticMessages]: combine les deux tableaux en un seul
   * .sort(): trie les messages par date (du plus ancien au plus récent)
   */
  const allMessages = [...messages, ...optimisticMessages].sort((a, b) => {
    // Convertir les dates en nombres (timestamps) pour pouvoir les comparer
    // || 0 signifie: si createdAt est vide/null, utiliser 0 comme valeur par défaut
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();

    // dateA - dateB retourne:
    // - Un nombre négatif si dateA est avant dateB (a vient avant b)
    // - Un nombre positif si dateA est après dateB (a vient après b)
    // - 0 si les dates sont égales
    // Cela permet de trier du plus ancien au plus récent
    return dateA - dateB;
  });

  // ============================================
  // RENDU DU COMPOSANT (JSX)
  // ============================================

  /**
   * Le return contient le JSX (JavaScript XML) qui définit l'apparence du composant
   * C'est ce qui sera affiché à l'écran
   */
  return (
    // Card est un composant de carte qui entoure tout le chat
    <Card className="flex h-full flex-col">
      {/* En-tête de la carte avec le titre */}
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat avec {otherUser.displayName}
        </CardTitle>
      </CardHeader>

      {/* Contenu principal de la carte */}
      <CardContent className="flex flex-1 flex-col p-0">
        {/* ============================================
            ZONE D'AFFICHAGE DES MESSAGES
            ============================================ */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {/* Vérification: Y a-t-il des messages à afficher? */}
          {allMessages.length === 0 ? (
            // Si aucun message: afficher un message d'état vide
            <div className="py-8 text-center text-muted-foreground">
              <MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Aucun message pour le moment</p>
              <p className="text-sm">
                Envoyez le premier message pour commencer la conversation
              </p>
            </div>
          ) : (
            // Si il y a des messages: les afficher
            <>
              {/*
                map() parcourt chaque message et crée un composant MessageBubble pour chacun
                key={message.id} est obligatoire pour que React puisse identifier chaque élément
                C'est important pour les performances et la gestion des mises à jour
              */}
              {allMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  sender={
                    // Déterminer qui est l'expéditeur du message
                    // Si le message a déjà un sender, l'utiliser
                    // Sinon, vérifier si c'est nous ou l'autre utilisateur
                    message.sender ||
                    (message.senderId === user?.id ? user : otherUser)
                  }
                  isOwn={message.senderId === user?.id} // Est-ce notre propre message?
                  isOptimistic={optimisticMessages.some(
                    // Vérifier si ce message est un message optimiste
                    // (pour l'afficher avec une opacité réduite)
                    (m) => m.id === message.id
                  )}
                />
              ))}

              {/* ============================================
                  INDICATEUR "EN TRAIN D'ÉCRIRE"
                  ============================================ */}
              {/*
                AnimatePresence permet d'animer l'apparition/disparition de l'indicateur
                typingUsers.size > 0 vérifie s'il y a au moins un utilisateur en train d'écrire
              */}
              <AnimatePresence>
                {typingUsers.size > 0 && <TypingIndicator user={otherUser} />}
              </AnimatePresence>
            </>
          )}
          {/*
            Élément invisible en bas de la liste utilisé pour le scroll automatique
            messagesEndRef pointe vers cet élément
          */}
          <div ref={messagesEndRef} />
        </div>

        {/* ============================================
            ZONE DE SAISIE DU MESSAGE
            ============================================ */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            {/* Champ de texte pour saisir le message */}
            <Input
              value={newMessage} // La valeur actuelle du champ (contrôlée par React)
              onChange={(e) => {
                // Quand l'utilisateur tape, mettre à jour l'état et envoyer le signal "en train d'écrire"
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress} // Gérer la touche Entrée
              placeholder="Tapez votre message..."
              className="flex-1" // Prendre tout l'espace disponible
              disabled={!user} // Désactiver si l'utilisateur n'est pas connecté
            />
            {/* Bouton d'envoi */}
            <Button
              onClick={handleSendMessage} // Fonction appelée au clic
              disabled={!newMessage.trim() || !user} // Désactiver si le champ est vide ou si pas connecté
              size="icon" // Taille pour une icône uniquement
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
