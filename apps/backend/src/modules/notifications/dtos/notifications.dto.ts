import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { z } from 'zod';

// Types pour les providers
export enum NotificationProvider {
  WEBPUSH = 'webpush',
  FCM = 'fcm',
}

// Schémas Zod pour la validation
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

// DTOs pour class-validator
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

// Types de réponse
export interface NotificationTokenResponse {
  id: string;
  userId: string;
  provider: string;
  token: string;
  createdAt: string;
}

export interface SendNotificationResponse {
  success: boolean;
  message: string;
  sentCount: number;
}

