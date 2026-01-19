/**
 * FICHIER: admin-action-type.enum.ts
 *
 * DESCRIPTION:
 * Enum pour tous les types d'actions admin auditées.
 * Centralise les valeurs d'actions pour éviter les typos et assurer la cohérence.
 */

export enum AdminActionType {
  // ============================================
  // AUTHENTICATION
  // ============================================
  ADMIN_LOGIN_SUCCESS = 'ADMIN_LOGIN_SUCCESS',
  ADMIN_LOGIN_FAIL = 'ADMIN_LOGIN_FAIL',
  ADMIN_LOGIN_LOCKED = 'ADMIN_LOGIN_LOCKED',
  ADMIN_LOGOUT = 'ADMIN_LOGOUT',

  // ============================================
  // GESTION UTILISATEURS
  // ============================================
  BAN_USER = 'BAN_USER',
  UNBAN_USER = 'UNBAN_USER',
  CHANGE_USER_ROLE = 'CHANGE_USER_ROLE',
  ASSIGN_ADMIN_ROLE = 'ASSIGN_ADMIN_ROLE',

  // ============================================
  // GESTION ITEMS
  // ============================================
  DELETE_ITEM = 'DELETE_ITEM',
  ARCHIVE_ITEM = 'ARCHIVE_ITEM',

  // ============================================
  // GESTION ÉCHANGES
  // ============================================
  DELETE_EXCHANGE = 'DELETE_EXCHANGE',

  // ============================================
  // GESTION SIGNALEMENTS
  // ============================================
  RESOLVE_REPORT = 'RESOLVE_REPORT',
  DELETE_REPORT = 'DELETE_REPORT',

  // ============================================
  // GESTION THÈMES
  // ============================================
  CREATE_THEME = 'CREATE_THEME',
  UPDATE_THEME = 'UPDATE_THEME',
  ACTIVATE_THEME = 'ACTIVATE_THEME',
  DELETE_THEME = 'DELETE_THEME',
  GENERATE_THEME = 'GENERATE_THEME',
  GENERATE_THEME_SUGGESTIONS = 'GENERATE_THEME_SUGGESTIONS',
  GENERATE_MONTHLY_THEMES = 'GENERATE_MONTHLY_THEMES',

  // ============================================
  // GESTION CONTENU ÉCO
  // ============================================
  CREATE_ECO_CONTENT = 'CREATE_ECO_CONTENT',
  UPDATE_ECO_CONTENT = 'UPDATE_ECO_CONTENT',
  PUBLISH_ECO_CONTENT = 'PUBLISH_ECO_CONTENT',
  UNPUBLISH_ECO_CONTENT = 'UNPUBLISH_ECO_CONTENT',
  DELETE_ECO_CONTENT = 'DELETE_ECO_CONTENT',

  // ============================================
  // GESTION COMMUNAUTÉ
  // ============================================
  DELETE_THREAD = 'DELETE_THREAD',
  DELETE_POST = 'DELETE_POST',

  // ============================================
  // PARAMÈTRES SÉCURITÉ
  // ============================================
  ENABLE_2FA = 'ENABLE_2FA',
  DISABLE_2FA = 'DISABLE_2FA',
}
