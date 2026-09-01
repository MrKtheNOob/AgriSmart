# **Direction Produit AgriSmart (Source of Truth)**

## **Mission**

**AgriSmart** existe pour aider les acteurs du secteur agricole à prendre de meilleures décisions basées sur des faits probants, en transformant des données environnementales, climatiques et agronomiques fragmentées en intelligence opérationnelle.

L'objectif n'est pas de créer un autre chatbot IA ou un simple moteur de recommandation. L'objectif est de **réduire l'incertitude** avant que des décisions agricoles importantes ne soient prises.

## **Philosophie Fondamentale du Produit**

### **Devise interne**

> *« Maîtriser la couche de décision agricole, pas la couche de recommandation. »*

Une recommandation seule a peu de valeur si les utilisateurs ne peuvent ni la comprendre ni lui faire confiance.

Notre responsabilité est de fournir les preuves, le contexte et les directives opérationnelles qui permettent aux utilisateurs de répondre en toute confiance à :

> **« Devrais-je faire cela ? »**

Chaque fonctionnalité doit renforcer la confiance dans une décision plutôt que de simplement rendre l'application plus « intelligente » en apparence.

### **Filtre Produit**

Chaque fonctionnalité proposée doit répondre à la question suivante :

> **Cette fonctionnalité réduit-elle l'incertitude avant qu'une décision agricole ne soit prise ?**

* **Si la réponse est OUI :** Elle a sa place dans la feuille de route (*roadmap*) du produit.  
* **Si la réponse est NON :** Elle est probablement cosmétique, distrayante ou doit être dépriorisée.

## **Architecture Produit**

### **Couche 1 — Preuves (Socle Factuel)**

Cette couche rassemble des informations agricoles fiables provenant de sources sûres.

**Exemples :**

* Caractéristiques du sol  
* Données climatiques historiques et prévisionnelles  
* Disponibilité en eau  
* Besoins des cultures  
* Informations sur les marchés  
* Observations satellitaires  
* Connaissances agronomiques  
* Ensembles de données officiels

*L'objectif de cette couche n'est pas de générer des recommandations, mais de bâtir le socle factuel sur lequel reposent les décisions.*

### **Couche 2 — Intelligence Décisionnelle**

C'est le cœur d'AgriSmart. Le système combine plusieurs sources de preuves pour aider les utilisateurs à évaluer leurs options avant d'investir du temps, du travail ou de l'argent.

**Cette couche doit répondre à des questions telles que :**

* Cette culture est-elle adaptée à cet emplacement ?  
* Quelle est la meilleure fenêtre de plantation ?  
* Quels risques dois-je anticiper ?  
* Quel est le niveau de confiance de cette recommandation ?  
* Quelles preuves soutiennent cette conclusion ?  
* Quels sont les compromis entre les différentes cultures ?  
* Que se passe-t-il selon différents scénarios climatiques ?

*L'objectif est de transformer des données brutes en une intelligence décisionnelle compréhensible.*

### **Couche 3 — Exécution Opérationnelle**

Une fois la décision prise, AgriSmart devient un assistant d'exécution. Plutôt que de demander *« Que devrais-je planter ? »*, l'utilisateur demande désormais :

> **« Comment maximiser mes chances de réussite ? »**

**Exemples :**

* Calendrier de plantation  
* Calendrier d'irrigation  
* Planning de fertilisation  
* Directives par stade de croissance  
* Alertes ravageurs et maladies  
* Vérification de la préparation des sols  
* Listes de contrôle opérationnelles (*checklists*)

*Cette couche protège l'investissement réalisé après la prise de décision.*

## **Piliers Fondamentaux du Produit**

### **1\. Timing de Décision**

Aider les utilisateurs à déterminer le moment optimal pour agir grâce aux prévisions climatiques, aux fenêtres de plantation et aux tendances saisonnières.

*Mises en œuvre possibles :*

* Graphiques de synchronisation climatique  
* Calendriers saisonniers  
* Visualisations chronologiques (frises)  
* Indicateurs de risques météorologiques

### **2\. Confiance & Explicabilité**

Chaque recommandation doit être explicable. Les utilisateurs doivent toujours comprendre :

* D'où proviennent les données  
* De quand elles datent (fraîcheur des données)  
* Quelles hypothèses ont été émises  
* Quelles informations sont manquantes  
* Quel est le niveau de confiance du système  
* Pourquoi une recommandation prévaut sur une autre

> *La confiance est une fonctionnalité du produit à part entière.*

### **3\. Impact Décisionnel**

Différents utilisateurs cherchent à optimiser différents résultats. Le système doit exposer les conséquences de chaque décision à l'aide de métriques adaptées au contexte de l'utilisateur.

*Exemples :*

* Rendement escompté  
* Rentabilité  
* Besoins en eau  
* Résilience climatique  
* Opportunités de marché  
* Contribution à la sécurité alimentaire  
* Impact environnemental

*Différents types d'utilisateurs peuvent prioriser des indicateurs différents.*

### **4\. Analyse de Scénarios**

Le système doit encourager l'exploration plutôt que de fournir une réponse unique.

*Exemples :*

* Comparer deux cultures  
* Comparer deux emplacements  
* Évaluer des scénarios de sécheresse  
* Évaluer l'irrigation par rapport à la culture pluviale  
* Évaluer les conditions climatiques changeantes

*L'objectif est d'accompagner des décisions éclairées, et non de simplement générer des recommandations.*

## **Flux Produit**

Plaintext

Données Brutes

      ↓

Intégration des Preuves

      ↓

Intelligence Décisionnelle

      ↓

Plan Opérationnel

AgriSmart ne s'arrête pas à la recommandation d'une culture. Son objectif est de guider les utilisateurs, des données brutes jusqu'à l'action en toute confiance.

## **Principes de Conception**

Lors de la conception des fonctionnalités :

* **Privilégier les preuves** plutôt que l'apparence.  
* **Privilégier la clarté** plutôt que la complexité.  
* **Privilégier la confiance** plutôt que la nouveauté.  
* **Privilégier la qualité de la décision** plutôt que les démonstrations d'IA.  
* Chaque écran doit réduire l'incertitude.  
* Chaque recommandation doit être explicable.  
* Chaque analyse doit rapprocher l'utilisateur d'une décision prise en toute confiance.

## **Ce que Nous ne Prioriserons Pas**

Les éléments suivants ne sont **pas des priorités stratégiques**, sauf s'ils améliorent directement la qualité des décisions :

* Interfaces de chat IA  
* Animations visuelles complexes  
* Assistants vocaux  
* Améliorations cosmétiques de l'interface utilisateur  
* Fonctionnalités mettant en valeur l'IA sans améliorer la prise de décision

Ces éléments pourront s'avérer utiles à l'avenir, mais ils restent secondaires par rapport à notre mission principale.

## **Vision à Long Terme**

AgriSmart n'est pas simplement une application de recommandation de cultures. C'est une **plateforme d'intelligence décisionnelle agricole**.

L'objectif à long terme est de devenir la **couche décisionnelle de référence pour l'agriculture**, au service des différents acteurs — notamment les agriculteurs, coopératives, entreprises agroalimentaires, ONG, investisseurs et institutions publiques — grâce au même moteur décisionnel basé sur des faits probants.

Chaque future fonctionnalité devra renforcer cette vision.

