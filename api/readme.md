## Développement local

Les services PostgreSQL, Redis et Mailpit sont définis dans `infra/compose.yaml`.
Depuis la racine du projet :

```powershell
docker compose --env-file api/.env -f infra/compose.yaml up -d
```

Depuis le dossier `api`, démarrez l’API et le worker dans deux terminaux distincts :

```powershell
uv run fastapi dev
```

```powershell
uv run celery -A app.workers.celery_app:celery_app worker --loglevel=INFO --pool=solo
```

Le pool `solo` est adapté au développement sous Windows. En production Linux, le
pool Celery par défaut peut être utilisé avec une concurrence configurée selon les
ressources disponibles.

Les variables optionnelles associées sont :

```dotenv
CELERY_BROKER_URL=redis://127.0.0.1:6379/0
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/1
```
