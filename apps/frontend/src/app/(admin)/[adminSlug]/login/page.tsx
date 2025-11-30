/**
 * FICHIER: login/page.tsx
 *
 * DESCRIPTION:
 * Page de connexion admin.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminApi.login(email, password);
      toast.success('Connexion réussie');
      router.push(`/${ADMIN_BASE_PATH}/dashboard`);
    } catch (error: any) {
      console.error('Erreur de connexion admin:', error);
      
      let errorMessage = 'Erreur de connexion';
      
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error' || !error.response) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez que le backend est démarré sur http://localhost:4000';
      } else if (error.response?.status === 401) {
        errorMessage = 'Identifiants incorrects. Vérifiez votre email et mot de passe.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // Afficher plus de détails en console pour le debug
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      } else {
        console.error('Erreur réseau - Backend non accessible');
        console.error('Vérifiez que le backend est démarré: npm run start:dev dans apps/backend');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary mb-4">
            <Leaf className="w-7 h-7 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl tracking-tight mb-1">SecondLife Exchange</h1>
          <p className="text-sm text-muted-foreground">Administration</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>Accédez au panneau d'administration</CardDescription>
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

              <p className="text-xs text-center text-muted-foreground">
                Accès réservé aux administrateurs autorisés
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground mt-8">
          SecondLife Exchange Admin v1.0.0
        </p>
      </div>
    </div>
  );
}

