# Integration Contracts

## Status

This document records contracts that are implemented or configured today, plus the minimum rules needed to make them safe. It does **not** invent token claims, webhook payloads, retry counts, or version guarantees that are absent from source.

| Boundary | Transport and entry point | Authentication | Contract source | Required compatibility rule |
|---|---|---|---|---|
| Client → KinGuardian backend | HTTP `/api/v1`; family realtime WebSocket `/ws/families/{family_id}` | backend security dependency / token query for WS | `app/main.py`; `domains/family/presentation/realtime_router.py` | Publish OpenAPI and WS event schema before external clients depend on it. |
| HMS → EMR gateway | HTTP REST at `FHIR_GQL_URL` | bearer/JWT passed by HMS REST adapters | `bezs-hms/src/modules/server/core/*/infrastructure/services/*.rest.service.ts` | `FHIR_GQL_URL` is a REST base; do not assume GraphQL from its name. |
| EMR gateway → EMR core | HTTP via typed FHIR client | gateway’s server-to-server configuration | `bezs-emr-gql/README.md`, `app/routers/` | Gateway must remain database-free; new persistence belongs in EMR core or another owner. |
| Agent → client | HTTP `/api/agent`, `/api/consult`, `/api/ehr`; WS `/ws/audio`, `/ws/consultaudio`, `/ws/diarize` | WS authenticates during handshake | `bezs-agent/api/main.py`, `api/wsrouters/` | Document media framing and lifecycle before treating WS protocol as public. README paths are not fully aligned with routers. |
| Agent → EMR | HTTP `FHIR_BASE_URL` | configured service behavior | `bezs-agent/config/config.py` | Use a scoped service principal; never forward a broader user token without authorization policy. |
| KinGuardian backend → FileNest | HTTP upload/download URLs below `/api/v1/files/` | FileNest API key/project configuration plus signed download parameters | `domains/documents/*`, `domains/family/application/services.py` | Treat FileNest IDs as opaque; no direct storage or database access. |
| SDK/app → Observability | HTTP ingest; realtime `GET /ws` | API key (WS accepts query/header per docs) | `apps/realtime-go/docs/api.md`, SDKs | Adopt an explicit event-envelope version and org/app identifier. |
| Wearables → consumers | FastAPI REST/OpenAPI | self-contained API-key/auth model | `open-wearables/README.md` | Map to EMR through a translation API/event, never a cross-database query. |

## Authentication interoperability

The code configures JWKS validation in KinGuardian backend, EMR gateway, EMR core, and agent. The precise issuer, audience, algorithm, and organization-claim contract must be treated as deployment configuration until one identity provider is selected.

Minimum shared policy:

- Require HTTPS outside local development and validate `iss`, `aud`, `exp`, signature, and key ID.
- Use short-lived bearer tokens and scoped service credentials for service-to-service calls.
- Version and document any organization, role, and subject claims consumed by services.
- Health endpoints may be unauthenticated only if they disclose no sensitive dependency details.

## Contract publication backlog

1. Generate and version OpenAPI snapshots for KinGuardian backend, EMR core, gateway, agent, FileNest, and wearables.
2. Define JSON Schema (or AsyncAPI) for the three WebSocket protocols and observability event envelope.
3. Add consumer-driven tests for HMS→gateway and KinGuardian backend→FileNest/agent.
4. Resolve the documented-vs-implemented agent WebSocket path mismatch before client rollout.
