# Reuse Matrix

## Scope and confidence

This is a read-only inventory of the checked-out projects as of 2026-08-24. “Observed” means backed by source, manifests, or Compose configuration; a recommendation is explicitly future-state work.

| Capability | Existing implementation(s) | Evidence | Reuse decision | Next step |
|---|---|---|---|---|
| Identity / session management | `bezs-iam`, FileNest `iam`, Observability `apps/iam`; HMS uses Better Auth | each has a Prisma schema; IAM URLs appear in backend and EMR config | **Do not merge immediately.** They are separate deployables with different schemas. | Define issuer, audience, key-rotation and organization-claim compatibility; then select a platform IdP. |
| FHIR clinical API | `bezs-emr-core` | FastAPI routes, SQLAlchemy models, Alembic migrations | **Reuse as system of record API.** | Expose a versioned client package from the existing gateway client rather than copying HTTP calls. |
| EMR façade | `bezs-emr-gql` (currently REST, despite its name) | `README.md`, `app/routers/__init__.py` | **Reuse as BFF/gateway** for clients that need its auth and orchestration. | Keep REST contract stable; only add GraphQL behind a separate versioned endpoint if justified. |
| Clinical voice/AI | `bezs-agent` | HTTP and WebSocket routers in `api/` | **Reuse through API**, not in-process imports. | Publish OpenAPI/WebSocket protocol and align auth claims. |
| File storage | FileNest backend plus Node/React/Next.js/Python SDKs | `platform/bezs-filenest/sdks/` | **Reuse SDKs first.** HMS currently carries `vendor/filenest`. | Replace vendored copies with versioned SDK dependencies and add compatibility tests. |
| Family-care domain | `kinguard-backend` | `app/domains/family`, `documents`, `events` | **Owner-specific.** Do not fold into FHIR without a bounded-context decision. | Integrate using adapter ports and events; retain its own migrations. |
| Wearable aggregation | `open-wearables` | FastAPI backend, React portal, Celery workers | **Reuse through its REST API.** | Map wearable readings to EMR Observations in an explicit adapter, not shared tables. |
| Telemetry ingestion / SDKs | Observability Go/Python services and JS/Python/Go/Rust SDKs | `platform/bezs-observability/sdk/` | **Reuse SDKs.** | Standardize one event envelope and configuration names before platform-wide adoption. |
| ETL/search | `bezs-pipeline` | connectors/extractors/transformers/loaders factories | **Reuse internally as a pipeline library.** | Avoid treating it as an EMR write path until ownership and provenance contracts exist. |
| Web UI primitives | HMS, IAM, FileNest web, Observability console, Wearables frontend | individual package manifests | **Candidate only.** Shared tooling is not currently a workspace. | Start with a small versioned design-token/component package after UI API audit. |
| Mobile app | `kinguard-mobile` Expo/React Native | `package.json`, `app/`, `src/` | **Consumer, not a shared package.** | Use generated/service SDKs and typed API clients. |

## Duplication risks

1. Authentication is duplicated, but schemas and deployment boundaries differ; centralization is a migration, not a safe deletion.
2. FileNest SDK source is both published-under-project and vendored in HMS; version drift is likely.
3. Several FastAPI services implement JWT verification, health checks, configuration, and HTTP adapters. Extract only tested, framework-neutral pieces after their claim semantics agree.
4. Multiple React/Next applications have similar stacks, but no root Node workspace exists. Do not introduce a build-system migration merely to share one component.

## Reuse guardrails

- Share contracts and libraries through versioned packages; do not import between deployable applications by relative path.
- Keep PHI-bearing clinical and family-care persistence behind owner APIs.
- Make every proposed shared library independently tested and semantically versioned.
- Treat `platform/` projects as independently releasable until a workspace and release policy exist.
