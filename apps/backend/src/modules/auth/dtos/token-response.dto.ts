import { z } from 'zod';

// Schéma Zod pour la réponse des tokens
export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().nullable(),
    roles: z.array(z.enum(['USER', 'ADMIN'])),
    createdAt: z.date(),
  }),
});

export type TokenResponse = z.infer<typeof TokenResponseSchema>;
