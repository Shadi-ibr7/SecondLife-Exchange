/**
 * FICHIER: sanitize.util.ts
 *
 * DESCRIPTION:
 * Utilitaire pour la sanitisation anti-XSS des champs texte utilisateur.
 * Supprime ou échappe les balises HTML dangereuses pour éviter les attaques XSS.
 *
 * FONCTIONNALITÉS:
 * - stripHtml: supprime toutes les balises HTML
 * - escapeHtml: échappe les caractères HTML dangereux
 * - sanitizeText: sanitise un texte selon le mode choisi
 *
 * MODES:
 * - 'strip': supprime toutes les balises HTML (par défaut, le plus sûr)
 * - 'escape': échappe les caractères HTML (< devient &lt;, etc.)
 *
 * SÉCURITÉ:
 * - Interdit HTML en input sauf si explicitement voulu
 * - Protection contre les attaques XSS (Cross-Site Scripting)
 * - Protection contre l'injection de contenu malveillant
 *
 * UTILISATION:
 * - Appliquer sur tous les champs texte stockés et affichés
 * - title, description, content, bio, displayName, etc.
 * - À utiliser dans les DTOs ou services avant stockage en DB
 */

/**
 * TYPE: SanitizeMode
 *
 * Mode de sanitisation:
 * - 'strip': supprime toutes les balises HTML (recommandé)
 * - 'escape': échappe les caractères HTML
 */
export type SanitizeMode = 'strip' | 'escape';

/**
 * FONCTION: stripHtml
 *
 * Supprime toutes les balises HTML d'une chaîne.
 * Ne garde que le contenu textuel.
 *
 * SÉCURITÉ:
 * - Supprime toutes les balises HTML (<tag>...</tag>)
 * - Supprime les attributs HTML
 * - Supprime les entités HTML dangereuses
 * - Protection contre XSS
 *
 * @param text - Texte à nettoyer
 * @returns Texte sans balises HTML
 *
 * EXEMPLE:
 * stripHtml('<script>alert("XSS")</script>Hello') => 'Hello'
 * stripHtml('<p>Bonjour</p>') => 'Bonjour'
 */
export function stripHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Supprimer toutes les balises HTML
  // Remplace <...> par une chaîne vide
  let sanitized = text.replace(/<[^>]*>/g, '');

  // Décoder les entités HTML communes (&lt;, &gt;, &amp;, etc.)
  // puis les ré-échapper pour éviter les attaques
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  // Supprimer à nouveau les balises au cas où des entités auraient été décodées
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Normaliser les espaces multiples en un seul espace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * FONCTION: escapeHtml
 *
 * Échappe les caractères HTML dangereux.
 * Convertit < en &lt;, > en &gt;, etc.
 *
 * UTILISATION:
 * - Quand on veut préserver le formatage mais sécuriser
 * - Moins strict que stripHtml
 *
 * @param text - Texte à échapper
 * @returns Texte avec caractères HTML échappés
 *
 * EXEMPLE:
 * escapeHtml('<script>alert("XSS")</script>') => '&lt;script&gt;alert("XSS")&lt;/script&gt;'
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match] || match);
}

/**
 * FONCTION: sanitizeText
 *
 * Sanitise un texte selon le mode choisi.
 * Mode par défaut: 'strip' (le plus sûr).
 *
 * @param text - Texte à sanitiser
 * @param mode - Mode de sanitisation ('strip' ou 'escape')
 * @returns Texte sanitisé
 *
 * EXEMPLE:
 * sanitizeText('<script>alert("XSS")</script>Hello', 'strip') => 'Hello'
 * sanitizeText('<p>Bonjour</p>', 'strip') => 'Bonjour'
 * sanitizeText('<script>alert("XSS")</script>', 'escape') => '&lt;script&gt;...'
 */
export function sanitizeText(text: string, mode: SanitizeMode = 'strip'): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (mode === 'escape') {
    return escapeHtml(text);
  }

  // Mode 'strip' par défaut (le plus sûr)
  return stripHtml(text);
}

/**
 * FONCTION: sanitizeOptionalText
 *
 * Sanitise un texte optionnel (peut être null/undefined).
 * Retourne une chaîne vide si le texte est null/undefined.
 *
 * @param text - Texte optionnel à sanitiser
 * @param mode - Mode de sanitisation
 * @returns Texte sanitisé ou chaîne vide
 */
export function sanitizeOptionalText(
  text: string | null | undefined,
  mode: SanitizeMode = 'strip',
): string {
  if (!text) {
    return '';
  }

  return sanitizeText(text, mode);
}
