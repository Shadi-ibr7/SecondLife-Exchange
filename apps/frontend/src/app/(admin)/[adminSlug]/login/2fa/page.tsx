/**
 * FICHIER: login/2fa/page.tsx
 *
 * DESCRIPTION:
 * Page de vérification 2FA TOTP après login email+password.
 * Affiche un formulaire pour entrer le code à 6 chiffres depuis l'authenticator.
 */

'use client';

import { useState, useEffect } from 'react';
import type { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
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

export default function TwoFactorVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Récupérer l'ID utilisateur depuis sessionStorage
  useEffect(() => {
    const storedUserId = sessionStorage.getItem('2fa_userId');
    const storedEmail = sessionStorage.getItem('2fa_email');

    if (!storedUserId || !storedEmail) {
      // Pas d'ID utilisateur → rediriger vers login
      toast.error('Session expirée. Veuillez vous reconnecter.');
      router.push(`/${ADMIN_BASE_PATH}/login`);
      return;
    }

    setUserId(storedUserId);
    setEmail(storedEmail);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error('Session expirée. Veuillez vous reconnecter.');
      router.push(`/${ADMIN_BASE_PATH}/login`);
      return;
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      toast.error('Veuillez entrer un code à 6 chiffres');
      return;
    }

    setLoading(true);

    try {
      const { data } = await adminApi.verifyTwoFactor(userId, code);

      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Vérification 2FA réussie:', data.user.email);
      }

      // Nettoyer sessionStorage
      sessionStorage.removeItem('2fa_userId');
      sessionStorage.removeItem('2fa_email');

      toast.success('Connexion réussie');

      // Rediriger vers le dashboard
      router.push(`/${ADMIN_BASE_PATH}/dashboard`);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;

      let errorMessage = 'Code invalide';
      const status = err?.response?.status;

      if (
        !err.response ||
        err.code === 'ECONNREFUSED' ||
        err.message === 'Network Error'
      ) {
        errorMessage = 'API inaccessible - Vérifiez que le backend est démarré';
      } else if (status === 403) {
        // Lockout après trop d'échecs
        errorMessage = err.response?.data?.message || 'Trop de tentatives. Veuillez réessayer plus tard.';
      } else if (status === 401) {
        errorMessage = 'Code TOTP invalide. Vérifiez votre authenticator.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
      setCode(''); // Réinitialiser le code en cas d'erreur

      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Erreur vérification 2FA:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Nettoyer sessionStorage et retourner au login
    sessionStorage.removeItem('2fa_userId');
    sessionStorage.removeItem('2fa_email');
    router.push(`/${ADMIN_BASE_PATH}/login`);
  };

  if (!userId || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        {/* Logo & Title */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Shield
              className="h-7 w-7 text-primary-foreground"
              strokeWidth={1.5}
            />
          </div>
          <h1 className="mb-1 text-2xl tracking-tight">Vérification 2FA</h1>
          <p className="text-sm text-muted-foreground">
            Entrez le code à 6 chiffres depuis votre authenticator
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{email}</p>
        </div>

        {/* 2FA Card */}
        <Card>
          <CardHeader>
            <CardTitle>Code d'authentification</CardTitle>
            <CardDescription>
              Ouvrez votre application d'authentification (Google Authenticator, Authy, etc.)
              et entrez le code à 6 chiffres affiché.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code à 6 chiffres</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => {
                      // Ne garder que les chiffres et limiter à 6
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCode(value);
                    }}
                    maxLength={6}
                    required
                    autoComplete="one-time-code"
                    autoFocus
                    disabled={loading}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  'Vérifier'
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Le code change toutes les 30 secondes
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
