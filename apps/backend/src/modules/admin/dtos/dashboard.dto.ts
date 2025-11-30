/**
 * FICHIER: dashboard.dto.ts
 *
 * DESCRIPTION:
 * DTOs pour le dashboard admin.
 */

export class DashboardStatsDto {
  totalUsers: number;
  totalItems: number;
  totalExchanges: number;
  openReports: number;
  usersGrowth: number;
  itemsGrowth: number;
  exchangesGrowth: number;
  reportsGrowth: number;
}

