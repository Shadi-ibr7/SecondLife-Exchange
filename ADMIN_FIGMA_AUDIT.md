# Audit Admin - Mapping Figma → Code

## A) INVENTAIRE DES ROUTES ADMIN

### Routes principales identifiées

| Route | Fichier Next.js | Figma Node-ID | Description | Endpoints API utilisés |
|-------|----------------|---------------|-------------|----------------------|
| `/dashboard` | `apps/frontend/src/app/(admin)/[adminSlug]/dashboard/page.tsx` | `28-853` (light), `28-2` (dark) | Dashboard principal avec KPIs et graphiques | `getDashboardStats()`, `getAnalyticsOverview()`, `getUsers()`, `getItems()` |
| `/users` | `apps/frontend/src/app/(admin)/[adminSlug]/users/page.tsx` | `29-2945` | Liste des utilisateurs | `getUsers()`, `banUser()`, `unbanUser()` |
| `/users/[id]` | `apps/frontend/src/app/(admin)/[adminSlug]/users/[id]/page.tsx` | `29-2602` | Détails utilisateur | `getUserById()`, `banUser()`, `unbanUser()` |
| `/items` | `apps/frontend/src/app/(admin)/[adminSlug]/items/page.tsx` | `29-3288` | Liste des objets | `getItems()`, `archiveItem()`, `deleteItem()` |
| `/items/[id]` | `apps/frontend/src/app/(admin)/[adminSlug]/items/[id]/page.tsx` | `29-3568` | Détails objet | `getItemById()`, `archiveItem()`, `deleteItem()` |
| `/exchanges` | `apps/frontend/src/app/(admin)/[adminSlug]/exchanges/page.tsx` | `29-3848` | Liste des échanges | `getExchanges()`, `deleteExchange()` |
| `/exchanges/[id]` | `apps/frontend/src/app/(admin)/[adminSlug]/exchanges/[id]/page.tsx` | `29-4380` | Détails échange | `getExchangeById()`, `deleteExchange()` |
| `/reports` | `apps/frontend/src/app/(admin)/[adminSlug]/reports/page.tsx` | `29-4912` | Liste des signalements | `getReports()`, `resolveReport()`, `deleteReport()` |
| `/reports/[id]` | `apps/frontend/src/app/(admin)/[adminSlug]/reports/[id]/page.tsx` | `29-5100` | Détails signalement | `getReportById()`, `resolveReport()`, `deleteReport()` |
| `/themes` | `apps/frontend/src/app/(admin)/[adminSlug]/themes/page.tsx` | `29-5288` | Liste des thèmes IA | `getThemes()`, `createTheme()`, `updateTheme()`, `deleteTheme()` |
| `/themes/[id]` | `apps/frontend/src/app/(admin)/[adminSlug]/themes/[id]/page.tsx` | `29-5550` | Détails thème | `getThemeById()`, `updateTheme()`, `deleteTheme()` |
| `/eco` | `apps/frontend/src/app/(admin)/[adminSlug]/eco/page.tsx` | `29-5812` | Liste contenu écologique | `getEcoContent()`, `createEcoContent()`, `updateEcoContent()`, `deleteEcoContent()` |
| `/eco/[id]` | `apps/frontend/src/app/(admin)/[adminSlug]/eco/[id]/page.tsx` | `29-6106` | Détails contenu éco | `getEcoContentById()`, `updateEcoContent()`, `deleteEcoContent()` |
| `/community` | `apps/frontend/src/app/(admin)/[adminSlug]/community/page.tsx` | `29-6400` | Liste threads/posts | `getThreads()`, `getPosts()`, `deleteThread()`, `deletePost()` |
| `/community/threads/[id]` | `apps/frontend/src/app/(admin)/[adminSlug]/community/threads/[id]/page.tsx` | `29-6684` | Détails thread | `getThreadById()`, `deleteThread()` |
| `/community/posts/[id]` | `apps/frontend/src/app/(admin)/[adminSlug]/community/posts/[id]/page.tsx` | `29-6968` | Détails post | `getPostById()`, `deletePost()` |
| `/logs` | `apps/frontend/src/app/(admin)/[adminSlug]/logs/page.tsx` | `29-7323` | Liste des logs admin | `getLogs()` |
| `/logs/[id]` | `apps/frontend/src/app/(admin)/[adminSlug]/logs/[id]/page.tsx` | - | Détails log | `getLogById()` |
| `/settings` | `apps/frontend/src/app/(admin)/[adminSlug]/settings/page.tsx` | `29-6968` | Paramètres généraux | - |
| `/security` | `apps/frontend/src/app/(admin)/[adminSlug]/security/page.tsx` | `28-2220` | Sécurité et permissions | `getApiKeys()`, `createApiKey()`, `deleteApiKey()`, `getRoles()` |
| `/admins` | `apps/frontend/src/app/(admin)/[adminSlug]/admins/page.tsx` | `28-1771` | Liste administrateurs | `getAdmins()`, `createAdmin()`, `deleteAdmin()` |
| `/admins/[id]` | `apps/frontend/src/app/(admin)/[adminSlug]/admins/[id]/page.tsx` | `28-1322` | Détails administrateur | `getAdminById()`, `updateAdmin()`, `deleteAdmin()` |
| `/notifications` | `apps/frontend/src/app/(admin)/[adminSlug]/notifications/page.tsx` | - | Notifications système | - |
| `/analytics` | `apps/frontend/src/app/(admin)/[adminSlug]/analytics/page.tsx` | `28-384` | Analytics | `getAnalyticsOverview()` |
| `/analytics/reports` | `apps/frontend/src/app/(admin)/[adminSlug]/analytics/reports/page.tsx` | - | Rapports analytiques | - |
| `/dashboard/statistics` | `apps/frontend/src/app/(admin)/[adminSlug]/dashboard/statistics/page.tsx` | - | Statistiques avancées | - |
| `/system/monitoring` | `apps/frontend/src/app/(admin)/[adminSlug]/system/monitoring/page.tsx` | - | Monitoring système | - |
| `/maintenance` | `apps/frontend/src/app/(admin)/[adminSlug]/maintenance/page.tsx` | - | Maintenance système | - |
| `/login` | `apps/frontend/src/app/(admin)/[adminSlug]/login/page.tsx` | `28-2` | Page de connexion | `login()` |

### Layout Admin
- **Sidebar** : `apps/frontend/src/components/admin/AdminSidebar.tsx`
- **Header** : `apps/frontend/src/components/admin/AdminHeader.tsx`
- **Layout** : `apps/frontend/src/components/admin/AdminLayout.tsx`

## B) COMPOSANTS PARTAGÉS

### Composants UI existants (shadcn/ui)
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Button`
- `Input`, `Textarea`
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableHead`
- `Badge`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Avatar`, `AvatarImage`, `AvatarFallback`
- `Switch`
- `Checkbox`
- `Label`
- `Separator`
- `Alert`, `AlertTitle`, `AlertDescription`
- `Progress`

### Composants Admin spécifiques
- `AdminCard` : Composant card réutilisable
- `AdminSidebar` : Navigation latérale
- `AdminHeader` : Header avec profil
- `AdminLayout` : Layout principal
- `AdminGuard` : Protection des routes

## C) DESIGN SYSTEM FIGMA

### Couleurs identifiées (depuis les maquettes)

#### Light Mode
- Background principal: `#f7f7f8`
- Background card: `#ffffff`
- Text primary: `#1e1e20`
- Text secondary: `#6f6f73`
- Border: `rgba(0,0,0,0.06)`
- Primary (green): `#1b3828` / `#2d5a45`
- Shadow: `0px 1px 3px 0px rgba(0,0,0,0.1),0px 1px 2px -1px rgba(0,0,0,0.1)`

#### Dark Mode
- Background principal: `#0a0a0b` / `#1a1a1c`
- Background card: `#141416`
- Text primary: `#ececed`
- Text secondary: `#9a9a9d`
- Border: `rgba(255,255,255,0.08)`
- Primary (green): `#2d5a45`
- Shadow: `0px 1px 3px 0px rgba(0,0,0,0.1),0px 1px 2px -1px rgba(0,0,0,0.1)`

### Typographie
- Font: Inter (Regular, Medium, Bold)
- H1: 24px, font-medium, leading-36
- H2: 16px, font-regular, leading-24
- Body: 14px, font-regular, leading-20
- Small: 12px, font-regular, leading-16

### Spacing
- Padding cards: 25px (pt-25px px-25px)
- Gap sections: 16px, 24px
- Border radius: 8px (rounded-lg)
- Border radius small: 6px (rounded-md)

### Composants spécifiques
- Stats cards: 88px height, gap-8px
- Table rows: 53.5px height
- Table header: 44.5px height
- Buttons: 32px height (h-8), padding horizontal 12px
- Inputs: 40px height (h-10), padding 12px

## D) PLAN D'IMPLÉMENTATION

### Phase 1: Design System
1. ✅ Créer/ajuster les tokens CSS dans `globals.css`
2. ✅ Vérifier que les composants UI utilisent les bonnes variables
3. Créer des composants réutilisables pour les patterns répétitifs

### Phase 2: Layout Admin
1. ✅ Sidebar - déjà aligné avec Figma
2. ✅ Header - déjà aligné avec Figma
3. ✅ Layout principal - déjà aligné avec Figma

### Phase 3: Dashboard
1. ✅ KPIs cards (4 cards en grid 2x2)
2. Graphiques (Utilisateurs actifs, Objets par catégorie)
3. Table activité récente

### Phase 4: Pages de liste
1. Users
2. Items
3. Exchanges
4. Reports
5. Themes
6. Eco Content
7. Community
8. Logs
9. Admins

### Phase 5: Pages de détails
1. User detail
2. Item detail
3. Exchange detail
4. Report detail
5. Theme detail
6. Eco content detail
7. Thread detail
8. Post detail
9. Log detail
10. Admin detail

### Phase 6: Pages de configuration
1. Settings
2. Security
3. Notifications
4. Analytics
5. System Monitoring
6. Maintenance

## E) NOTES IMPORTANTES

- Tous les composants doivent être responsive
- Tous les états doivent être gérés (loading, error, empty, success)
- Les couleurs doivent respecter le mode light/dark
- Les espacements doivent être exacts selon Figma
- Les typographies doivent utiliser Inter avec les bonnes weights
- Les ombres et bordures doivent correspondre exactement

