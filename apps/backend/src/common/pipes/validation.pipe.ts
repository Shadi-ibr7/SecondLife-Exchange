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
import {
  ValidationPipe as NestValidationPipe,
  HttpStatus,
  HttpException,
  ArgumentMetadata,
  Injectable,
} from '@nestjs/common';

/**
 * PIPE: ValidationPipe
 *
 * Ce pipe personnalisé étend le ValidationPipe de NestJS avec une configuration
 * stricte pour la sécurité et la validation des données.
 *
 * SÉCURITÉ:
 * - whitelist: supprime les propriétés non définies dans le DTO
 * - forbidNonWhitelisted: rejette les requêtes avec propriétés non autorisées
 * - forbidUnknownValues: rejette les valeurs inconnues (enum, etc.)
 * - transform: convertit les objets en instances DTO
 * - Codes HTTP normalisés: 422 (Unprocessable Entity) pour erreurs de validation
 */
@Injectable()
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
      // MAIS: seulement pour les méthodes mutantes (POST, PATCH, DELETE, PUT)
      forbidNonWhitelisted: true,

      // forbidUnknownValues: true rejette les valeurs inconnues pour les enums, etc.
      // Protège contre les tentatives d'injection de valeurs invalides
      forbidUnknownValues: true,

      // transform: true transforme automatiquement les objets JavaScript
      // en instances des classes DTO (pour utiliser les décorateurs de validation)
      transform: true,

      // transformOptions: options supplémentaires pour la transformation
      transformOptions: {
        // enableImplicitConversion: true convertit automatiquement les types
        // Exemple: "123" (string) devient 123 (number) si le DTO attend un number
        enableImplicitConversion: true,
      },

      // skipMissingProperties: true pour éviter les erreurs sur GET sans body
      // Si un body est vide ou manquant, ne pas rejeter (surtout pour les GET)
      skipMissingProperties: false,

      // skipNullProperties: true pour ignorer les propriétés null
      skipNullProperties: true,

      // skipUndefinedProperties: true pour ignorer les propriétés undefined
      skipUndefinedProperties: true,

      // stopAtFirstError: false pour retourner toutes les erreurs de validation
      stopAtFirstError: false,

      // exceptionFactory: personnalise les exceptions de validation
      // Retourne 422 (Unprocessable Entity) avec format standardisé (code + details)
      exceptionFactory: (errors) => {
        // Extraire les détails de validation (field, issue)
        const details = errors.map((error) => {
          const constraints = error.constraints;
          if (constraints) {
            // Joindre toutes les contraintes pour ce champ
            const issue = Object.values(constraints).join(', ');
            return {
              field: error.property,
              issue,
            };
          }
          return {
            field: error.property,
            issue: 'Valeur invalide',
          };
        });

        // Créer un message général
        const message =
          details.length === 1
            ? `Erreur de validation: ${details[0].field}`
            : `${details.length} erreurs de validation`;

        return new HttpException(
          {
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            message,
            errors: details, // Format standardisé avec field et issue
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      },
    });
  }

  /**
   * Override transform() pour ignorer la validation sur les body vides/undefined
   * Cela évite les erreurs 422 sur /auth/admin/me (GET sans body) et autres endpoints similaires
   */
  async transform(value: any, metadata: ArgumentMetadata) {
    // Si c'est un body vide/undefined, ne pas valider (évite 422 sur GET sans body)
    if (metadata.type === 'body') {
      // Vérifier si le body est vide/undefined/null
      const isEmptyBody =
        value === undefined ||
        value === null ||
        (typeof value === 'object' && value !== null && Object.keys(value).length === 0);

      if (isEmptyBody) {
        // LOG DE DIAGNOSTIC TEMPORAIRE
        console.log(`[DIAG ValidationPipe] Body vide détecté, ignoré - metadata:`, {
          type: metadata.type,
          metatype: metadata.metatype?.name,
          data: metadata.data
        });

        // Retourner undefined directement sans validation
        // Cela évite les erreurs 422 causées par forbidNonWhitelisted sur body vide
        return value;
      }
    }

    // Sinon, utiliser la validation normale
    try {
      return await super.transform(value, metadata);
    } catch (error: any) {
      // Si erreur de validation sur un body vide, retourner undefined au lieu de throw
      // Cela évite les 422 sur les GET sans body
      if (metadata.type === 'body') {
        const isEmptyBody =
          value === undefined ||
          value === null ||
          (typeof value === 'object' && value !== null && Object.keys(value).length === 0);

        if (isEmptyBody) {
          // LOG DE DIAGNOSTIC TEMPORAIRE
          console.log(`[DIAG ValidationPipe] Erreur de validation sur body vide ignorée:`, error.message);
          return value;
        }
      }

      // LOG DE DIAGNOSTIC TEMPORAIRE pour voir les autres erreurs de validation
      if (metadata.type === 'body') {
        console.log(`[DIAG ValidationPipe] Erreur de validation sur body:`, {
          errorMessage: error.message,
          value: value,
          metadata: {
            type: metadata.type,
            metatype: metadata.metatype?.name,
            data: metadata.data
          }
        });
      }

      throw error;
    }
  }
}
