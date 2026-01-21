/**
 * FICHIER: reports/page.tsx
 *
 * DESCRIPTION:
 * Page de gestion des signalements pour l'admin.
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, CheckCircle, Ban, Filter, Eye, AlertTriangle, User, Package, ArrowLeftRight } from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
import { ADMIN_BASE_PATH } from '@/lib/admin.config';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ResponsiveTable } from '@/components/admin/ResponsiveTable';

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [resolvedFilter, setResolvedFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [banUser, setBanUser] = useState(false);
  const [deleteItem, setDeleteItem] = useState(false);
  const [archive, setArchive] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', page, resolvedFilter],
    queryFn: () =>
      adminApi.getReports(
        page,
        20,
        resolvedFilter === 'true' ? true : resolvedFilter === 'false' ? false : undefined
      ),
  });

  const handleResolve = async (report: any) => {
    setSelectedReport(report);
    setResolveDialogOpen(true);
  };

  const confirmResolve = async () => {
    if (!selectedReport) return;
    try {
      await adminApi.resolveReport(selectedReport.id, banUser, deleteItem, archive);
      toast.success('Signalement résolu avec succès');
      setResolveDialogOpen(false);
      setBanUser(false);
      setDeleteItem(false);
      setArchive(false);
      setSelectedReport(null);
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la résolution');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="admin-page-title">Gestion des signalements</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="admin-page-title">Signalements et modération</h1>
        <p className="admin-page-description">Gérer les signalements des utilisateurs</p>
      </div>

      {/* Stats Cards - 4 cartes selon Figma (responsive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="h-auto min-h-[90px]">
          <CardContent className="pt-4 sm:pt-5 px-4 sm:px-5 pb-4 h-full flex flex-col gap-1">
            <p className="text-xs sm:text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-4 sm:leading-5">
              Total signalements
            </p>
            <p className="text-xl sm:text-2xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-7 sm:leading-8">
              {data?.total?.toLocaleString() || '0'}
            </p>
          </CardContent>
        </Card>
        <Card className="h-auto min-h-[90px]">
          <CardContent className="pt-4 sm:pt-5 px-4 sm:px-5 pb-4 h-full flex flex-col gap-1">
            <p className="text-xs sm:text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-4 sm:leading-5">Ouverts</p>
            <p className="text-xl sm:text-2xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-7 sm:leading-8">
              {data?.reports?.filter((r: any) => !r.resolved && !r.inProgress).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="h-auto min-h-[90px]">
          <CardContent className="pt-4 sm:pt-5 px-4 sm:px-5 pb-4 h-full flex flex-col gap-1">
            <p className="text-xs sm:text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-4 sm:leading-5">En cours</p>
            <p className="text-xl sm:text-2xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-7 sm:leading-8">
              {data?.reports?.filter((r: any) => r.inProgress).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="h-auto min-h-[90px]">
          <CardContent className="pt-4 sm:pt-5 px-4 sm:px-5 pb-4 h-full flex flex-col gap-1">
            <p className="text-xs sm:text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal leading-4 sm:leading-5">
              Résolus ce mois
            </p>
            <p className="text-xl sm:text-2xl font-normal text-[#1e1e20] dark:text-[#ececed] leading-7 sm:leading-8">
              {(() => {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return (
                  data?.reports?.filter(
                    (r: any) =>
                      r.resolved &&
                      new Date(r.resolvedAt || r.updatedAt) >= startOfMonth
                  ).length || 0
                );
              })()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table - selon Figma */}
      <Card>
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4">
          {data?.reports && data.reports.length > 0 ? (
            <ResponsiveTable
              headers={[
                { key: 'reporter', label: 'Signalé par' },
                { key: 'target', label: 'Utilisateur' },
                { key: 'type', label: 'Type' },
                { key: 'severity', label: 'Gravité' },
                { key: 'status', label: 'Statut' },
                { key: 'date', label: 'Date' },
                { key: 'actions', label: 'Actions', align: 'right' },
              ]}
              rows={data.reports.map((report: any) => {
                const getTypeBadge = (type: string) => {
                  if (type === 'USER') {
                    return (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#1a1a1c] dark:bg-[#1a1a1c] text-[#9a9a9d] dark:text-[#9a9a9d]">
                        Utilisateur
                      </span>
                    );
                  }
                  if (type === 'ITEM') {
                    return (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#1a1a1c] dark:bg-[#1a1a1c] text-[#9a9a9d] dark:text-[#9a9a9d]">
                        Objet
                      </span>
                    );
                  }
                  if (type === 'EXCHANGE') {
                    return (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#1a1a1c] dark:bg-[#1a1a1c] text-[#9a9a9d] dark:text-[#9a9a9d]">
                        Échange
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#1a1a1c] dark:bg-[#1a1a1c] text-[#9a9a9d] dark:text-[#9a9a9d]">
                      {type}
                    </span>
                  );
                };
                const getSeverityBadge = (severity: string) => {
                  if (severity === 'HIGH' || severity === 'CRITICAL') {
                    return (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(220,38,38,0.1)] dark:bg-[rgba(220,38,38,0.1)] text-[#dc2626] dark:text-[#dc2626]">
                        Élevé
                      </span>
                    );
                  }
                  if (severity === 'MEDIUM') {
                    return (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(217,160,85,0.1)] dark:bg-[rgba(217,160,85,0.1)] text-[#d9a055] dark:text-[#d9a055]">
                        Moyen
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[#1a1a1c] dark:bg-[#1a1a1c] text-[#9a9a9d] dark:text-[#9a9a9d]">
                      Faible
                    </span>
                  );
                };
                const getStatusBadge = (report: any) => {
                  if (report.resolved) {
                    return (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(27,56,40,0.1)] dark:bg-[rgba(27,56,40,0.1)] text-[#1b3828] dark:text-[#1b3828]">
                        Résolu
                      </span>
                    );
                  }
                  if (report.inProgress) {
                    return (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(217,160,85,0.2)] dark:bg-[rgba(217,160,85,0.2)] text-[#d9a055] dark:text-[#d9a055]">
                        En cours
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-[rgba(217,160,85,0.1)] dark:bg-[rgba(217,160,85,0.1)] text-[#d9a055] dark:text-[#d9a055]">
                      Ouvert
                    </span>
                  );
                };
                return {
                  key: report.id,
                  cells: [
                    {
                      key: 'reporter',
                      content: (
                        <p className="text-sm font-normal text-[#1e1e20] dark:text-[#ececed] leading-5">
                          {report.reporter?.displayName || report.reporterId || 'N/A'}
                        </p>
                      ),
                    },
                    {
                      key: 'target',
                      content: (
                        <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                          {report.targetUser?.displayName || report.targetUserId || 'N/A'}
                        </p>
                      ),
                    },
                    {
                      key: 'type',
                      content: getTypeBadge(report.type || 'OTHER'),
                    },
                    {
                      key: 'severity',
                      content: getSeverityBadge(report.severity || 'LOW'),
                    },
                    {
                      key: 'status',
                      content: getStatusBadge(report),
                    },
                    {
                      key: 'date',
                      content: (
                        <p className="text-sm font-normal text-[#6f6f73] dark:text-[#9a9a9d] leading-5">
                          {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      ),
                    },
                    {
                      key: 'actions',
                      content: (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-md"
                          asChild
                        >
                          <Link href={`/${ADMIN_BASE_PATH}/reports/${report.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      ),
                    },
                  ],
                };
              })}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d]">Aucun signalement trouvé</p>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]">
              <p className="text-sm text-[#6f6f73] dark:text-[#9a9a9d] font-normal">
                Page {page} sur {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]"
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résoudre le signalement</DialogTitle>
            <DialogDescription>
              Marquer ce signalement comme résolu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReport?.targetItemId && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delete-item"
                  checked={deleteItem}
                  onCheckedChange={(checked) => setDeleteItem(checked as boolean)}
                />
                <label
                  htmlFor="delete-item"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Supprimer l'annonce signalée
                </label>
              </div>
            )}
            {selectedReport?.targetUserId && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ban-user"
                  checked={banUser}
                  onCheckedChange={(checked) => setBanUser(checked as boolean)}
                />
                <label
                  htmlFor="ban-user"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Bannir l'utilisateur ciblé
                </label>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="archive"
                checked={archive}
                onCheckedChange={(checked) => setArchive(checked as boolean)}
              />
              <label
                htmlFor="archive"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Archiver le signalement (aucune action)
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={confirmResolve}>Résoudre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

