/**
 * FICHIER: verify-email.dto.ts
 *
 * DESCRIPTION:
 * DTOs pour la vérification d'email.
 */

import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { z } from 'zod';

// ============================================
// SCHÉMA ZOD POUR LA VALIDATION
// ============================================

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Le token est requis'),
});

export const ResendVerificationSchema = z.object({
  email: z.string().email('Email invalide'),
});

// ============================================
// DTOs POUR CLASS-VALIDATOR
// ============================================

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResendVerificationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
