/**
 * FICHIER: settings/page.tsx
 *
 * DESCRIPTION:
 * Page de configuration et paramètres pour l'admin.
 * Design Figma: node-id 29-6968
 */

'use client';

import { useState, useEffect } from 'react';
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
  QrCode,
  Loader2,
  X,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminApi } from '@/lib/admin.api';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [backupCodesModalOpen, setBackupCodesModalOpen] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [regeneratingBackupCodes, setRegeneratingBackupCodes] = useState(false);

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
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    passwordExpiration: '90',
  });

  // Charger l'état 2FA au montage
  useEffect(() => {
    const loadTwoFactorStatus = async () => {
      try {
        const user = await adminApi.getMe();
        if (user && 'twoFactorEnabled' in user) {
          setTwoFactorEnabled(user.twoFactorEnabled || false);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'état 2FA:', error);
      }
    };
    loadTwoFactorStatus();
  }, []);

  // Gérer l'activation/désactivation du 2FA
  const handleTwoFactorToggle = async (enabled: boolean) => {
    if (enabled) {
      // Activer → ouvrir modal de setup
      setTwoFactorLoading(true);
      try {
        const { data } = await adminApi.setupTwoFactor();
        setQrCode(data.qrCode);
        setSetupSecret(data.secret);
        setSetupModalOpen(true);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors du setup 2FA');
      } finally {
        setTwoFactorLoading(false);
      }
    } else {
      // Désactiver → confirmation puis désactivation
      if (confirm('Êtes-vous sûr de vouloir désactiver l\'authentification à deux facteurs ?')) {
        setTwoFactorLoading(true);
        try {
          await adminApi.disableTwoFactor();
          setTwoFactorEnabled(false);
          toast.success('2FA désactivé avec succès');
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Erreur lors de la désactivation du 2FA');
        } finally {
          setTwoFactorLoading(false);
        }
      }
    }
  };

  // Vérifier le code et activer le 2FA
  const handleEnableTwoFactor = async () => {
    if (!verificationCode || verificationCode.length !== 6 || !setupSecret) {
      toast.error('Veuillez entrer un code à 6 chiffres');
      return;
    }

    setVerifying(true);
    try {
      const { data } = await adminApi.enableTwoFactor(verificationCode, setupSecret);
      setTwoFactorEnabled(true);
      setSetupModalOpen(false);
      setQrCode(null);
      setSetupSecret(null);
      setVerificationCode('');

      // Afficher les backup codes dans un modal
      if (data.backupCodes && data.backupCodes.length > 0) {
        setBackupCodes(data.backupCodes);
        setBackupCodesModalOpen(true);
      }

      toast.success('2FA activé avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Code invalide. Vérifiez votre authenticator.');
    } finally {
      setVerifying(false);
    }
  };

  // Régénérer les backup codes
  const handleRegenerateBackupCodes = async () => {
    if (!confirm('Voulez-vous vraiment régénérer les backup codes ? Les anciens codes seront immédiatement invalidés.')) {
      return;
    }

    setRegeneratingBackupCodes(true);
    try {
      const { data } = await adminApi.regenerateBackupCodes();
      setBackupCodes(data.backupCodes);
      setBackupCodesModalOpen(true);
      toast.success('Backup codes régénérés avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la régénération des backup codes');
    } finally {
      setRegeneratingBackupCodes(false);
    }
  };

  // Fermer le modal de setup
  const handleCloseSetupModal = () => {
    setSetupModalOpen(false);
    setQrCode(null);
    setSetupSecret(null);
    setVerificationCode('');
  };

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
                    Authentification à deux facteurs (2FA)
                  </Label>
                  {twoFactorEnabled && (
                    <Badge variant="default" className="ml-2">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Activé
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Sécuriser l'accès administrateur avec authentification TOTP (Google Authenticator, Authy, etc.)
                </p>
              </div>
              <Switch
                id="twoFactor"
                checked={twoFactorEnabled}
                disabled={twoFactorLoading}
                onCheckedChange={handleTwoFactorToggle}
              />
            </div>
            {twoFactorEnabled && (
              <>
                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  <p>
                    ✅ Le 2FA est actif. Vous devrez entrer un code depuis votre authenticator à chaque connexion.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">
                      Backup codes
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Codes de récupération en cas de perte de votre authenticator
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateBackupCodes}
                    disabled={regeneratingBackupCodes}
                  >
                    {regeneratingBackupCodes ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Régénération...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Régénérer
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
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

      {/* Modal 2FA Setup */}
      <Dialog open={setupModalOpen} onOpenChange={handleCloseSetupModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurer l'authentification à deux facteurs</DialogTitle>
            <DialogDescription>
              Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* QR Code */}
            {qrCode && (
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-lg border-2 border-border p-4 bg-white">
                  <img
                    src={qrCode}
                    alt="QR Code 2FA"
                    className="w-64 h-64"
                  />
                </div>
                {setupSecret && (
                  <div className="w-full space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Secret de secours (gardez-le en lieu sûr) :
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-md bg-muted p-2 text-xs font-mono break-all">
                        {setupSecret}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(setupSecret);
                          toast.success('Secret copié');
                        }}
                      >
                        Copier
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Code de vérification */}
            <div className="space-y-2">
              <Label htmlFor="verifyCode">
                Entrez le code à 6 chiffres pour activer le 2FA
              </Label>
              <Input
                id="verifyCode"
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                }}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                disabled={verifying}
              />
              <p className="text-xs text-muted-foreground">
                Le code change toutes les 30 secondes dans votre authenticator
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCloseSetupModal}
                disabled={verifying}
              >
                Annuler
              </Button>
              <Button
                onClick={handleEnableTwoFactor}
                disabled={verifying || verificationCode.length !== 6}
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  'Activer 2FA'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Backup Codes */}
      <Dialog open={backupCodesModalOpen} onOpenChange={setBackupCodesModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Backup Codes - Sauvegardez-les maintenant !
            </DialogTitle>
            <DialogDescription>
              Ces codes vous permettront de vous connecter si vous perdez l'accès à votre authenticator.
              <strong className="block mt-2 text-destructive">
                ⚠️ Ces codes ne seront affichés qu'une seule fois. Sauvegardez-les immédiatement dans un endroit sûr !
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Backup Codes Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-muted rounded-lg">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-background rounded-md border border-border"
                >
                  <code className="text-sm font-mono font-semibold">{code}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      toast.success(`Code ${code} copié`);
                    }}
                  >
                    <span className="text-xs">Copier</span>
                  </Button>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 space-y-2">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                📝 Instructions importantes :
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Chaque code ne peut être utilisé qu'une seule fois</li>
                <li>Sauvegardez ces codes dans un gestionnaire de mots de passe ou un coffre-fort</li>
                <li>Ne partagez jamais ces codes avec qui que ce soit</li>
                <li>Si vous perdez ces codes, vous pouvez en régénérer de nouveaux</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  // Copier tous les codes
                  const allCodes = backupCodes.join('\n');
                  navigator.clipboard.writeText(allCodes);
                  toast.success('Tous les codes copiés');
                }}
              >
                Copier tous les codes
              </Button>
              <Button
                onClick={() => {
                  setBackupCodesModalOpen(false);
                  setBackupCodes([]);
                }}
              >
                J'ai sauvegardé les codes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
