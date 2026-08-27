# Database Ownership

## Governing rule

Each deployable service owns its schema, migrations, and write authority. Other services integrate through a documented API or event, never by sharing application database credentials. Redis, object stores, and search engines are also owned by namespace/index/bucket, even when physically shared.

## Ownership inventory

| Data domain / store | Owner | Evidence | Authorized writers | Access from other services |
|---|---|---|---|---|
| FHIR clinical resources and terminology | `bezs-emr-core` | SQLAlchemy models; Alembic under `migrations/` | EMR core | REST through EMR core/gateway |
| Family care, documents metadata, notifications, outbox | `kinguardian-backend` | `app/domains/family/infrastructure/models.py`, `domains/events/models.py` | Kinguard backend worker/API | its API/events; FileNest ID is a reference only |
| File metadata, projects, upload sessions, webhooks, outbox | FileNest backend | backend Alembic migrations and `app/models/` | FileNest backend | FileNest API/SDKs |
| IAM users, sessions, OAuth/app metadata | each IAM deployment (`bezs-iam`, FileNest IAM, Observability IAM) | separate Prisma schemas | respective IAM service | auth/OIDC/API boundary only; no assumed shared identity database |
| HMS application data | `bezs-hms` | Prisma schema/migrations | HMS | HMS APIs / FHIR gateway for clinical data |
| Wearable users, connections, data points and summaries | `open-wearables` backend | `backend/app/models/`, Alembic migrations | Wearables API/Celery | Wearables REST/events; translate before EMR persistence |
| Observability telemetry | observability analytics pipeline | ClickHouse migrations under `infrastructure/clickhouse` | gateway/analytics pipeline as configured | console/realtime read paths; APIs/SDKs for producers |
| Observability IAM/API-key PostgreSQL | observability IAM | IAM Prisma schema, Go service configs | IAM service | gateway/realtime validate keys with narrowly scoped read access today; replace with an auth API where feasible |
| Pipeline indexes/embeddings | `bezs-pipeline` | loaders/connectors and README | pipeline jobs | query endpoint/adapter, not a clinical source of truth |
| Redis | service-owned logical namespaces | multiple Compose/config files | owning service only | no unnamespaced or cross-domain key access |

## Migration authority

- `bezs-emr-core` and FileNest backend use Alembic migration trees.
- `kinguardian-backend` runs Alembic from its development Compose command.
- IAM and HMS use Prisma schemas/migrations.
- Open Wearables has backend migrations and Compose-managed service startup.
- Observability has PostgreSQL and ClickHouse SQL migration directories.

Only the owner’s deployment pipeline should run its migrations. Production migration execution should be separate from normal application startup where a rollback/approval gate is needed.

## Required integration patterns

```text
Allowed:    consumer -> owner API/event -> owner repository -> owner database
Forbidden:  consumer -------------------------------> owner database
```

For events, producers retain an outbox/idempotency record and consumers store their own projection/reference. A consumer must not recreate a foreign aggregate as an unmanaged shared record.

## Open risks to resolve

1. The observability gateway and realtime service are configured to read the IAM PostgreSQL database for API-key validation. Make that read-only role explicit now; later replace it with a versioned IAM validation endpoint or cache.
2. Database names, versions, and tenancy models vary across Compose files and are deployment configuration, not platform-wide contracts. Record them in environment-specific operations documentation rather than treating default values as canonical.
3. `kinguardian-backend` connects to both its own PostgreSQL database and external service URLs. Establish which data is canonical in family-care vs. FHIR before adding synchronization.
