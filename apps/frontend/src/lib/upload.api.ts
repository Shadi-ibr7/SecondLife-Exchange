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
    const response = await apiClient.client.post('/uploads/signature', payload);
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
    const formData = new FormData();
    formData.append('file', file);
    formData.append(
      'api_key',
      process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || ''
    );
    formData.append('timestamp', signature.timestamp);
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Erreur lors de l'upload vers Cloudinary");
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
    };
  },
};
