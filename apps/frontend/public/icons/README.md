# Icônes PWA

Ce dossier contient les icônes nécessaires pour la PWA SecondLife Exchange.

## Icônes actuellement utilisées par le manifest

Le fichier `public/manifest.webmanifest` référence les icônes suivantes :

- `icon-192.png` - 192x192px
- `icon-512.png` - 512x512px
- `maskable-512.png` - 512x512px (maskable)

Ces fichiers existent dans ce dossier mais sont actuellement des **placeholders texte** :  
remplacez-les par de **véritables fichiers PNG** en conservant les mêmes noms.

## Autres icônes recommandées

Pour une PWA plus complète, vous pouvez également générer :

- `icon-72x72.png` - 72x72px
- `icon-96x96.png` - 96x96px  
- `icon-128x128.png` - 128x128px
- `icon-144x144.png` - 144x144px
- `icon-152x152.png` - 152x152px
- `icon-192x192.png` - 192x192px
- `icon-384x384.png` - 384x384px
- `icon-512x512.png` - 512x512px

## Génération des icônes

Vous pouvez utiliser des outils comme :
- [PWA Builder](https://www.pwabuilder.com/imageGenerator)
- [Favicon Generator](https://realfavicongenerator.net/)
- [PWA Icon Generator](https://tools.crawlink.com/tools/pwa-icon-generator/)

## Design recommandé

- **Couleur principale** : #000000 (noir)
- **Couleur secondaire** : #ffffff (blanc)
- **Style** : Moderne, minimaliste
- **Éléments** : Symbole d'échange ou de recyclage
- **Format** : PNG avec transparence

---

## Guide rapide de vérification PWA après déploiement

1. Vérifier les URLs suivantes (doivent **retourner des fichiers**, pas une page HTML de login) :
   - `/manifest.webmanifest`
   - `/icons/icon-192.png`
   - `/icons/icon-512.png`
   - `/sw.js` (généré par `next-pwa` en production)
2. Dans Chrome DevTools :
   - Onglet **Application → Manifest** : vérifier le manifest et les icônes.
   - Onglet **Application → Service Workers** : vérifier que le service worker est bien installé/activé.
3. Lancer un audit **Lighthouse** en cochant la catégorie **Progressive Web App**.

