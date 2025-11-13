import apiClient from './api';
import { UploadSignature, PhotoMeta } from '@/types';

export const uploadApi = {
  /**
   * Récupère la signature Cloudinary pour l'upload
   */
  async getUploadSignature(payload: {
    folder: string;
    publicId?: string;
  }): Promise<UploadSignature> {
    // Utiliser l'endpoint items pour les uploads (il gère tous les types)
    const response = await apiClient.client.post('/items/uploads/signature', {
      folder: payload.folder,
      maxBytes: 3000000,
    });
    return response.data;
  },

  /**
   * Upload direct vers Cloudinary
   */
  async uploadToCloudinary(
    file: File,
    signature: UploadSignature,
    cloudName: string
  ): Promise<PhotoMeta> {
    if (!cloudName) {
      throw new Error('Cloudinary cloud name non configuré');
    }

    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    if (!apiKey) {
      throw new Error('Cloudinary API key non configurée');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(signature.timestamp));
    formData.append('signature', signature.signature);

    // IMPORTANT: La signature Cloudinary est calculée SEULEMENT avec ces paramètres:
    // folder, public_id, transformation, timestamp
    // allowed_formats et max_bytes sont des paramètres de validation côté serveur
    // et ne doivent PAS être envoyés à Cloudinary

    // folder
    if (signature.folder) {
      formData.append('folder', signature.folder);
    }

    // public_id
    if (signature.public_id) {
      formData.append('public_id', signature.public_id);
    }

    // transformation
    if (signature.transformation) {
      formData.append('transformation', signature.transformation);
    }

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // Si la réponse n'est pas du JSON, on utilise le texte
          const text = await response.text();
          errorData = { message: text || response.statusText };
        }

        console.error('Erreur Cloudinary:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        throw new Error(
          errorData.error?.message ||
            errorData.message ||
            `Erreur Cloudinary (${response.status}): ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.secure_url) {
        console.error('Réponse Cloudinary invalide:', data);
        throw new Error('Réponse Cloudinary invalide: URL manquante');
      }

      return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
      };
    } catch (error: any) {
      console.error("Erreur lors de l'upload vers Cloudinary:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erreur lors de l'upload vers Cloudinary");
    }
  },
};
