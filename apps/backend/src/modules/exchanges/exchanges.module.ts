/**
 * FICHIER: exchanges.module.ts
 *
 * DESCRIPTION:
 * Ce module NestJS regroupe toutes les fonctionnalités liées aux échanges d'objets.
 * Il inclut la gestion des échanges et la communication en temps réel via WebSocket.
 *
 * COMPOSANTS:
 * - ExchangesController: Routes HTTP pour la gestion des échanges
 * - ExchangesService: Logique métier pour les échanges
 * - ExchangesGateway: WebSocket pour le chat en temps réel
 *
 * DÉPENDANCES:
 * - NotificationsModule: Pour envoyer des notifications aux utilisateurs
 */

// Import du décorateur Module
import { Module } from '@nestjs/common';

// Import des composants du module
import { ExchangesController } from './exchanges.controller';
import { ExchangesService } from './exchanges.service';
import { ExchangesGateway } from './exchanges.gateway';

// Import des modules dépendants
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * MODULE: ExchangesModule
 *
 * Module pour la gestion des échanges et de la communication en temps réel.
 */
@Module({
  // Modules importés nécessaires
  imports: [NotificationsModule], // Pour envoyer des notifications

  // Contrôleur qui expose les routes HTTP
  controllers: [ExchangesController],

  // Services et gateways fournis par ce module
  providers: [ExchangesService, ExchangesGateway],

  // Services exportés pour être utilisés dans d'autres modules
  exports: [ExchangesService],
})
export class ExchangesModule {}
