# Frontend AgriSmart

Interface React, TypeScript et Vite pour explorer une carte du Sénégal et consulter les analyses agronomiques.

## Démarrage

Depuis `frontend/`, créer `.env` :

```dotenv
VITE_BASE_URL=http://localhost:8000
```

Puis, avec Node.js 22.12+ :

```bash
npm ci
npm run dev
```

Ouvrir `http://localhost:5173` et démarrer le [backend](../README.md#backend) pour lancer des analyses. Redémarrer Vite après une modification des variables d'environnement.

## Organisation

- `src/pages/` : accueil et carte.
- `src/components/` : interface et affichage du rapport.
- `src/hooks/useMapLogic.ts` : sélection du point et réception des événements SSE.
- `src/services/telemetry.ts` : suivi des visites et téléchargements.
- `src/assets/` : données cartographiques et ressources locales.

La carte utilise Leaflet et une couche de [zones agroécologiques](src/assets/senegal_agroecological_zones.md). Le guide principal décrit le [pipeline d'analyse](../README.md#du-point-sur-la-carte-au-résultat).

## Vérification et compilation

```bash
npm run lint
npm run build
npm run preview
```

La compilation produit les fichiers statiques dans `dist/`. L'URL de l'API est intégrée au moment de la compilation via `VITE_BASE_URL`.
