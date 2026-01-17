/**
 * FICHIER: security.module.ts
 *
 * DESCRIPTION:
 * Module de sécurité pour gérer la protection CSRF (Cross-Site Request Forgery).
 * Fournit un endpoint pour obtenir les tokens CSRF et un guard pour les valider.
 */

import { Global, Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';

/**
 * Module global pour la sécurité (CSRF)
 * Rendu global pour que SecurityService soit accessible dans tous les guards
 */
@Global()
@Module({
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService], // Export pour utiliser dans le guard
})
export class SecurityModule {}
