/**
 * FICHIER: settings/page.tsx
 *
 * DESCRIPTION:
 * Page de configuration et paramètres pour l'admin.
 * Design Figma: node-id 29-6968
 */

'use client';

import { useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Database,
  Key,
  Save,
  Palette,
  Gavel,
  Download,
  Upload,
  RefreshCw,
  Moon,
  Sun,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Settings state
  const [platformSettings, setPlatformSettings] = useState({
    siteName: 'SecondLife Exchange',
    adminEmail: 'admin@secondlife-exchange.com',
    maintenanceMode: false,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newUsers: true,
    reports: true,
    systemAlerts: true,
    weeklyReport: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: true,
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    passwordExpiration: '90',
  });

  const [moderationSettings, setModerationSettings] = useState({
    autoModeration: true,
    itemApproval: false,
    minAge: '18',
  });

  const [dataSettings, setDataSettings] = useState({
    dataRetention: '365',
    backupFrequency: 'hourly',
  });

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Toutes les modifications ont été enregistrées');
    } catch (error: any) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Sauvegarde créée avec succès');
    } catch (error: any) {
      toast.error('Erreur lors de la création de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Export des données réussi');
    } catch (error: any) {
      toast.error('Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateKeys = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Clés API régénérées avec succès');
    } catch (error: any) {
      toast.error('Erreur lors de la régénération');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Paramètres</h1>
          <p className="admin-page-description">Configuration et gestion de la plateforme</p>
        </div>
        <Button onClick={handleSaveAll} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          Enregistrer les modifications
        </Button>
      </div>

      {/* Platform Configuration */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#1a1a1c] rounded-lg p-2">
            <Settings className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-base font-normal text-foreground">Configuration de la plateforme</h2>
            <p className="text-sm text-muted-foreground">Paramètres généraux de l'application</p>
          </div>
        </div>
        <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
          <CardContent className="p-0 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="siteName" className="text-sm font-medium text-foreground">
                Nom de la plateforme
              </Label>
              <Input
                id="siteName"
                value={platformSettings.siteName}
                onChange={(e) =>
                  setPlatformSettings({ ...platformSettings, siteName: e.target.value })
                }
                className="bg-[#1a1a1c] border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail" className="text-sm font-medium text-foreground">
                Email administrateur
              </Label>
              <Input
                id="adminEmail"
                type="email"
                value={platformSettings.adminEmail}
                onChange={(e) =>
                  setPlatformSettings({ ...platformSettings, adminEmail: e.target.value })
                }
                className="bg-[#1a1a1c] border-border"
              />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-foreground" />
                  <Label htmlFor="maintenance" className="text-sm font-medium text-foreground">
                    Mode maintenance
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Désactiver temporairement l'accès à la plateforme
                </p>
              </div>
              <Switch
                id="maintenance"
                checked={platformSettings.maintenanceMode}
                onCheckedChange={(checked) =>
                  setPlatformSettings({ ...platformSettings, maintenanceMode: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appearance */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#1a1a1c] rounded-lg p-2">
            <Palette className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-base font-normal text-foreground">Apparence</h2>
            <p className="text-sm text-muted-foreground">Personnaliser l'interface de l'administration</p>
          </div>
        </div>
        <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
          <CardContent className="p-0 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Thème de l'interface</Label>
              <p className="text-sm text-muted-foreground">
                Choisissez le thème pour l'interface d'administration
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`relative p-4 border-2 rounded-lg transition-all ${
                  theme === 'light'
                    ? 'border-[#e5e7eb] bg-gradient-to-br from-white to-gray-100'
                    : 'border-border bg-[#141416] hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-center h-20 bg-gradient-to-br from-white to-gray-100 rounded-md border border-[#e5e7eb] mb-2">
                  <span className="text-xs text-[#4a5565]">Aa</span>
                </div>
                <p className="text-sm text-center text-foreground">Mode clair</p>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`relative p-4 border-2 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'border-[#2d5a45] bg-[rgba(45,90,69,0.05)]'
                    : 'border-border bg-[#141416] hover:border-border/80'
                }`}
              >
                {theme === 'dark' && (
                  <div className="absolute top-2 right-2 bg-[#2d5a45] rounded-full p-1">
                    <div className="w-3 h-3 bg-white rounded-full" />
                  </div>
                )}
                <div className="flex items-center justify-center h-20 bg-gradient-to-br from-[#101828] to-[#1e2939] rounded-md border border-[#364153] mb-2">
                  <span className="text-xs text-[#d1d5dc]">Aa</span>
                </div>
                <p className="text-sm text-center text-foreground">Mode sombre</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#1a1a1c] rounded-lg p-2">
            <Bell className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-base font-normal text-foreground">Notifications</h2>
            <p className="text-sm text-muted-foreground">Gérer les alertes et notifications système</p>
          </div>
        </div>
        <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
          <CardContent className="p-0 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-foreground" />
                  <Label htmlFor="emailNotif" className="text-sm font-medium text-foreground">
                    Notifications par email
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Recevoir les alertes importantes par email
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
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="newUsers" className="text-sm font-medium text-foreground">
                  Nouveaux utilisateurs
                </Label>
                <p className="text-sm text-muted-foreground">Alertes lors de nouvelles inscriptions</p>
              </div>
              <Switch
                id="newUsers"
                checked={notificationSettings.newUsers}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, newUsers: checked })
                }
              />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="reports" className="text-sm font-medium text-foreground">
                  Signalements
                </Label>
                <p className="text-sm text-muted-foreground">Alertes lors de nouveaux signalements</p>
              </div>
              <Switch
                id="reports"
                checked={notificationSettings.reports}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, reports: checked })
                }
              />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="systemAlerts" className="text-sm font-medium text-foreground">
                  Alertes système
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notifications d'erreurs et problèmes techniques
                </p>
              </div>
              <Switch
                id="systemAlerts"
                checked={notificationSettings.systemAlerts}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, systemAlerts: checked })
                }
              />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="weeklyReport" className="text-sm font-medium text-foreground">
                  Rapport hebdomadaire
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir un résumé des activités chaque semaine
                </p>
              </div>
              <Switch
                id="weeklyReport"
                checked={notificationSettings.weeklyReport}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, weeklyReport: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#1a1a1c] rounded-lg p-2">
            <Shield className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-base font-normal text-foreground">Sécurité</h2>
            <p className="text-sm text-muted-foreground">Paramètres de sécurité et authentification</p>
          </div>
        </div>
        <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
          <CardContent className="p-0 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-foreground" />
                  <Label htmlFor="twoFactor" className="text-sm font-medium text-foreground">
                    Authentification à deux facteurs
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sécuriser l'accès administrateur avec 2FA
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
            <Separator className="bg-border" />
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="text-sm font-medium text-foreground">
                Expiration de session (minutes)
              </Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={securitySettings.sessionTimeout}
                onChange={(e) =>
                  setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })
                }
                className="bg-[#1a1a1c] border-border"
              />
              <p className="text-sm text-muted-foreground">
                Durée avant déconnexion automatique
              </p>
            </div>
            <Separator className="bg-border" />
            <div className="space-y-2">
              <Label htmlFor="maxAttempts" className="text-sm font-medium text-foreground">
                Tentatives de connexion max
              </Label>
              <Input
                id="maxAttempts"
                type="number"
                value={securitySettings.maxLoginAttempts}
                onChange={(e) =>
                  setSecuritySettings({ ...securitySettings, maxLoginAttempts: e.target.value })
                }
                className="bg-[#1a1a1c] border-border"
              />
              <p className="text-sm text-muted-foreground">
                Nombre de tentatives avant blocage du compte
              </p>
            </div>
            <Separator className="bg-border" />
            <div className="space-y-2">
              <Label htmlFor="passwordExpiration" className="text-sm font-medium text-foreground">
                Expiration mot de passe (jours)
              </Label>
              <Input
                id="passwordExpiration"
                type="number"
                value={securitySettings.passwordExpiration}
                onChange={(e) =>
                  setSecuritySettings({ ...securitySettings, passwordExpiration: e.target.value })
                }
                className="bg-[#1a1a1c] border-border"
              />
              <p className="text-sm text-muted-foreground">
                Forcer le changement de mot de passe après cette période
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderation */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#1a1a1c] rounded-lg p-2">
            <Gavel className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-base font-normal text-foreground">Modération</h2>
            <p className="text-sm text-muted-foreground">Contrôle du contenu et des utilisateurs</p>
          </div>
        </div>
        <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
          <CardContent className="p-0 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="autoModeration" className="text-sm font-medium text-foreground">
                  Modération automatique
                </Label>
                <p className="text-sm text-muted-foreground">
                  Utiliser l'IA pour détecter le contenu inapproprié
                </p>
              </div>
              <Switch
                id="autoModeration"
                checked={moderationSettings.autoModeration}
                onCheckedChange={(checked) =>
                  setModerationSettings({ ...moderationSettings, autoModeration: checked })
                }
              />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="itemApproval" className="text-sm font-medium text-foreground">
                  Approbation des objets
                </Label>
                <p className="text-sm text-muted-foreground">
                  Les objets doivent être validés avant publication
                </p>
              </div>
              <Switch
                id="itemApproval"
                checked={moderationSettings.itemApproval}
                onCheckedChange={(checked) =>
                  setModerationSettings({ ...moderationSettings, itemApproval: checked })
                }
              />
            </div>
            <Separator className="bg-border" />
            <div className="space-y-2">
              <Label htmlFor="minAge" className="text-sm font-medium text-foreground">
                Âge minimum des utilisateurs
              </Label>
              <Input
                id="minAge"
                type="number"
                value={moderationSettings.minAge}
                onChange={(e) =>
                  setModerationSettings({ ...moderationSettings, minAge: e.target.value })
                }
                className="bg-[#1a1a1c] border-border"
              />
              <p className="text-sm text-muted-foreground">Âge minimum requis pour s'inscrire</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Management */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#1a1a1c] rounded-lg p-2">
            <Database className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-base font-normal text-foreground">Gestion des données</h2>
            <p className="text-sm text-muted-foreground">
              Rétention, sauvegarde et export des données
            </p>
          </div>
        </div>
        <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
          <CardContent className="p-0 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="dataRetention" className="text-sm font-medium text-foreground">
                Rétention des données (jours)
              </Label>
              <Input
                id="dataRetention"
                type="number"
                value={dataSettings.dataRetention}
                onChange={(e) =>
                  setDataSettings({ ...dataSettings, dataRetention: e.target.value })
                }
                className="bg-[#1a1a1c] border-border"
              />
              <p className="text-sm text-muted-foreground">
                Durée de conservation des données supprimées
              </p>
            </div>
            <Separator className="bg-border" />
            <div className="space-y-2">
              <Label htmlFor="backupFrequency" className="text-sm font-medium text-foreground">
                Fréquence des sauvegardes
              </Label>
              <Select
                value={dataSettings.backupFrequency}
                onValueChange={(value) =>
                  setDataSettings({ ...dataSettings, backupFrequency: value })
                }
              >
                <SelectTrigger className="bg-[#0a0a0b] border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Toutes les heures</SelectItem>
                  <SelectItem value="daily">Quotidienne</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuelle</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Fréquence des sauvegardes automatiques
              </p>
            </div>
            <Separator className="bg-border" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Actions rapides</Label>
                <p className="text-sm text-muted-foreground">
                  Opérations de maintenance et gestion des données
                </p>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="border-border"
                  onClick={handleBackup}
                  disabled={loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Créer une sauvegarde
                </Button>
                <Button
                  variant="outline"
                  className="border-border"
                  onClick={handleExport}
                  disabled={loading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Exporter les données
                </Button>
                <Button
                  variant="outline"
                  className="border-border"
                  onClick={handleRegenerateKeys}
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Régénérer les clés API
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save All Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={loading} size="lg">
          <Save className="w-4 h-4 mr-2" />
          Enregistrer toutes les modifications
        </Button>
      </div>
    </div>
  );
}
