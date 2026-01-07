/**
 * FICHIER: security/page.tsx
 *
 * DESCRIPTION:
 * Page de sécurité et permissions pour l'admin.
 */

'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Shield,
  Lock,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Users,
  Settings,
  FileText,
  Globe,
  Server,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SecurityPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    ipWhitelist: false,
    rateLimiting: true,
    passwordPolicy: true,
    emailNotifications: true,
    loginAlerts: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [apiKey, setApiKey] = useState('api_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

  const handleUpdateSettings = async () => {
    try {
      toast.success('Paramètres de sécurité mis à jour');
      queryClient.invalidateQueries({ queryKey: ['admin-security'] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    try {
      toast.success('Mot de passe modifié avec succès');
      setChangePasswordDialogOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    }
  };

  const handleGenerateApiKey = async () => {
    try {
      const newKey = `api_key_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setApiKey(newKey);
      toast.success('Nouvelle clé API générée');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la génération');
    }
  };

  const recentLogins = [
    { ip: '192.168.1.100', location: 'Paris, France', date: new Date(Date.now() - 2 * 60 * 60 * 1000), success: true },
    { ip: '10.0.0.50', location: 'Lyon, France', date: new Date(Date.now() - 24 * 60 * 60 * 1000), success: true },
    { ip: '172.16.0.25', location: 'Marseille, France', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), success: false },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-medium mb-1">Sécurité et permissions</h1>
            <p className="text-muted-foreground">
              Gérer les paramètres de sécurité et les permissions d'accès
            </p>
          </div>
        </div>
        <Button onClick={handleUpdateSettings}>
          <Settings className="w-4 h-4 mr-2" />
          Enregistrer
        </Button>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="authentication">Authentification</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Sécurité générale
                </CardTitle>
                <CardDescription>Paramètres de sécurité de base</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="rateLimiting">Limitation de débit</Label>
                    <p className="text-sm text-muted-foreground">
                      Limiter le nombre de requêtes par IP
                    </p>
                  </div>
                  <Switch
                    id="rateLimiting"
                    checked={securitySettings.rateLimiting}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, rateLimiting: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="passwordPolicy">Politique de mot de passe</Label>
                    <p className="text-sm text-muted-foreground">
                      Exiger des mots de passe complexes
                    </p>
                  </div>
                  <Switch
                    id="passwordPolicy"
                    checked={securitySettings.passwordPolicy}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, passwordPolicy: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ipWhitelist">Liste blanche IP</Label>
                    <p className="text-sm text-muted-foreground">
                      Restreindre l'accès à certaines IP
                    </p>
                  </div>
                  <Switch
                    id="ipWhitelist"
                    checked={securitySettings.ipWhitelist}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, ipWhitelist: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Sessions
                </CardTitle>
                <CardDescription>Gestion des sessions utilisateurs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Délai d'expiration de session (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        sessionTimeout: parseInt(e.target.value) || 30,
                      })
                    }
                    min={5}
                    max={1440}
                  />
                  <p className="text-xs text-muted-foreground">
                    Durée avant déconnexion automatique (5-1440 minutes)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Authentication Tab */}
        <TabsContent value="authentication" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Authentification
                </CardTitle>
                <CardDescription>Paramètres d'authentification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="twoFactorAuth">Authentification à deux facteurs</Label>
                    <p className="text-sm text-muted-foreground">
                      Exiger 2FA pour tous les administrateurs
                    </p>
                  </div>
                  <Switch
                    id="twoFactorAuth"
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Notifications email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des emails pour les événements de sécurité
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={securitySettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, emailNotifications: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="loginAlerts">Alertes de connexion</Label>
                    <p className="text-sm text-muted-foreground">
                      Alerter en cas de connexion suspecte
                    </p>
                  </div>
                  <Switch
                    id="loginAlerts"
                    checked={securitySettings.loginAlerts}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, loginAlerts: checked })
                    }
                  />
                </div>
                <Separator />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setChangePasswordDialogOpen(true)}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Changer mon mot de passe
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Permissions
                </CardTitle>
                <CardDescription>Gestion des rôles et permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Super Admin</div>
                      <div className="text-sm text-muted-foreground">
                        Accès complet à toutes les fonctionnalités
                      </div>
                    </div>
                    <Badge variant="destructive">2 utilisateurs</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Admin</div>
                      <div className="text-sm text-muted-foreground">
                        Accès à la plupart des fonctionnalités
                      </div>
                    </div>
                    <Badge variant="default">5 utilisateurs</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Modérateur</div>
                      <div className="text-sm text-muted-foreground">
                        Accès limité aux fonctionnalités de modération
                      </div>
                    </div>
                    <Badge variant="secondary">3 utilisateurs</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`/${ADMIN_BASE_PATH}/admins`}>
                    <Users className="w-4 h-4 mr-2" />
                    Gérer les administrateurs
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Clés API
              </CardTitle>
              <CardDescription>Gérer les clés API pour l'accès programmatique</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Attention</AlertTitle>
                <AlertDescription>
                  Gardez vos clés API secrètes. Ne les partagez jamais publiquement.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="apiKey">Clé API principale</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" onClick={handleGenerateApiKey}>
                    <Key className="w-4 h-4 mr-2" />
                    Régénérer
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Utilisez cette clé pour authentifier vos requêtes API
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Clés API actives</h4>
                <div className="space-y-2">
                  {[
                    { name: 'Clé principale', created: new Date('2024-01-15'), lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
                    { name: 'Clé de développement', created: new Date('2024-02-20'), lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                  ].map((key, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{key.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Créée le {format(key.created, 'PP', { locale: fr })} • Dernière
                          utilisation: {format(key.lastUsed, 'PP', { locale: fr })}
                        </div>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Connexions récentes
              </CardTitle>
              <CardDescription>Historique des tentatives de connexion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLogins.map((login, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {login.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{login.ip}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {login.location}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {format(login.date, 'PPp', { locale: fr })}
                      </div>
                      <Badge variant={login.success ? 'default' : 'destructive'}>
                        {login.success ? 'Succès' : 'Échec'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialogOpen} onOpenChange={setChangePasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription>
              Modifiez votre mot de passe administrateur. Assurez-vous qu'il soit sécurisé.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleChangePassword}>
              <Key className="w-4 h-4 mr-2" />
              Changer le mot de passe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

