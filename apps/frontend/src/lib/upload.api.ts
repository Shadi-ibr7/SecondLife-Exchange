/**
 * FICHIER: lib/upload.api.ts
 *
 * DESCRIPTION:
 * Module API pour gérer les uploads d'images vers Cloudinary.
 * Il encapsule la logique de récupération de signatures sécurisées et d'upload direct
 * vers Cloudinary. Les signatures sont générées côté serveur pour garantir la sécurité.
 *
 * FONCTIONNALITÉS PRINCIPALES:
 * - Récupération de signatures Cloudinary sécurisées depuis le serveur
 * - Upload direct vers Cloudinary (pas via notre serveur) pour optimiser les performances
 * - Validation des paramètres d'upload (taille, format, etc.)
 * - Gestion d'erreurs avec messages clairs
 *
 * SÉCURITÉ:
 * - Les signatures sont générées côté serveur avec la clé secrète Cloudinary
 * - Validation stricte des paramètres d'upload (taille max, format, etc.)
 * - Upload direct vers Cloudinary (pas de stockage temporaire sur notre serveur)
 *
 * ARCHITECTURE:
 * - Utilise apiClient pour récupérer les signatures
 * - Utilise fetch() natif pour l'upload direct vers Cloudinary
 * - Gestion d'erreurs avec messages détaillés
 */

// Import du client API centralisé pour les appels HTTP
import apiClient from './api';
// Import des types TypeScript pour garantir la sécurité des types
import { UploadSignature, PhotoMeta } from '@/types';

/**
 * OBJET: uploadApi
 *
 * Objet contenant toutes les méthodes pour gérer les uploads vers Cloudinary.
 * Toutes les méthodes sont asynchrones et retournent des Promises.
 */
export const uploadApi = {
  /**
   * MÉTHODE: getUploadSignature
   *
   * Récupère une signature Cloudinary sécurisée depuis notre serveur.
   * Cette signature permet d'autoriser un upload direct vers Cloudinary
   * sans exposer la clé secrète côté client.
   *
   * FLUX:
   * 1. Appeler l'endpoint POST /items/uploads/signature avec le dossier cible
   * 2. Le serveur génère une signature signée avec la clé secrète Cloudinary
   * 3. Retourner la signature avec les paramètres nécessaires (timestamp, etc.)
   *
   * SÉCURITÉ:
   * - La signature est générée côté serveur (clé secrète jamais exposée)
   * - La signature inclut un timestamp pour éviter la réutilisation
   * - Validation de la taille maximale (3MB) côté serveur
   *
   * @param payload - Paramètres pour la signature (dossier, publicId optionnel)
   * @returns Promise qui se résout avec la signature Cloudinary
   */
  async getUploadSignature(payload: {
    folder: string; // Dossier Cloudinary où stocker l'image (ex: 'profiles', 'items')
    publicId?: string; // ID public optionnel pour remplacer une image existante
  }): Promise<UploadSignature> {
    /**
     * Appeler l'endpoint POST /items/uploads/signature
     * Cet endpoint génère une signature sécurisée côté serveur
     *
     * NOTE: On utilise l'endpoint items car il gère tous les types d'uploads
     * (profiles, items, etc.) de manière centralisée
     */
    const response = await apiClient.client.post('/items/uploads/signature', {
      folder: payload.folder, // Dossier Cloudinary où stocker l'image
      maxBytes: 3000000, // Taille maximale: 3MB (3 * 1024 * 1024 octets)
    });

    /**
     * Retourner la signature générée par le serveur
     * La signature contient:
     * - signature: la signature HMAC calculée avec la clé secrète
     * - timestamp: timestamp Unix pour éviter la réutilisation
     * - folder: le dossier où stocker l'image
     * - public_id: ID public optionnel
     * - transformation: transformations optionnelles (redimensionnement, etc.)
     */
    return response.data;
  },

  /**
   * MÉTHODE: uploadToCloudinary
   *
   * Upload directement un fichier vers Cloudinary en utilisant une signature sécurisée.
   * L'upload se fait directement depuis le navigateur vers Cloudinary (pas via notre serveur),
   * ce qui optimise les performances et réduit la charge sur notre serveur.
   *
   * FLUX:
   * 1. Vérifier que les paramètres requis sont configurés (cloudName, apiKey)
   * 2. Créer un FormData avec le fichier et les paramètres de signature
   * 3. Envoyer une requête POST vers l'API Cloudinary
   * 4. Vérifier la réponse et extraire les métadonnées de l'image
   * 5. Retourner les métadonnées (URL, dimensions, etc.)
   *
   * SÉCURITÉ:
   * - La signature est incluse dans la requête pour prouver que l'upload est autorisé
   * - Seuls les paramètres signés sont envoyés à Cloudinary
   * - Validation stricte de la réponse Cloudinary
   *
   * @param file - Le fichier image à uploader
   * @param signature - La signature sécurisée générée par le serveur
   * @param cloudName - Le nom du compte Cloudinary (variable d'environnement publique)
   * @returns Promise qui se résout avec les métadonnées de l'image uploadée
   */
  async uploadToCloudinary(
    file: File,
    signature: UploadSignature,
    cloudName: string
  ): Promise<PhotoMeta> {
    /**
     * Vérifier que le nom du compte Cloudinary est configuré
     * Si ce n'est pas le cas, lancer une erreur explicite
     */
    if (!cloudName) {
      throw new Error('Cloudinary cloud name non configuré');
    }

    /**
     * Récupérer la clé API Cloudinary depuis les variables d'environnement
     * Cette clé est publique (NEXT_PUBLIC_) car nécessaire côté client pour l'upload
     * La sécurité est garantie par la signature, pas par la clé API
     */
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    if (!apiKey) {
      throw new Error('Cloudinary API key non configurée');
    }

    /**
     * Créer un FormData pour envoyer le fichier et les paramètres à Cloudinary
     * FormData est l'interface standard pour envoyer des fichiers via HTTP
     */
    const formData = new FormData();

    /**
     * Ajouter le fichier à uploader
     * 'file' est le nom du champ attendu par Cloudinary
     */
    formData.append('file', file);

    /**
     * Ajouter la clé API Cloudinary
     * 'api_key' est requis par Cloudinary pour identifier le compte
     */
    formData.append('api_key', apiKey);

    /**
     * Ajouter le timestamp de la signature
     * Le timestamp est utilisé par Cloudinary pour valider la signature
     * Il doit correspondre exactement au timestamp utilisé pour générer la signature
     */
    formData.append('timestamp', String(signature.timestamp));

    /**
     * Ajouter la signature HMAC
     * La signature prouve que l'upload est autorisé par notre serveur
     * Elle est calculée avec la clé secrète Cloudinary (jamais exposée côté client)
     */
    formData.append('signature', signature.signature);

    /**
     * IMPORTANT: La signature Cloudinary est calculée SEULEMENT avec ces paramètres:
     * - folder: dossier où stocker l'image
     * - public_id: ID public de l'image (optionnel)
     * - transformation: transformations à appliquer (optionnel)
     * - timestamp: timestamp Unix
     *
     * Les paramètres suivants sont des paramètres de validation côté serveur
     * et ne doivent PAS être envoyés à Cloudinary:
     * - allowed_formats: formats autorisés (validation serveur uniquement)
     * - max_bytes: taille maximale (validation serveur uniquement)
     */

    /**
     * Ajouter le dossier si spécifié dans la signature
     * Le dossier détermine où l'image sera stockée dans Cloudinary
     */
    if (signature.folder) {
      formData.append('folder', signature.folder);
    }

    /**
     * Ajouter l'ID public si spécifié dans la signature
     * L'ID public permet de remplacer une image existante ou de nommer l'image
     */
    if (signature.public_id) {
      formData.append('public_id', signature.public_id);
    }

    /**
     * Ajouter les transformations si spécifiées dans la signature
     * Les transformations permettent de redimensionner, recadrer, etc. l'image
     * Format: "w_500,h_500,c_fill" (largeur 500px, hauteur 500px, remplissage)
     */
    if (signature.transformation) {
      formData.append('transformation', signature.transformation);
    }

    /**
     * Envoyer la requête POST vers l'API Cloudinary
     * On utilise fetch() natif car c'est plus simple pour les uploads de fichiers
     * que d'utiliser axios (qui nécessite des configurations supplémentaires)
     */
    try {
      /**
       * Construire l'URL de l'API Cloudinary
       * Format: https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
       * v1_1: version de l'API
       * {cloud_name}: nom du compte Cloudinary
       * image/upload: endpoint pour uploader une image
       */
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST', // Méthode HTTP POST pour envoyer le fichier
          body: formData, // Corps de la requête (FormData avec le fichier et les paramètres)
        }
      );

      /**
       * Vérifier si la réponse est OK (status 200-299)
       * Si ce n'est pas le cas, extraire les détails de l'erreur
       */
      if (!response.ok) {
        /**
         * Essayer de parser la réponse en JSON pour obtenir les détails de l'erreur
         * Cloudinary retourne généralement une erreur JSON avec un message détaillé
         */
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          /**
           * Si la réponse n'est pas du JSON (cas rare), utiliser le texte brut
           * ou le statusText comme message d'erreur
           */
          const text = await response.text();
          errorData = { message: text || response.statusText };
        }

        /**
         * Logger les détails de l'erreur pour le debug
         * Cela aide à comprendre pourquoi l'upload a échoué
         */
        console.error('Erreur Cloudinary:', {
          status: response.status, // Code de statut HTTP (ex: 400, 401, 500)
          statusText: response.statusText, // Texte du statut (ex: "Bad Request")
          error: errorData, // Détails de l'erreur retournés par Cloudinary
        });

        /**
         * Lancer une erreur avec un message clair
         * On essaie d'extraire le message d'erreur de la réponse Cloudinary
         * Si ce n'est pas possible, on utilise un message générique avec le code de statut
         */
        throw new Error(
          errorData.error?.message || // Message d'erreur Cloudinary (ex: "Invalid signature")
            errorData.message || // Message d'erreur alternatif
            `Erreur Cloudinary (${response.status}): ${response.statusText}` // Message générique
        );
      }

      /**
       * Parser la réponse JSON de Cloudinary
       * La réponse contient les métadonnées de l'image uploadée
       */
      const data = await response.json();

      /**
       * Vérifier que la réponse contient l'URL sécurisée de l'image
       * secure_url est l'URL HTTPS de l'image uploadée
       * Si elle est absente, c'est une erreur (réponse invalide)
       */
      if (!data.secure_url) {
        console.error('Réponse Cloudinary invalide:', data);
        throw new Error('Réponse Cloudinary invalide: URL manquante');
      }

      /**
       * Retourner les métadonnées de l'image uploadée
       * Ces métadonnées sont utilisées pour afficher l'image et la stocker en base de données
       */
      return {
        url: data.secure_url, // URL HTTPS de l'image (ex: "https://res.cloudinary.com/...")
        publicId: data.public_id, // ID public de l'image dans Cloudinary (pour suppression/modification)
        width: data.width, // Largeur de l'image en pixels
        height: data.height, // Hauteur de l'image en pixels
      };
    } catch (error: any) {
      /**
       * GESTION D'ERREUR GLOBALE
       *
       * Si l'erreur est déjà une instance d'Error (ex: notre throw new Error),
       * la propager telle quelle pour préserver le message d'erreur
       * Sinon, créer une nouvelle erreur avec un message générique
       */
      console.error("Erreur lors de l'upload vers Cloudinary:", error);
      if (error instanceof Error) {
        throw error; // Propager l'erreur existante (message détaillé préservé)
      }
      throw new Error("Erreur lors de l'upload vers Cloudinary"); // Nouvelle erreur générique
    }
  },
};
