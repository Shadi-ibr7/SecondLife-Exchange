/**
 * FICHIER: page.tsx (Page d'inscription)
 *
 * DESCRIPTION:
 * Ce fichier définit la page d'inscription de l'application.
 * Elle permet aux utilisateurs de créer un nouveau compte.
 *
 * FONCTIONNALITÉS:
 * - Formulaire d'inscription avec validation Zod
 * - Champs: email, nom d'affichage, mot de passe, confirmation
 * - Validation de la correspondance des mots de passe
 * - Affichage/masquage du mot de passe
 * - Gestion des erreurs avec toast
 * - Redirection vers le profil après inscription
 * - Lien vers la page de connexion
 *
 * SÉCURITÉ:
 * - Validation côté client avec Zod
 * - Validation côté serveur via l'API
 * - Mot de passe minimum 10 caractères
 * - Vérification de la correspondance des mots de passe
 */

'use client';

// Import de React
import { useState } from 'react';

// Import de Next.js
import { useRouter } from 'next/navigation';
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
import { Eye, EyeOff, Mail, Lock, User, UserCheck } from 'lucide-react';

/**
 * SCHÉMA DE VALIDATION: registerSchema
 *
 * Définit les règles de validation pour le formulaire d'inscription.
 * Inclut une validation personnalisée pour vérifier que les mots de passe correspondent.
 */
const registerSchema = z
  .object({
    email: z.string().email('Email invalide'),
    displayName: z
      .string()
      .min(3, "Le nom d'affichage doit contenir au moins 3 caractères"),
    password: z
      .string()
      .min(10, 'Le mot de passe doit contenir au moins 10 caractères'),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['passwordConfirm'], // L'erreur sera attachée au champ passwordConfirm
  });

/**
 * TYPE: RegisterForm
 *
 * Type TypeScript dérivé du schéma Zod.
 */
type RegisterForm = z.infer<typeof registerSchema>;

/**
 * COMPOSANT: RegisterPage
 *
 * Page d'inscription de l'application.
 */
export default function RegisterPage() {
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
   * Récupération de la fonction register (renommée registerUser pour éviter conflit)
   * et de l'état isLoading depuis le store.
   */
  const { register: registerUser, isLoading } = useAuthStore();

  /**
   * Hook Next.js pour la navigation programmatique.
   */
  const router = useRouter();

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
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema), // Utiliser Zod pour la validation
  });

  // ============================================
  // FONCTION: onSubmit
  // ============================================

  /**
   * Fonction appelée lors de la soumission du formulaire.
   *
   * PROCESSUS:
   * 1. Retire passwordConfirm des données (non envoyé au serveur)
   * 2. Appelle la fonction registerUser du store
   * 3. Affiche un toast de succès
   * 4. Redirige vers la page de profil
   * 5. Affiche un toast d'erreur en cas d'échec
   *
   * @param data - Données du formulaire validées
   */
  const onSubmit = async (data: RegisterForm) => {
    try {
      // Retirer passwordConfirm (non nécessaire pour l'API)
      const { passwordConfirm, ...registerData } = data;

      // Appeler la fonction registerUser du store
      await registerUser(registerData);

      // Afficher un toast de succès
      toast.success('Compte créé avec succès !');

      // Rediriger vers la page de profil
      router.push('/profile');
    } catch (error) {
      // Afficher un toast d'erreur en cas d'échec
      toast.error('Erreur lors de la création du compte');
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
            <CardTitle className="text-2xl font-bold">
              Créer un compte
            </CardTitle>
            <CardDescription>
              Rejoignez la communauté SecondLife Exchange
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium">
                  Nom d'affichage *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    placeholder="Jean Dupont"
                    className="pl-10"
                    {...register('displayName')}
                  />
                </div>
                {errors.displayName && (
                  <p className="text-sm text-destructive">
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email *
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
                  Mot de passe *
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

              <div className="space-y-2">
                <label
                  htmlFor="passwordConfirm"
                  className="text-sm font-medium"
                >
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="passwordConfirm"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10"
                    {...register('passwordConfirm')}
                  />
                </div>
                {errors.passwordConfirm && (
                  <p className="text-sm text-destructive">
                    {errors.passwordConfirm.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Création...' : 'Créer mon compte'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Déjà un compte ?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
