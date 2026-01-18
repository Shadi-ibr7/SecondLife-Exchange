/**
 * FICHIER: encryption.utils.ts
 *
 * DESCRIPTION:
 * Utilitaires pour le chiffrement/déchiffrement de données sensibles
 * (utilisé pour les secrets 2FA TOTP)
 *
 * SÉCURITÉ:
 * - Utilise AES-256-GCM (authenticated encryption)
 * - IV aléatoire pour chaque chiffrement
 * - Authentification intégrée pour détecter la manipulation
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // 512 bits
const TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Génère une clé de dérivation depuis APP_ENCRYPTION_KEY
 * Utilise PBKDF2 pour dériver une clé de 32 bytes
 */
function deriveKey(encryptionKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(encryptionKey, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Chiffre un texte avec AES-256-GCM
 *
 * @param text - Texte à chiffrer
 * @param encryptionKey - Clé de chiffrement (APP_ENCRYPTION_KEY)
 * @returns Chaîne au format: salt:iv:tag:encryptedData (tous en hex)
 *
 * @throws Error si encryptionKey n'est pas défini
 */
export function encrypt(text: string, encryptionKey: string): string {
  if (!encryptionKey || encryptionKey.length < 32) {
    throw new Error(
      'APP_ENCRYPTION_KEY requis et doit faire au moins 32 caractères',
    );
  }

  // Générer salt et IV aléatoires
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Dériver la clé depuis le salt
  const key = deriveKey(encryptionKey, salt);

  // Créer le cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Chiffrer
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Récupérer l'authentification tag
  const tag = cipher.getAuthTag();

  // Retourner: salt:iv:tag:encrypted (tous en hex)
  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Déchiffre un texte chiffré avec AES-256-GCM
 *
 * @param encryptedData - Données chiffrées au format: salt:iv:tag:encryptedData
 * @param encryptionKey - Clé de chiffrement (APP_ENCRYPTION_KEY)
 * @returns Texte déchiffré
 *
 * @throws Error si le format est invalide ou si le déchiffrement échoue
 */
export function decrypt(encryptedData: string, encryptionKey: string): string {
  if (!encryptionKey || encryptionKey.length < 32) {
    throw new Error(
      'APP_ENCRYPTION_KEY requis et doit faire au moins 32 caractères',
    );
  }

  try {
    // Parser le format: salt:iv:tag:encrypted
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Format de données chiffrées invalide');
    }

    const [saltHex, ivHex, tagHex, encryptedHex] = parts;

    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    // Dériver la clé depuis le salt
    const key = deriveKey(encryptionKey, salt);

    // Créer le decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Déchiffrer
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(
      `Échec du déchiffrement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    );
  }
}
