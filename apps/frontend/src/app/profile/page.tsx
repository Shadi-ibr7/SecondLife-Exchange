/**
 * FICHIER: page.tsx (Page de profil)
 *
 * DESCRIPTION:
 * Ce fichier définit la page de profil de l'utilisateur.
 * Elle permet de consulter et modifier les informations personnelles.
 *
 * FONCTIONNALITÉS:
 * - Affichage des informations du profil
 * - Mode édition pour modifier le profil
 * - Upload d'avatar
 * - Statistiques (items, échanges)
 * - Actions rapides (publier, explorer)
 * - Zone de danger (suppression de compte)
 * - Déconnexion
 *
 * SÉCURITÉ:
 * - Route protégée (nécessite authentification)
 * - Validation des données avec Zod
 * - Confirmation avant suppression de compte
 */

'use client';

// Import de React
import { useState, useEffect } from 'react';

// Import de Next.js
import { useRouter } from 'next/navigation';

// Import de Framer Motion pour les animations
import { motion } from 'framer-motion';

// Import de React Hook Form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Import de Zod pour la validation
import { z } from 'zod';

// Import des composants UI
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Import des types
import { User, UpdateProfileDto } from '@/types';

// Import du store d'authentification
import { useAuthStore } from '@/store/auth';

// Import de react-hot-toast
import { toast } from 'react-hot-toast';

// Import des icônes
import {
  User as UserIcon,
  Mail,
  MapPin,
  Edit3,
  LogOut,
  Trash2,
} from 'lucide-react';

// Import des composants
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import ProtectedRoute from '../(auth)/protected';

/**
 * SCHÉMA DE VALIDATION: profileSchema
 *
 * Définit les règles de validation pour le formulaire de profil.
 */
const profileSchema = z.object({
  displayName: z
    .string()
    .min(3, "Le nom d'affichage doit contenir au moins 3 caractères"),
  bio: z.string().optional(), // Biographie optionnelle
  location: z.string().optional(), // Localisation optionnelle
  avatarUrl: z.string().url('URL invalide').optional().or(z.literal('')), // URL d'avatar optionnelle
});

/**
 * TYPE: ProfileForm
 *
 * Type TypeScript dérivé du schéma Zod.
 */
type ProfileForm = z.infer<typeof profileSchema>;

/**
 * COMPOSANT: ProfilePageContent
 *
 * Contenu principal de la page de profil.
 * Enveloppé dans ProtectedRoute pour sécuriser l'accès.
 */
function ProfilePageContent() {
  // ============================================
  // RÉCUPÉRATION DES HOOKS ET STORES
  // ============================================

  /**
   * Récupération des fonctions et de l'état depuis le store d'authentification.
   */
  const { user, updateProfile, logout, deleteAccount, isLoading } =
    useAuthStore();

  /**
   * Hook Next.js pour la navigation programmatique.
   */
  const router = useRouter();

  // ============================================
  // GESTION DE L'ÉTAT LOCAL
  // ============================================

  /**
   * État pour contrôler le mode édition (true = édition, false = consultation).
   */
  const [isEditing, setIsEditing] = useState(false);

  // ============================================
  // CONFIGURATION DU FORMULAIRE
  // ============================================

  /**
   * Configuration de React Hook Form avec validation Zod.
   */
  const {
    register, // Fonction pour enregistrer les champs
    handleSubmit, // Fonction pour gérer la soumission
    formState: { errors }, // Erreurs de validation
    reset, // Fonction pour réinitialiser le formulaire
    setValue, // Fonction pour définir les valeurs programmatiquement
    watch, // Fonction pour observer les valeurs
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema), // Utiliser Zod pour la validation
    defaultValues: {
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      location: user?.location || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  /**
   * Observer la valeur de avatarUrl pour la passer à AvatarUpload.
   */
  const avatarUrl = watch('avatarUrl');

  // ============================================
  // EFFET: Synchronisation avec l'utilisateur
  // ============================================

  /**
   * Synchronise le formulaire avec les données de l'utilisateur
   * quand l'utilisateur change.
   */
  useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName || '',
        bio: user.bio || '',
        location: user.location || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user, reset]);

  // ============================================
  // FONCTION: onSubmit
  // ============================================

  /**
   * Fonction appelée lors de la soumission du formulaire.
   *
   * @param data - Données du formulaire validées
   */
  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile(data);
      toast.success('Profil mis à jour avec succès !');
      setIsEditing(false); // Désactiver le mode édition
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil');
    }
  };

  // ============================================
  // FONCTION: handleLogout
  // ============================================

  /**
   * Gère la déconnexion de l'utilisateur.
   */
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Déconnexion réussie');
      router.push('/'); // Rediriger vers la page d'accueil
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  // ============================================
  // FONCTION: handleDeleteAccount
  // ============================================

  /**
   * Gère la suppression du compte.
   *
   * ATTENTION: Cette action est irréversible!
   * Une confirmation est demandée via AlertDialog avant exécution.
   */
  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      toast.success('Compte supprimé avec succès');
      router.push('/'); // Rediriger vers la page d'accueil
    } catch (error) {
      toast.error('Erreur lors de la suppression du compte');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">Mon Profil</h1>
              <p className="text-muted-foreground">
                Gérez vos informations personnelles et vos préférences
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Profil principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Informations personnelles
                  </CardTitle>
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    {isEditing ? 'Annuler' : 'Modifier'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Avatar et nom */}
                  <div className="flex items-center gap-4">
                    <AvatarUpload
                      currentAvatarUrl={avatarUrl || user?.avatarUrl}
                      displayName={user?.displayName || ''}
                      onUploadComplete={(url) => setValue('avatarUrl', url)}
                      disabled={!isEditing}
                    />
                    <div>
                      <h2 className="text-2xl font-semibold">
                        {user.displayName}
                      </h2>
                      <p className="text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="mt-1">
                        Membre depuis {new Date(user.createdAt).getFullYear()}
                      </Badge>
                    </div>
                  </div>

                  {/* Informations */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Email
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Localisation
                      </label>
                      {isEditing ? (
                        <div className="mt-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <Input
                            {...register('location')}
                            placeholder="Votre localisation"
                          />
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{user.location || 'Non précisée'}</span>
                        </div>
                      )}
                      {errors.location && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.location.message}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Nom d'affichage
                      </label>
                      {isEditing ? (
                        <Input
                          {...register('displayName')}
                          placeholder="Votre nom d'affichage"
                          className="mt-1"
                        />
                      ) : (
                        <span className="mt-1 block">{user.displayName}</span>
                      )}
                      {errors.displayName && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.displayName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Biographie
                    </label>
                    {isEditing ? (
                      <textarea
                        {...register('bio')}
                        placeholder="Parlez-nous de vous..."
                        className="mt-1 min-h-[100px] w-full resize-none rounded-md border border-input bg-background p-3 text-sm"
                      />
                    ) : (
                      <p className="mt-1 text-sm">
                        {user.bio || 'Aucune biographie renseignée'}
                      </p>
                    )}
                    {errors.bio && (
                      <p className="mt-1 text-sm text-destructive">
                        {errors.bio.message}
                      </p>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                      >
                        Annuler
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Statistiques */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Objets publiés
                  </span>
                  <Badge variant="secondary">0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Échanges initiés
                  </span>
                  <Badge variant="secondary">0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Échanges reçus
                  </span>
                  <Badge variant="secondary">0</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" asChild>
                  <a href="/explore">Publier un objet</a>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/explore">Explorer les objets</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">
                  Zone de danger
                </CardTitle>
                <CardDescription>
                  Actions irréversibles sur votre compte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer mon compte
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Êtes-vous absolument sûr ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action ne peut pas être annulée. Cela supprimera
                        définitivement votre compte et toutes les données
                        associées de nos serveurs.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer définitivement
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
