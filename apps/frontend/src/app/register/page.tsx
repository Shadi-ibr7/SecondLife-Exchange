'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth';
import { Eye, EyeOff, Mail, Lock, User, UserCheck } from 'lucide-react';

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
    path: ['passwordConfirm'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const { passwordConfirm, ...registerData } = data;
      await registerUser(registerData);
      toast.success('Compte créé avec succès !');
      router.push('/profile');
    } catch (error) {
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
