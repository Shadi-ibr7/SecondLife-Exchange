/**
 * FICHIER: reports/page.tsx
 *
 * DESCRIPTION:
 * Page de gestion des signalements pour l'admin.
 */

'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, CheckCircle, Ban, Filter } from 'lucide-react';
import { adminApi } from '@/lib/admin.api';
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

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [resolvedFilter, setResolvedFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [banUser, setBanUser] = useState(false);

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
      await adminApi.resolveReport(selectedReport.id, banUser);
      toast.success('Signalement résolu avec succès');
      setResolveDialogOpen(false);
      setBanUser(false);
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
          <h1 className="text-2xl font-medium mb-1">Gestion des signalements</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium mb-1">Gestion des signalements</h1>
        <p className="text-muted-foreground">Gérer les signalements des utilisateurs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total signalements</CardDescription>
            <CardTitle className="text-2xl">{data?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Non résolus</CardDescription>
            <CardTitle className="text-2xl">
              {data?.reports?.filter((r: any) => !r.resolved).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Résolus</CardDescription>
            <CardTitle className="text-2xl">
              {data?.reports?.filter((r: any) => r.resolved).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Page actuelle</CardDescription>
            <CardTitle className="text-2xl">{page}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="false">Non résolus</SelectItem>
                <SelectItem value="true">Résolus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des signalements</CardTitle>
          <CardDescription>
            {data?.total || 0} signalement{data?.total !== 1 ? 's' : ''} au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Utilisateur ciblé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.reports?.map((report: any) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Badge variant="secondary">{report.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md truncate">{report.message}</div>
                  </TableCell>
                  <TableCell>
                    {report.targetUserId ? (
                      <span className="text-sm">ID: {report.targetUserId}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {report.resolved ? (
                      <Badge variant="default">Résolu</Badge>
                    ) : (
                      <Badge variant="destructive">Non résolu</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right">
                    {!report.resolved && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleResolve(report)}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} sur {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
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

