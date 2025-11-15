/**
 * FICHIER: page.tsx (Page de connexion)
 *
 * DESCRIPTION:
 * Ce fichier définit la page de connexion de l'application.
 * Elle permet aux utilisateurs de se connecter avec leur email et mot de passe.
 *
 * FONCTIONNALITÉS:
 * - Formulaire de connexion avec validation Zod
 * - Affichage/masquage du mot de passe
 * - Gestion des erreurs avec toast
 * - Redirection après connexion (vers la page demandée ou la page d'accueil)
 * - Lien vers la page d'inscription
 * - Suspense pour la gestion du SSR avec useSearchParams
 *
 * SÉCURITÉ:
 * - Validation côté client avec Zod
 * - Validation côté serveur via l'API
 * - Mot de passe minimum 10 caractères
 */

'use client';

// Import de React
import { useState, Suspense } from 'react';

// Import de Next.js
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Import de Framer Motion pour les animations
import { motion } from 'framer-motion';

// Import de React Hook Form pour la gestion du formulaire
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Import de Zod pour la validation
import { z } from 'zod';

// Import de react-hot-toast pour les notifications
import { toast } from 'react-hot-toast';

// Import des composants UI
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Import du store d'authentification
import { useAuthStore } from '@/store/auth';

// Import des icônes
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

/**
 * SCHÉMA DE VALIDATION: loginSchema
 *
 * Définit les règles de validation pour le formulaire de connexion.
 */
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(10, 'Le mot de passe doit contenir au moins 10 caractères'),
});

/**
 * TYPE: LoginForm
 *
 * Type TypeScript dérivé du schéma Zod.
 */
type LoginForm = z.infer<typeof loginSchema>;

/**
 * COMPOSANT: LoginPageContent
 *
 * Contenu principal de la page de connexion.
 * Enveloppé dans Suspense pour gérer useSearchParams avec SSR.
 */
function LoginPageContent() {
  // ============================================
  // GESTION DE L'ÉTAT LOCAL
  // ============================================

  /**
   * État pour afficher/masquer le mot de passe.
   */
  const [showPassword, setShowPassword] = useState(false);

  // ============================================
  // RÉCUPÉRATION DES HOOKS ET STORES
  // ============================================

  /**
   * Récupération de la fonction login et de l'état isLoading depuis le store.
   */
  const { login, isLoading } = useAuthStore();

  /**
   * Hook Next.js pour la navigation programmatique.
   */
  const router = useRouter();

  /**
   * Hook Next.js pour récupérer les paramètres de requête (ex: ?next=/profile).
   */
  const searchParams = useSearchParams();

  // ============================================
  // CONFIGURATION DU FORMULAIRE
  // ============================================

  /**
   * Configuration de React Hook Form avec validation Zod.
   */
  const {
    register, // Fonction pour enregistrer les champs
    handleSubmit, // Fonction pour gérer la soumission
    formState: { errors }, // Erreurs de validation
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema), // Utiliser Zod pour la validation
  });

  // ============================================
  // FONCTION: onSubmit
  // ============================================

  /**
   * Fonction appelée lors de la soumission du formulaire.
   *
   * PROCESSUS:
   * 1. Appelle la fonction login du store
   * 2. Affiche un toast de succès
   * 3. Redirige vers la page demandée (paramètre 'next') ou la page d'accueil
   * 4. Affiche un toast d'erreur en cas d'échec
   *
   * @param data - Données du formulaire validées (email, password)
   */
  const onSubmit = async (data: LoginForm) => {
    try {
      // Appeler la fonction login du store
      await login(data);

      // Afficher un toast de succès
      toast.success('Connexion réussie !');

      // Récupérer la page de redirection (paramètre 'next' dans l'URL)
      // ou utiliser '/' par défaut
      const next = searchParams.get('next') || '/';

      // Rediriger vers la page demandée
      router.push(next);
    } catch (error) {
      // Afficher un toast d'erreur en cas d'échec
      toast.error('Email ou mot de passe incorrect');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
            <CardDescription>
              Connectez-vous à votre compte SecondLife Exchange
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Pas encore de compte ?{' '}
                <Link href="/register" className="text-primary hover:underline">
                  Créer un compte
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/**
 * COMPOSANT: LoginPage
 *
 * Page de connexion principale.
 * Enveloppe LoginPageContent dans Suspense car useSearchParams nécessite
 * un composant client avec Suspense pour fonctionner avec SSR.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        // Affichage de chargement pendant le SSR
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
