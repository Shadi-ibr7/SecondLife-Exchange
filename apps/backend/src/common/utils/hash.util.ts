/**
 * FICHIER: hash.util.ts
 *
 * DESCRIPTION:
 * Ce fichier contient des fonctions utilitaires pour générer des hashs SHA256.
 * Les hashs sont utilisés pour:
 * - Déduplication des suggestions (éviter les doublons)
 * - Identification unique de prompts IA
 * - Génération d'identifiants basés sur le contenu
 *
 * ALGORITHME:
 * - Utilise SHA256 (Secure Hash Algorithm 256 bits)
 * - Fonction unidirectionnelle (impossible de retrouver l'original depuis le hash)
 * - Même entrée = même hash (déterministe)
 */

// Import de la fonction createHash du module crypto de Node.js
import { createHash } from 'crypto';

/**
 * CLASSE: HashUtil
 *
 * Classe utilitaire avec des méthodes statiques pour générer des hashs.
 * Toutes les méthodes sont statiques, donc on peut les appeler sans instancier la classe.
 */
export class HashUtil {
  /**
   * MÉTHODE: sha256
   *
   * Génère un hash SHA256 d'une chaîne de caractères.
   *
   * @param input - La chaîne à hasher
   * @returns Le hash en format hexadécimal (64 caractères)
   *
   * Exemple:
   * sha256("hello") -> "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
   */
  static sha256(input: string): string {
    // createHash('sha256'): crée un objet hash avec l'algorithme SHA256
    // .update(input): ajoute les données à hasher
    // .digest('hex'): génère le hash final en format hexadécimal
    return createHash('sha256').update(input).digest('hex');
  }

  /**
   * MÉTHODE: canonicalHash
   *
   * Génère un hash canonique pour la déduplication des suggestions d'objets.
   * Normalise les données (minuscules, trim) avant de hasher pour éviter les doublons
   * dus à des différences de casse ou d'espaces.
   *
   * Format normalisé: "name+country+era+category"
   *
   * @param name - Nom de l'objet
   * @param country - Pays d'origine
   * @param era - Époque (peut être null)
   * @param category - Catégorie de l'objet
   * @returns Hash SHA256 de la chaîne normalisée
   *
   * Exemple:
   * canonicalHash("Vase", "France", "1950s", "Décoration")
   * -> hash de "vase+france+1950s+décoration"
   */
  static canonicalHash(
    name: string,
    country: string,
    era: string | null,
    category: string,
  ): string {
    // Normaliser les données: minuscules et suppression des espaces
    const normalized = [
      name.toLowerCase().trim(), // Nom en minuscules
      country.toLowerCase().trim(), // Pays en minuscules
      era ? era.toLowerCase().trim() : '', // Époque en minuscules (ou chaîne vide si null)
      category.toLowerCase().trim(), // Catégorie en minuscules
    ].join('+'); // Joindre avec "+" comme séparateur

    // Générer le hash de la chaîne normalisée
    return this.sha256(normalized);
  }

  /**
   * MÉTHODE: promptHash
   *
   * Génère un hash pour un prompt IA.
   * Utile pour identifier de manière unique un prompt et éviter de régénérer
   * le même contenu plusieurs fois.
   *
   * @param prompt - Le prompt texte à hasher
   * @returns Hash SHA256 du prompt
   *
   * Exemple:
   * promptHash("Génère des suggestions d'objets vintage français")
   * -> hash unique pour ce prompt
   */
  static promptHash(prompt: string): string {
    return this.sha256(prompt);
  }
}
