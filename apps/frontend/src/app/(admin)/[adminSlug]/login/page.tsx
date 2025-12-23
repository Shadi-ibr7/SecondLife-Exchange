/**
 * FICHIER: login/page.tsx
 *
 * DESCRIPTION:
 * Page de connexion admin.
 */

'use client';

import { useState } from 'react';
import type { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react';
import {
  adminApi,
  ADMIN_LOGIN_ENDPOINT,
  getAdminApiBaseUrl,
} from '@/lib/admin.api';
import { setAdminToken } from '@/lib/admin.token';
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

  console.log('ADMIN LOGIN PAGE RENDERED');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('FORM SUBMITTED');
    setLoading(true);

    const loginUrl = `${getAdminApiBaseUrl()}${ADMIN_LOGIN_ENDPOINT}`;
    console.log('LOGIN REQUEST', loginUrl, { email, password: '********' });

    try {
      const { data, status } = await adminApi.login(email, password);
      console.log('LOGIN RESPONSE', status, data);
      if (data?.accessToken) {
        setAdminToken(data.accessToken);
      }
      toast.success('Connexion réussie');
      router.push(`/${ADMIN_BASE_PATH}/dashboard`);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error('Erreur de connexion admin:', err);

      let errorMessage = 'Erreur de connexion';
      const status = err?.response?.status;

      if (
        !err.response ||
        err.code === 'ECONNREFUSED' ||
        err.message === 'Network Error'
      ) {
        errorMessage = 'API inaccessible';
      } else if (status === 401 || status === 403) {
        errorMessage = 'Identifiants invalides';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);

      if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Data:', err.response.data);
      } else {
        console.error('Erreur réseau - Backend non accessible');
      }
    } finally {
      setLoading(false);
    }
  };

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
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Accès réservé aux administrateurs autorisés
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          SecondLife Exchange Admin v1.0.0
        </p>
      </div>
    </div>
  );
}
