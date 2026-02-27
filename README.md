# AgriSmart — Precision Crop Planning for Smart Agriculture

## 📍 Analyse de l'Adéquation des Terres & Conseil Agricole Intelligent

**AgriSmart** est une plateforme d'aide à la décision stratégique pour l'agriculture marocaine. En fusionnant des données géospatiales de précision, l'intelligence artificielle (LLM) et une base de connaissances agronomiques locale (RAG), AgriSmart transforme une simple coordonnée GPS en un rapport complet d'évaluation environnementale.

---

## 1. PROBLÉMATIQUE & SOLUTION

### Les Défis du Secteur
*   **Fragmentation des données :** Les données climatiques et pédologiques existent mais sont dispersées, empêchant une vision holistique.
*   **Incertitude d'investissement :** Les agriculteurs et investisseurs manquent d'outils standardisés pour évaluer les risques climatiques et la rentabilité d'une parcelle.
*   **Inefficience des ressources :** Le choix sous-optimal des cultures entraîne un gaspillage d'eau et une baisse des rendements.

### La Solution AgriSmart
Une interface interactive **Map-Click** qui génère instantanément un **Rapport d'Évaluation Environnementale**. Le système s'appuie sur le **Moteur AgriSmart (Engine)** pour identifier les cultures les plus résilientes et rentables en fonction du profil spécifique du sol et des tendances climatiques historiques.

---

## 2. FONCTIONNALITÉS CLÉS

### 🗺️ Carte Interactive à Précision Dynamique
*   **Navigation Intuitive :** Sélection de parcelles par clic sur carte.
*   **Zoom de Précision :** Passage dynamique d'une vue par **Régions** à une vue détaillée par **Provinces** pour une identification précise des actifs.
*   **Identité de Site :** Capture et affichage immédiat des coordonnées GPS précises (Lat/Lng).

### 🧪 Profilage de Sol (iSDAsoil)
*   Analyse des propriétés physico-chimiques : pH, carbone organique, texture (Tirs, Hamri, etc.).
*   Évaluation de la capacité d'échange cationique et des nutriments.

### 🌦️ Analyse Climatique Avancée (Open-Meteo)
*   **Statistiques Historiques :** Analyse sur plusieurs années des précipitations et températures moyennes.
*   **Indicateurs de Risque :** Détection automatique des jours de forte chaleur et des jours de gel annuels.

### 🤖 Moteur de Recommandation IA (RAG + LLM)
*   **RAG (Retrieval-Augmented Generation) :** Interrogation d'une base de connaissances vectorisée contenant les guides de culture de l'INRA et de l'ADA.
*   **Analyse de Land Suitability :** Génération de recommandations personnalisées avec justifications techniques basées sur la compatibilité sol-climat.

---

## 3. ARCHITECTURE TECHNIQUE

L'application repose sur une stack moderne et performante :

| Composant | Technologie / API | Rôle |
| :--- | :--- | :--- |
| **Frontend** | React.js, TypeScript, Leaflet, Tailwind CSS | Interface utilisateur et visualisation cartographique. |
| **Backend** | Python, FastAPI | Pivot de données et orchestration des services. |
| **Base de Données Vectorielle** | ChromaDB | Stockage et récupération des guides agronomiques. |
| **Intelligence Artificielle** | LangChain, LLM (Gemini/GPT) | Moteur de raisonnement et synthèse des recommandations. |
| **Données Sols** | iSDAsoil API | Données pédologiques à haute résolution (30m). |
| **Données Climat** | Open-Meteo API | Historique et prévisions météorologiques précises. |

---

## 4. INSTALLATION & LANCEMENT

### Prérequis
*   Node.js (v18+)
*   Python (v3.10+)
*   Clé API pour le LLM (configurée dans `.env`)

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
# Créer et activer l'environnement virtuel
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 5. ANALYSE DE VALEUR & IMPACT

*   **Optimisation du Rendement :** Augmentation prévue de **+15% à +25%** via une planification scientifiquement informée.
*   **Résilience Hydrique :** Économie d'eau de **-30%** par le choix de cultures adaptées au stress hydrique local.
*   **Sérieux de l'Actif :** Fournit un rapport d'évaluation prêt pour les institutions financières et les assureurs (Crédit Agricole, MAMDA).

---
*Projet développé dans le cadre du Hackathon Rab'hacks.*
