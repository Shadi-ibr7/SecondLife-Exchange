/**
 * FICHIER: notifications.dto.ts
 *
 * DESCRIPTION:
 * Ce fichier contient les DTOs (Data Transfer Objects) pour le module de notifications.
 * Il définit les structures pour :
 * - L'enregistrement de tokens push (FCM/WebPush)
 * - L'envoi de notifications de test
 * - Les notifications in-app (CRUD)
 * - Les subscriptions WebPush
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsObject,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { z } from 'zod';
import { NotificationType } from '@prisma/client';

// ============================================
// ENUMS
// ============================================

export enum NotificationProvider {
  WEBPUSH = 'webpush',
  FCM = 'fcm',
}

// ============================================
// SCHEMAS ZOD (pour validation côté service)
// ============================================

export const RegisterTokenSchema = z.object({
  token: z
    .string()
    .min(1, 'Le token est requis')
    .max(1000, 'Le token ne peut pas dépasser 1000 caractères'),
  provider: z.enum(['webpush', 'fcm']).default('webpush'),
});

export const SendTestNotificationSchema = z.object({
  userId: z.string().uuid().optional(),
  title: z.string().min(1).max(100).default('Test Notification'),
  body: z.string().min(1).max(500).default('Ceci est une notification de test'),
});

export type RegisterTokenInput = z.infer<typeof RegisterTokenSchema>;
export type SendTestNotificationInput = z.infer<
  typeof SendTestNotificationSchema
>;

// ============================================
// DTOs PUSH TOKENS
// ============================================

export class RegisterTokenDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Le token est requis' })
  @MaxLength(1000, { message: 'Le token ne peut pas dépasser 1000 caractères' })
  token: string;

  @IsOptional()
  @IsEnum(NotificationProvider)
  provider?: NotificationProvider = NotificationProvider.WEBPUSH;
}

export class SendTestNotificationDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string = 'Test Notification';

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  body?: string = 'Ceci est une notification de test';
}

// ============================================
// DTOs WEBPUSH SUBSCRIPTION
// ============================================

export class WebPushKeysDto {
  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @IsString()
  @IsNotEmpty()
  auth: string;
}

export class WebPushSubscribeDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @IsObject()
  @Type(() => WebPushKeysDto)
  keys: WebPushKeysDto;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class WebPushUnsubscribeDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;
}

// ============================================
// DTOs NOTIFICATIONS IN-APP
// ============================================

export class ListNotificationsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unreadOnly?: boolean = false;
}

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  body: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

// ============================================
// TYPES DE RÉPONSE
// ============================================

export interface NotificationTokenResponse {
  id: string;
  userId: string;
  provider: string;
  token: string;
  endpoint?: string;
  createdAt: string;
}

export interface SendNotificationResponse {
  success: boolean;
  message: string;
  sentCount: number;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any> | null;
  readAt: string | null;
  createdAt: string;
}

export interface PaginatedNotificationsResponse {
  items: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export interface UnreadCountResponse {
  count: number;
}

// ============================================
// TYPES POUR LE SERVICE INTERNE
// ============================================

export interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: string;
    [key: string]: any;
  };
}
