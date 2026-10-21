# AgriSmart

**Aide au choix des cultures à partir du sol et du climat au Sénégal.**

AgriSmart transforme un point sélectionné sur une carte en un profil environnemental, un classement de cultures et des explications agronomiques. Le classement repose sur des règles déterministes. Une base de connaissances et un modèle de langage apportent ensuite le contexte et les risques associés.

## Fonctionnalités

- Carte interactive du Sénégal et couche de zones agroécologiques.
- Profil du sol issu d'iSDAsoil : propriétés, texture et classification locale.
- Profil climatique historique mensuel provenant du jeu de données local.
- Estimation de la rétention d'eau du sol.
- Trois cultures classées avec leurs scores sol, climat et global.
- Explications agronomiques en français et suivi de progression de l'analyse.

## Du point sur la carte au résultat

L'analyse suit un pipeline en quatre étapes : acquisition des données environnementales, préparation des profils, classement agronomique et génération des explications. Le classement des cultures est déterministe ; le modèle de langage intervient uniquement pour contextualiser les résultats.

```mermaid
flowchart TB
    Point["Point sélectionné sur la carte"]
    API["API FastAPI"]

    subgraph Sources["1. Acquisition des données"]
        direction LR
        Soil["iSDAsoil et zones agroécologiques"]
        Climate["Station climatique la plus proche"]
        Crops["Exigences des cultures (JSON)"]
    end

    subgraph Processing["2. Préparation des données"]
        direction LR
        SoilProfile["Profil du sol"]
        ClimateProfile["Historique climatique sur 12 mois"]
    end

    subgraph Engine["3. Moteur agronomique"]
        direction LR
        Ranking["Classement déterministe"]
        Water["Estimation de rétention d'eau"]
        Top3["Top 3 des cultures"]
        Ranking --> Top3
    end

    subgraph AI["4. Explications assistées par IA"]
        direction LR
        Knowledge["Connaissances agronomiques (ChromaDB)"]
        LLM["Modèle de langage"]
        Knowledge --> LLM
    end

    Dashboard["Résultats dans le tableau de bord"]

    Point --> API
    API --> Soil
    API --> Climate

    Soil --> SoilProfile
    Climate --> ClimateProfile

    SoilProfile --> Ranking
    ClimateProfile --> Ranking
    Crops --> Ranking

    SoilProfile --> Water

    Top3 --> LLM
    SoilProfile --> LLM
    ClimateProfile --> LLM

    Top3 --> Dashboard
    Water --> Dashboard
    LLM --> Dashboard
```

Les données du sol et du climat sont traitées séparément avant d'être combinées par le moteur de classement. Les exigences des cultures, définies dans un catalogue JSON, servent à calculer les scores de compatibilité.

En parallèle, une estimation de la rétention d'eau est produite à partir du profil du sol, sans intervenir dans le classement.

Les trois cultures les mieux classées sont ensuite transmises au modèle de langage avec les profils environnementaux et les connaissances agronomiques récupérées depuis ChromaDB. Les explications générées complètent les résultats du moteur sans modifier les scores ni leur ordre.

Le tableau de bord rassemble les recommandations, les scores, l'estimation de rétention d'eau et les explications associées.


### Calcul des scores

Chaque culture du catalogue reçoit un score de 0 à 100 :

| Score | Calcul actuel |
| --- | --- |
| Sol | Moyenne de dix critères : nutriments, carbone organique, argile, sable, pH, capacité d'échange cationique et compatibilité des classes de sol. Chaque critère vaut 0 ou 100. |
| Climat | Moyenne des scores de température mensuelle pendant la croissance : 100 dans la plage optimale, diminution vers 50 aux limites de tolérance, 0 hors tolérance. |
| Global | `0,5 × score sol + 0,5 × score climat`. Les trois meilleurs résultats sont retenus. |

La fenêtre de croissance commence au mois UTC de la requête. Sa durée correspond à la durée maximale de croissance de la culture, divisée par 30 et arrondie au supérieur. Les températures utilisées sont des moyennes historiques mensuelles.

Le modèle de langage reçoit les cultures déjà classées et des passages pertinents de la base agronomique. Le code conserve les noms, l'ordre et les scores du moteur, puis leur associe les explications générées.

### Portée des résultats

Les scores expriment une compatibilité selon les règles et les données disponibles, pas une probabilité de réussite ni une prévision de rendement. Le score climatique utilise actuellement la température ; les précipitations sont affichées et fournies comme contexte aux explications. La rétention d'eau est une estimation simplifiée à partir du sol, séparée du classement. La rentabilité n'entre pas dans le calcul actuel.

Le climat provient de la station la plus proche dans le jeu local, et non d'une mesure à l'échelle de la parcelle ou d'une prévision météo en direct. Lorsque le fournisseur signale un terrain désertique, le parcours en streaming retourne le climat sans classement de cultures.

## Architecture

| Composant | Technologies et rôle |
| --- | --- |
| Interface | React 19, TypeScript, Vite, Leaflet et Tailwind CSS |
| API | FastAPI : orchestration du sol, du climat, des scores et des explications |
| Données locales | Feather pour le climat, JSON pour les cultures, GeoJSON pour les zones |
| Recherche documentaire | Markdown agronomique indexé dans ChromaDB avec des embeddings via OpenRouter |
| Explications | LangChain et un modèle de langage via OpenRouter |
| Télémétrie | PostgreSQL : visites, analyses et téléchargements |

L'interface utilise des événements serveur (*Server-Sent Events*, SSE) pour afficher la progression avant de recevoir le résultat complet.

```mermaid
sequenceDiagram
    actor User as Utilisateur
    participant UI as Interface React
    participant API as API FastAPI
    participant Engine as Services agronomiques
    participant DB as PostgreSQL
    User->>UI: Sélectionner un point et lancer l'analyse
    UI->>API: GET /analyze-stream?lat=...&lng=...
    API->>Engine: Analyser les coordonnées
    Engine-->>API: Étapes de progression
    API-->>UI: Événements SSE de statut
    Engine-->>API: Sol, climat, eau, scores et explications
    API->>DB: Enregistrer l'analyse
    API-->>UI: Événement SSE de résultat
    UI-->>User: Afficher le rapport
```

## Installation locale

### Prérequis

- Node.js 22.12+ et npm.
- Python 3.11 ou 3.12 et `uv` pour les dépendances du backend.
- Git LFS pour récupérer les données CSV et Feather du dépôt.
- Une base PostgreSQL accessible, un compte iSDAsoil et une clé OpenRouter permettant la génération et les embeddings.

Depuis la racine du dépôt, après clonage :

```bash
git lfs install
git lfs pull
```

### Backend

Créer `backend/.env` avec les valeurs de votre environnement :

```dotenv
DB_URI=postgresql://USER:PASSWORD@localhost:5432/agrismart
ISDA_EMAIL=your-email@example.com
ISDA_PASSWORD=your-isda-password
OPENAI_API_KEY=your-openrouter-key
```

Le nom `OPENAI_API_KEY` est celui lu par le code ; les appels sont configurés pour OpenRouter. L'option `EMBEDDING_KEY` remplace aussi cette variable dans le processus : utiliser une seule clé compatible avec les deux usages pour la configuration de base.

```bash
cd backend
uv sync --locked
uv run uvicorn main:app --reload
```

Au démarrage, le backend initialise la télémétrie dans PostgreSQL, charge les données locales et ouvre ou reconstruit l'index documentaire. Le premier démarrage peut nécessiter des appels d'embeddings. Les identifiants et les données doivent être disponibles pour que l'initialisation aboutisse.

### Frontend

Créer `frontend/.env` :

```dotenv
VITE_BASE_URL=http://localhost:8000
```

Puis, dans un second terminal :

```bash
cd frontend
npm ci
npm run dev
```

Ouvrir `http://localhost:5173`. Cette origine est autorisée par la configuration CORS locale du backend.

### Vérifications

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/analyze \
  -H 'Content-Type: application/json' \
  -d '{"lat":14.6928,"lng":-17.4467}'
```

La documentation interactive de l'API est disponible sur `http://localhost:8000/docs`. `POST /analyze` renvoie le résultat JSON complet ; `GET /analyze-stream` diffuse les étapes et le résultat. Une analyse utilise les services externes configurés.

Pour vérifier le frontend :

```bash
cd frontend
npm run lint
npm run build
```

## Organisation du dépôt

```text
frontend/src/          Interface, carte, composants et suivi des analyses
backend/main.py        Routes HTTP et cycle de vie de l'application
backend/services/     Sol, climat, classement, RAG et télémétrie
backend/shared/       Accès à la base et limitation des requêtes
backend/data/         Données sources, données traitées et connaissances RAG
backend/scripts/      Préparation et transformation des données
```

Les données du projet restent sous `backend/data/` ; les fichiers volumineux concernés sont suivis avec Git LFS.

Voir aussi les guides [backend](backend/README.md) et [frontend](frontend/README.md), ainsi que la [provenance des zones agroécologiques](frontend/src/assets/senegal_agroecological_zones.md).
