/**
 * FICHIER: maintenance/page.tsx
 *
 * DESCRIPTION:
 * Page de maintenance système pour l'admin.
 */

'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Wrench,
  Database,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MaintenancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  const handleBackup = async () => {
    try {
      // Simulation - à remplacer par une vraie API
      toast.success('Sauvegarde en cours...');
      setTimeout(() => {
        toast.success('Sauvegarde terminée avec succès');
        setBackupDialogOpen(false);
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleRestore = async () => {
    try {
      // Simulation - à remplacer par une vraie API
      toast.success('Restauration en cours...');
      setTimeout(() => {
        toast.success('Restauration terminée avec succès');
        setRestoreDialogOpen(false);
        queryClient.invalidateQueries();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la restauration');
    }
  };

  const handleClearCache = async () => {
    try {
      // Simulation - à remplacer par une vraie API
      toast.success('Cache vidé avec succès');
      setClearCacheDialogOpen(false);
      queryClient.invalidateQueries();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du vidage du cache');
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      setMaintenanceMode(!maintenanceMode);
      toast.success(
        maintenanceMode
          ? 'Mode maintenance désactivé'
          : 'Mode maintenance activé - Le site est maintenant en maintenance'
      );
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du changement de mode');
    }
  };

  const lastBackup = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // Il y a 2 jours
  const nextBackup = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // Dans 5 jours

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="admin-page-title">Maintenance système</h1>
            <p className="admin-page-description">
              Gestion de la maintenance, sauvegardes et configuration système
            </p>
          </div>
        </div>
      </div>

      {/* Maintenance Mode Alert */}
      {maintenanceMode && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Mode maintenance activé</AlertTitle>
          <AlertDescription>
            Le site est actuellement en mode maintenance. Les utilisateurs ne peuvent pas accéder à
            la plateforme.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="backup" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="backup">Sauvegardes</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
          <TabsTrigger value="logs">Logs système</TabsTrigger>
        </TabsList>

        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
                  <Database className="w-5 h-5" />
                  Sauvegardes
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground font-normal">Gestion des sauvegardes de la base de données</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dernière sauvegarde</span>
                    <Badge className="border-border text-foreground">
                      {format(lastBackup, 'PP', { locale: fr })}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Prochaine sauvegarde</span>
                    <Badge className="bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]">
                      {format(nextBackup, 'PP', { locale: fr })}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taille totale</span>
                    <span className="text-sm font-medium text-foreground">2.4 GB</span>
                  </div>
                </div>
                <Separator className="bg-border" />
                <div className="flex flex-col gap-2">
                  <Button onClick={() => setBackupDialogOpen(true)}>
                    <Download className="w-4 h-4 mr-2" />
                    Créer une sauvegarde
                  </Button>
                  <Button variant="outline" className="border-border" onClick={() => setRestoreDialogOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Restaurer une sauvegarde
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-base font-normal text-foreground">Historique des sauvegardes</CardTitle>
                <CardDescription className="text-sm text-muted-foreground font-normal">Liste des sauvegardes disponibles</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-3">
                  {[
                    { date: lastBackup, size: '2.4 GB', type: 'Complète' },
                    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), size: '2.3 GB', type: 'Complète' },
                    { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), size: '2.2 GB', type: 'Complète' },
                  ].map((backup, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <div className="font-medium text-sm text-foreground">
                          {format(backup.date, 'PPp', { locale: fr })}
                        </div>
                        <div className="text-xs text-muted-foreground">{backup.type}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="border-border text-foreground">{backup.size}</Badge>
                        <Button variant="ghost" size="icon">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
                <RefreshCw className="w-5 h-5" />
                Gestion du cache
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground font-normal">Vider et régénérer le cache système</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Attention</AlertTitle>
                <AlertDescription>
                  Le vidage du cache peut temporairement ralentir les performances jusqu'à ce que
                  le cache soit régénéré.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
                  <CardHeader className="p-0 mb-6">
                    <CardDescription className="text-sm text-muted-foreground font-normal">Cache utilisateurs</CardDescription>
                    <CardTitle className="text-2xl text-foreground">45 MB</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Button variant="outline" size="sm" className="w-full border-border">
                      Vider
                    </Button>
                  </CardContent>
                </Card>
                <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
                  <CardHeader className="p-0 mb-6">
                    <CardDescription className="text-sm text-muted-foreground font-normal">Cache objets</CardDescription>
                    <CardTitle className="text-2xl text-foreground">128 MB</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Button variant="outline" size="sm" className="w-full border-border">
                      Vider
                    </Button>
                  </CardContent>
                </Card>
                <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
                  <CardHeader className="p-0 mb-6">
                    <CardDescription className="text-sm text-muted-foreground font-normal">Cache API</CardDescription>
                    <CardTitle className="text-2xl text-foreground">67 MB</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Button variant="outline" size="sm" className="w-full border-border">
                      Vider
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Separator className="bg-border" />

              <div className="flex justify-end">
                <Button variant="destructive" onClick={() => setClearCacheDialogOpen(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Vider tout le cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
                  <Settings className="w-5 h-5" />
                  Configuration système
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground font-normal">Paramètres généraux</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Mode maintenance</span>
                    <Badge
                      className={
                        maintenanceMode
                          ? 'bg-[rgba(239,68,68,0.1)] text-[#ef4444] dark:bg-[rgba(239,68,68,0.1)] dark:text-[#ef4444]'
                          : 'bg-[#1a1a1c] text-[#9a9a9d] dark:bg-[#1a1a1c] dark:text-[#9a9a9d]'
                      }
                    >
                      {maintenanceMode ? 'Activé' : 'Désactivé'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Version</span>
                    <Badge className="border-border text-foreground">v1.0.0</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Environnement</span>
                    <Badge className="border-border text-foreground">Production</Badge>
                  </div>
                </div>
                <Separator className="bg-border" />
                <Button
                  variant={maintenanceMode ? 'default' : 'destructive'}
                  className="w-full"
                  onClick={handleToggleMaintenance}
                >
                  {maintenanceMode ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Désactiver le mode maintenance
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Activer le mode maintenance
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
                  <Shield className="w-5 h-5" />
                  Sécurité
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground font-normal">Paramètres de sécurité</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Authentification</span>
                    <Badge className="bg-[rgba(45,90,69,0.1)] text-[#2d5a45] dark:bg-[rgba(45,90,69,0.1)] dark:text-[#2d5a45]">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">HTTPS</span>
                    <Badge className="bg-[rgba(45,90,69,0.1)] text-[#2d5a45] dark:bg-[rgba(45,90,69,0.1)] dark:text-[#2d5a45]">
                      Activé
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Rate limiting</span>
                    <Badge className="bg-[rgba(45,90,69,0.1)] text-[#2d5a45] dark:bg-[rgba(45,90,69,0.1)] dark:text-[#2d5a45]">
                      Activé
                    </Badge>
                  </div>
                </div>
                <Separator className="bg-border" />
                <Button variant="outline" className="w-full border-border">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurer la sécurité
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="pt-[25.148px] px-[25.148px] pb-[1.155px]">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="flex items-center gap-2 text-base font-normal text-foreground">
                <Clock className="w-5 h-5" />
                Logs système
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground font-normal">Consultation et gestion des logs système</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <div className="font-medium text-sm text-foreground">Logs d'application</div>
                    <div className="text-xs text-muted-foreground">Dernière mise à jour: Il y a 5 min</div>
                  </div>
                  <Button variant="outline" size="sm" className="border-border" asChild>
                    <a href={`/${ADMIN_BASE_PATH}/logs`}>Voir les logs</a>
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <div className="font-medium text-sm text-foreground">Logs d'erreur</div>
                    <div className="text-xs text-muted-foreground">12 erreurs dans les dernières 24h</div>
                  </div>
                  <Button variant="outline" size="sm" className="border-border">Voir les erreurs</Button>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <div className="font-medium text-sm text-foreground">Logs d'accès</div>
                    <div className="text-xs text-muted-foreground">1250 accès aujourd'hui</div>
                  </div>
                  <Button variant="outline" size="sm" className="border-border">Voir les accès</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Backup Dialog */}
      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une sauvegarde</DialogTitle>
            <DialogDescription>
              Créer une sauvegarde complète de la base de données. Cette opération peut prendre
              plusieurs minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                La sauvegarde sera stockée sur le serveur. Assurez-vous d'avoir suffisamment
                d'espace disque disponible.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBackupDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleBackup}>
              <Download className="w-4 h-4 mr-2" />
              Créer la sauvegarde
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurer une sauvegarde</DialogTitle>
            <DialogDescription>
              Restaurer la base de données à partir d'une sauvegarde. Cette opération est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Attention</AlertTitle>
              <AlertDescription>
                Cette action va remplacer toutes les données actuelles par celles de la sauvegarde.
                Assurez-vous d'avoir créé une sauvegarde récente avant de continuer.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="backupFile">Fichier de sauvegarde</Label>
              <input
                id="backupFile"
                type="file"
                accept=".sql,.backup"
                className="w-full text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleRestore}>
              <Upload className="w-4 h-4 mr-2" />
              Restaurer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Cache Dialog */}
      <Dialog open={clearCacheDialogOpen} onOpenChange={setClearCacheDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vider le cache</DialogTitle>
            <DialogDescription>
              Vider tout le cache système. Les performances peuvent être temporairement réduites
              jusqu'à ce que le cache soit régénéré.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearCacheDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleClearCache}>
              <Trash2 className="w-4 h-4 mr-2" />
              Vider le cache
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

