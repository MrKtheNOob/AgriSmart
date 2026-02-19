# PROJET HACKATHON Rab'hacks : AGRISMART

# MAROC

**Concept :** Plateforme de _Precision Crop Planning_ pour l'agriculture marocaine, alignée sur la
stratégie nationale **"Génération Green 2020-2030"**.

## 1. PROBLÉMATIQUE & SOLUTION

### Défis du secteur
__Les décisions relatives à l'utilisation des terres agricoles souffrent d'un manque d'optimisation intégrée et fondée sur les données__. 
Les données climatiques, pédologiques, de rendement et d'infrastructures existent, mais elles sont fragmentées et non unifiées au sein d'un système d'aide à la décision unique.

__L'allocation des capitaux en agriculture est caractérisée par une forte incertitude et une faible visibilité des risques.__ 
Les investisseurs et les exploitants ne disposent pas d'outils standardisés pour évaluer de manière cohérente et spatialement informée l'adéquation des cultures, l'exposition au climat, les contraintes en ressources et le retour sur investissement prévisionnel.

__L'inefficience des ressources compromet la productivité et la sécurité alimentaire.__ 
Le choix sous-optimal des cultures, la mauvaise gestion des ressources et une planification réactive entraînent une baisse des rendements, des risques évitables et une diminution de la résilience agricole.

### La Solution AgriSmart

Une application interactive de type **Map-Click** utilisant un LLM (Large Language Model)
comme moteur de recommandation. Le système fusionne des données satellites et
pédologiques (sols) en temps réel pour identifier la culture la plus rentable et la plus résiliente
pour une parcelle précise.

## 2. ARCHITECTURE TECHNIQUE (STACK OPTIMISÉE)

L'architecture repose sur un Backend pivot qui agrège les données avant de les soumettre au
moteur de raisonnement.
**Composant Technologie / API Rôle
Interface** React.js + Typescript - Leaflet.js Carte interactive pour capture des coordonnées GPS (Lat/Long).
**Météo** Open-Meteo de 6 ans et prévisions d'évapotranspiration.
**Sols** iSDAsoil Données techniques : texture (Tirs, Hamri), pH et nutriments.

**Backend** Python FastAPI Le Pivot : Collecte les données API et construit le prompt contextuel.

**Raisonnement** GPT 4.1 Moteur de décision traitant le contexte "Données + Guide de
culture".


## 3. UTILISATION DU LLM (LOGIQUE DE PROMPTING)
Contrairement à un agent autonome imprévisible, nous utilisons Gemini comme un moteur de raisonnement pur via un pipeline de données rigoureux :

### 1. Extraction & Transformation :
Le Backend récupère les données brutes de sol et de climat. Il les traite pour extraire des indicateurs clés (ex: tendance au stress hydrique sur 3 mois, stabilité du pH, cumul thermique).

### 2. Le "Knowledge Template" (Prompt Contextuel)
Ces tendances sont injectées dans un template structuré qui décrit l'état actuel de la parcelle. Ce template agit comme le "brief" technique pour le LLM.

### 3. RAG (Retrieval-Augmented Generation) :
En fonction de la localisation et des tendances détectées, le système interroge une base de connaissances vectorisée contenant les guides de cultures marocains (INRA/ADA). Les extraits les plus pertinents sont joints au prompt.

Le LLM analyse la corrélation entre les tendances terrain et le référentiel RAG pour générer un plan d'action précis : Culture recommandée, Calendrier de semis optimisé et Perspectives de marché.

## 4. SCÉNARIO DE DÉMO (EXEMPLE RÉEL)


● Localisation : Sud de Settat (Région de la Chaouia).
● Analyse système : Sol de type Tirs (forte rétention d'eau) avec un déficit hydrique
actuel de 20%.
● Recommandation LLM : Pois Chiche (Variété Arifi).
● Justification : Culture de bour à cycle court (100j), tolérante à la chaleur et haute
valeur marchande à Casablanca.
● Alerte : Risque de vent chaud (Chergui) détecté pour la fin avril ; ajustement du
calendrier de récolte conseillé.

## 5. ANALYSE DE VALEUR & IMPACT

● Rendement : Augmentation prévue de +15% à +25% grâce à l'optimisation des
calendriers de semis.
● Ressources : Économie d'eau de -30% via le choix stratégique de cultures résilientes.
● Financier : Réduction du profil de risque pour les institutions financières (Crédit
Agricole du Maroc) et les assureurs (MAMDA).


