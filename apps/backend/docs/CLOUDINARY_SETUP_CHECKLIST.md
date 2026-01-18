# Checklist de Configuration Cloudinary

Cette checklist vous guide pas à pas pour configurer le preset Cloudinary sécurisé dans le dashboard.

## ⚠️ Important

- Le preset doit être configuré en mode **"Signed" uniquement** (unsigned désactivé)
- Cela garantit qu'aucun upload ne peut être fait sans signature générée par notre backend
- Les tests dans `test-upload-endpoints.sh` vérifieront que les endpoints fonctionnent correctement

## 📋 Étapes de Configuration

### 1. Accéder au Dashboard Cloudinary

- [ ] Ouvrir https://cloudinary.com/console dans votre navigateur
- [ ] Se connecter avec vos identifiants Cloudinary
- [ ] Accéder à **Settings** (⚙️ dans le menu de gauche)

### 2. Aller dans la Section Upload Presets

- [ ] Dans Settings, cliquer sur **Upload** dans le menu de gauche
- [ ] Aller à la section **Upload presets**
- [ ] Choisir entre :
  - **Modifier le preset existant** (`ml_default` si c'est celui utilisé)
  - **Créer un nouveau preset** (`secondlife_secure`)

### 3. Configuration du Preset

#### 🔐 Signing Mode (CRITIQUE)

- [ ] **Vérifier que "Signed" est ACTIVÉ**
- [ ] **Vérifier que "Allow unsigned uploads" est DÉSACTIVÉ**
- [ ] ⚠️ **Cette étape est critique pour la sécurité**

#### 📁 Folder

- [ ] Laisser le champ **vide** (sera défini dynamiquement dans la signature)

#### 🖼️ Resource Type

- [ ] Sélectionner **Image** uniquement

#### 📏 Max File Size

- [ ] Définir à **5 MB** (5242880 bytes)
- [ ] Ou utiliser le champ si disponible : `5242880`

#### ✅ Allowed Formats

- [ ] Cocher uniquement :
  - ☑️ **jpg** / **jpeg**
  - ☑️ **png**
  - ☑️ **webp**
- [ ] ❌ Décocher tous les autres formats

#### 🎨 Transformations

Si le preset supporte les transformations par défaut :

- [ ] Ajouter la transformation : `f_webp,q_auto,w_800,h_600,c_fill`
- [ ] Ou laisser vide (les transformations sont dans la signature)

#### 📝 Nom du Preset

- [ ] Si nouveau preset : nommer `secondlife_secure`
- [ ] Si modification : noter le nom actuel

### 4. Sauvegarder

- [ ] Cliquer sur **Save** ou **Update preset**
- [ ] Vérifier le message de confirmation

### 5. Vérification

Après la configuration, vérifier que :

- [ ] Le preset est listé dans la section Upload presets
- [ ] Le mode "Signed" est indiqué
- [ ] Les formats autorisés sont corrects

## 🧪 Tests Après Configuration

Une fois le preset configuré, exécuter les tests :

```bash
cd apps/backend
./scripts/test-upload-endpoints.sh
```

Les tests vérifieront :

1. ✅ Endpoint sign avec authentification valide → 200
2. ✅ Endpoint sign sans authentification → 401
3. ✅ Endpoint sign avec folder invalide → 400
4. ✅ Ancien endpoint fonctionne toujours → 200
5. ✅ Signature pour items/<itemId> avec ownership → 200

## 📚 Documentation Complète

Pour plus de détails, voir : `docs/CLOUDINARY_SECURE_PRESET.md`

## ⚡ Note Rapide

**Pour tester immédiatement sans configurer le preset** :

Les endpoints backend fonctionnent déjà avec validation. Le preset Cloudinary n'est utilisé que si vous utilisez des uploads "unsigned" (ce qui n'est pas le cas dans notre implémentation).

Les tests backend vérifient que :
- La signature est générée correctement
- Les validations d'ownership fonctionnent
- Les limites (taille, formats) sont respectées
