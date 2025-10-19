import { createHash } from 'crypto';

/**
 * Utilitaires pour le hachage
 */
export class HashUtil {
  /**
   * Génère un hash SHA256 d'une chaîne
   */
  static sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  /**
   * Génère un hash canonique pour la déduplication des suggestions
   * Format: name+country+era+category (normalisé)
   */
  static canonicalHash(
    name: string,
    country: string,
    era: string | null,
    category: string,
  ): string {
    const normalized = [
      name.toLowerCase().trim(),
      country.toLowerCase().trim(),
      era ? era.toLowerCase().trim() : '',
      category.toLowerCase().trim(),
    ].join('+');

    return this.sha256(normalized);
  }

  /**
   * Génère un hash pour un prompt IA
   */
  static promptHash(prompt: string): string {
    return this.sha256(prompt);
  }
}
