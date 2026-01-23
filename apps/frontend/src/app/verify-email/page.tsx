/**
 * FICHIER: app/verify-email/page.tsx
 *
 * DESCRIPTION:
 * Page de vérification d'adresse email.
 * Lit le token depuis la query string et appelle l'API pour vérifier l'email.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Container } from '@/components/common/Container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage('Token de vérification manquant');
      return;
    }

    // Appeler l'API pour vérifier le token
    const verifyEmail = async () => {
      try {
        const result = await apiClient.verifyEmail(token);
        if (result.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage('Erreur lors de la vérification');
        }
      } catch (error: any) {
        setStatus('error');
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Erreur lors de la vérification de votre email';
        setErrorMessage(message);
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <Container className="flex min-h-screen items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
                <h1 className="mb-2 text-2xl font-semibold">
                  Vérification en cours...
                </h1>
                <p className="text-muted-foreground">
                  Veuillez patienter pendant que nous vérifions votre adresse
                  email.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </motion.div>
                <h1 className="mb-2 text-2xl font-semibold">
                  Email vérifié avec succès ! ✅
                </h1>
                <p className="mb-6 text-muted-foreground">
                  Votre adresse email a été vérifiée. Vous pouvez maintenant
                  vous connecter et profiter de toutes les fonctionnalités de
                  SecondLife Exchange.
                </p>
                <Button asChild className="w-full">
                  <Link href="/login">Se connecter</Link>
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                    <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                </motion.div>
                <h1 className="mb-2 text-2xl font-semibold">
                  Erreur de vérification
                </h1>
                <p className="mb-4 text-muted-foreground">{errorMessage}</p>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/register')}
                  >
                    Créer un compte
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => router.push('/login')}
                  >
                    Se connecter
                  </Button>
                </div>
                {errorMessage.includes('expiré') && (
                  <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
                    <div className="mb-2 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <p className="font-medium text-orange-900 dark:text-orange-100">
                        Lien expiré ?
                      </p>
                    </div>
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      Vous pouvez demander un nouveau lien de vérification depuis
                      la page de connexion.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
}
