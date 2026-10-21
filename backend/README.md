# Backend AgriSmart

API FastAPI pour le profilage environnemental et le classement des cultures au Sénégal.

## Démarrage

Suivre la [configuration locale](../README.md#backend) du guide principal pour PostgreSQL, iSDAsoil, OpenRouter et les données Git LFS, puis :

```bash
uv sync --locked
uv run uvicorn main:app --reload
```

Exécuter ces commandes depuis `backend/`, avec Python 3.11 ou 3.12.

## Points d'entrée

| Route | Fonction |
| --- | --- |
| `GET /health` | État d'initialisation des services |
| `POST /analyze` | Analyse complète ; corps JSON avec `lat`, `lng` et éventuellement `session_id` |
| `GET /analyze-stream` | Analyse SSE ; paramètres `lat`, `lng` et éventuellement `session_id` |
| `/docs` | Documentation interactive des schémas et routes |

`app_config.py` charge la configuration et les chemins de données. `service_setup.py` initialise les services et leurs connexions. `services/agronomy/agronomic_service.py` orchestre le sol, le climat, le classement, la rétention d'eau et les explications RAG.

Le climat est lu dans `data/processed/senegal_climate_monthly.feather`, les exigences des cultures dans `data/processed/crops_merged.json`, et les connaissances dans `data/RAG/knowledge_base.md`. L'index ChromaDB est généré localement. Le démarrage requiert les services configurés ; il ne s'agit pas d'un mode hors ligne.
