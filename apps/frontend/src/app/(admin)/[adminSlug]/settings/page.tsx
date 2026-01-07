/**
 * FICHIER: settings/page.tsx
 *
 * DESCRIPTION:
 * Page de configuration et paramètres pour l'admin.
 */

'use client';

import { useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Database,
  Key,
  AlertTriangle,
  Save,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);

  // Settings state
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'SecondLife Exchange',
    siteDescription: 'Plateforme d\'échange d\'objets écoresponsables',
    maintenanceMode: false,
    registrationEnabled: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    adminAlerts: true,
    reportAlerts: true,
    userAlerts: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: '24',
    maxLoginAttempts: '5',
    requireEmailVerification: false,
    twoFactorEnabled: false,
  });

  const [apiSettings, setApiSettings] = useState({
    geminiApiKey: '••••••••••••••••',
    unsplashApiKey: '••••••••••••••••',
    apiRateLimit: '100',
  });

  const handleSave = async (section: string) => {
    setLoading(true);
    try {
      // Simuler une sauvegarde
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`${section} sauvegardé avec succès`);
    } catch (error: any) {
      toast.error(`Erreur lors de la sauvegarde de ${section}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetCache = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Cache réinitialisé avec succès');
    } catch (error: any) {
      toast.error('Erreur lors de la réinitialisation du cache');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium mb-1">Paramètres</h1>
        <p className="text-muted-foreground">Configuration de la plateforme SecondLife Exchange</p>
      </div>

      {/* Warning Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Attention</AlertTitle>
        <AlertDescription>
          Les modifications des paramètres peuvent affecter le fonctionnement de la plateforme.
          Assurez-vous de comprendre l'impact de chaque changement avant de sauvegarder.
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            Général
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="w-4 h-4 mr-2" />
            API
          </TabsTrigger>
          <TabsTrigger value="system">
            <Database className="w-4 h-4 mr-2" />
            Système
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>Configuration de base de la plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">Nom du site</Label>
                <Input
                  id="siteName"
                  value={generalSettings.siteName}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, siteName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Description du site</Label>
                <Textarea
                  id="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance">Mode maintenance</Label>
                  <p className="text-sm text-muted-foreground">
                    Active le mode maintenance pour tous les utilisateurs
                  </p>
                </div>
                <Switch
                  id="maintenance"
                  checked={generalSettings.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setGeneralSettings({ ...generalSettings, maintenanceMode: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="registration">Inscriptions ouvertes</Label>
                  <p className="text-sm text-muted-foreground">
                    Autorise les nouvelles inscriptions
                  </p>
                </div>
                <Switch
                  id="registration"
                  checked={generalSettings.registrationEnabled}
                  onCheckedChange={(checked) =>
                    setGeneralSettings({ ...generalSettings, registrationEnabled: checked })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('Paramètres généraux')} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de sécurité</CardTitle>
              <CardDescription>Configuration de la sécurité et authentification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Délai d'expiration de session (heures)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) =>
                    setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Durée avant expiration automatique de la session
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAttempts">Nombre max de tentatives de connexion</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) =>
                    setSecuritySettings({ ...securitySettings, maxLoginAttempts: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Nombre maximum de tentatives avant blocage temporaire
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailVerification">Vérification email requise</Label>
                  <p className="text-sm text-muted-foreground">
                    Les utilisateurs doivent vérifier leur email pour s'inscrire
                  </p>
                </div>
                <Switch
                  id="emailVerification"
                  checked={securitySettings.requireEmailVerification}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({ ...securitySettings, requireEmailVerification: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="twoFactor">Authentification à deux facteurs</Label>
                  <p className="text-sm text-muted-foreground">
                    Active l'authentification à deux facteurs pour les admins
                  </p>
                </div>
                <Switch
                  id="twoFactor"
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({ ...securitySettings, twoFactorEnabled: checked })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('Paramètres de sécurité')} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de notifications</CardTitle>
              <CardDescription>Configuration des notifications pour les administrateurs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotif">Notifications par email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir les notifications importantes par email
                  </p>
                </div>
                <Switch
                  id="emailNotif"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pushNotif">Notifications push</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir les notifications push dans le navigateur
                  </p>
                </div>
                <Switch
                  id="pushNotif"
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, pushNotifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="adminAlerts">Alertes admin</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications pour les actions administratives importantes
                  </p>
                </div>
                <Switch
                  id="adminAlerts"
                  checked={notificationSettings.adminAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, adminAlerts: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reportAlerts">Alertes signalements</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications pour les nouveaux signalements
                  </p>
                </div>
                <Switch
                  id="reportAlerts"
                  checked={notificationSettings.reportAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, reportAlerts: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="userAlerts">Alertes utilisateurs</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications pour les activités utilisateurs importantes
                  </p>
                </div>
                <Switch
                  id="userAlerts"
                  checked={notificationSettings.userAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, userAlerts: checked })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave('Paramètres de notifications')}
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration API</CardTitle>
              <CardDescription>Gestion des clés API et limites</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertTitle>Clés API sensibles</AlertTitle>
                <AlertDescription>
                  Les clés API sont masquées pour des raisons de sécurité. Modifiez uniquement si
                  nécessaire.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="geminiKey">Clé API Gemini</Label>
                <Input
                  id="geminiKey"
                  type="password"
                  value={apiSettings.geminiApiKey}
                  onChange={(e) =>
                    setApiSettings({ ...apiSettings, geminiApiKey: e.target.value })
                  }
                  placeholder="Entrez la clé API Gemini"
                />
                <p className="text-xs text-muted-foreground">
                  Utilisée pour la génération de thèmes et suggestions IA
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unsplashKey">Clé API Unsplash</Label>
                <Input
                  id="unsplashKey"
                  type="password"
                  value={apiSettings.unsplashApiKey}
                  onChange={(e) =>
                    setApiSettings({ ...apiSettings, unsplashApiKey: e.target.value })
                  }
                  placeholder="Entrez la clé API Unsplash"
                />
                <p className="text-xs text-muted-foreground">
                  Utilisée pour récupérer les images des thèmes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rateLimit">Limite de débit API (requêtes/heure)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={apiSettings.apiRateLimit}
                  onChange={(e) =>
                    setApiSettings({ ...apiSettings, apiRateLimit: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Limite globale de requêtes par heure
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('Configuration API')} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion du système</CardTitle>
              <CardDescription>Outils de maintenance et diagnostic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Réinitialiser le cache</h4>
                    <p className="text-sm text-muted-foreground">
                      Vide tous les caches de l'application
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleResetCache} disabled={loading}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Statut de la base de données</h4>
                    <p className="text-sm text-muted-foreground">
                      Vérifie la connexion et l'état de la base de données
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    Connecté
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Version de l'application</h4>
                    <p className="text-sm text-muted-foreground">
                      Version actuelle de SecondLife Exchange
                    </p>
                  </div>
                  <Badge variant="secondary">v1.0.0</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Statut des services</h4>
                    <p className="text-sm text-muted-foreground">
                      État de tous les services externes
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-green-500">
                      API
                    </Badge>
                    <Badge variant="default" className="bg-green-500">
                      Database
                    </Badge>
                    <Badge variant="default" className="bg-green-500">
                      Gemini
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

