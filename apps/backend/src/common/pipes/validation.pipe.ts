/**
 * FICHIER: validation.pipe.ts
 *
 * DESCRIPTION:
 * Ce pipe personnalisé étend le ValidationPipe de NestJS pour valider automatiquement
 * toutes les données entrantes dans l'API (body, query, params).
 *
 * FONCTIONNALITÉS:
 * - Whitelist: supprime automatiquement les propriétés non définies dans le DTO
 * - ForbidNonWhitelisted: rejette les requêtes avec des propriétés non autorisées
 * - Transform: convertit automatiquement les types (string -> number, etc.)
 * - ImplicitConversion: conversion automatique des types primitifs
 *
 * UTILISATION:
 * - Configuré globalement dans main.ts
 * - S'applique automatiquement à toutes les routes
 * - Utilise les DTOs (Data Transfer Objects) pour définir la structure attendue
 */

// Import du ValidationPipe de base de NestJS
import { ValidationPipe as NestValidationPipe } from '@nestjs/common';

/**
 * PIPE: ValidationPipe
 *
 * Ce pipe personnalisé étend le ValidationPipe de NestJS avec une configuration
 * stricte pour la sécurité et la validation des données.
 */
export class ValidationPipe extends NestValidationPipe {
  /**
   * CONSTRUCTEUR
   *
   * Configure le pipe avec des options de sécurité strictes:
   */
  constructor() {
    super({
      // whitelist: true supprime automatiquement toutes les propriétés
      // qui ne sont pas explicitement définies dans le DTO
      // Exemple: si le DTO attend { name: string } et on reçoit { name: "John", age: 30 },
      //          age sera automatiquement supprimé
      whitelist: true,

      // forbidNonWhitelisted: true rejette la requête si elle contient
      // des propriétés non autorisées (au lieu de juste les supprimer)
      // Cela protège contre les attaques où on envoie des données supplémentaires
      forbidNonWhitelisted: true,

      // transform: true transforme automatiquement les objets JavaScript
      // en instances des classes DTO (pour utiliser les décorateurs de validation)
      transform: true,

      // transformOptions: options supplémentaires pour la transformation
      transformOptions: {
        // enableImplicitConversion: true convertit automatiquement les types
        // Exemple: "123" (string) devient 123 (number) si le DTO attend un number
        enableImplicitConversion: true,
      },
    });
  }
}
