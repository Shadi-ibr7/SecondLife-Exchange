/**
 * FICHIER: login/page.tsx
 *
 * DESCRIPTION:
 * Page de connexion admin avec authentification par cookies httpOnly.
 *
 * SÉCURITÉ:
 * - Les tokens sont stockés dans des cookies httpOnly (pas en localStorage)
 * - Le backend gère les cookies automatiquement via Set-Cookie
 * - Aucun token n'est accessible côté JavaScript (protection XSS)
 */

'use client';

import { useState, useEffect } from 'react';
import type { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { Leaf, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
import { clearAdminToken } from '@/lib/admin.token';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Vérifier si déjà connecté au chargement
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await adminApi.getMe();
        if (user) {
          // Déjà connecté → rediriger vers dashboard
          router.replace(`/${ADMIN_BASE_PATH}/dashboard`);
          return;
        }
      } catch {
        // Pas connecté → rester sur login
      } finally {
        setCheckingSession(false);
      }

      // Nettoyer les anciens tokens localStorage (migration)
      clearAdminToken();
    };

    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await adminApi.login(email, password);

      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Connexion réussie:', data.user.email);
      }

      toast.success('Connexion réussie');

      // Rediriger vers le dashboard
      router.push(`/${ADMIN_BASE_PATH}/dashboard`);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;

      let errorMessage = 'Erreur de connexion';
      const status = err?.response?.status;

      if (
        !err.response ||
        err.code === 'ECONNREFUSED' ||
        err.message === 'Network Error'
      ) {
        errorMessage = 'API inaccessible - Vérifiez que le backend est démarré';
      } else if (status === 401 || status === 403) {
        errorMessage = 'Identifiants invalides';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);

      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Erreur de connexion admin:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Afficher un loader pendant la vérification de session
  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Leaf
              className="h-7 w-7 text-primary-foreground"
              strokeWidth={1.5}
            />
          </div>
          <h1 className="mb-1 text-2xl tracking-tight">SecondLife Exchange</h1>
          <p className="text-sm text-muted-foreground">Administration</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>
              Accédez au panneau d&apos;administration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@secondlife.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Accès réservé aux administrateurs autorisés
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          SecondLife Exchange Admin v1.0.0 • 🔒 Cookies httpOnly
        </p>
      </div>
    </div>
  );
}
