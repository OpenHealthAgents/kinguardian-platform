# KinGuardian backend

Domain-oriented FastAPI platform for cross-border family healthcare coordination. The service owns family relationships, consent/grants, care tasks, check-ins, conversation metadata, audit records, and durable outbox events. Clinical records, document bytes, AI execution, wearables, and identity stay behind external integration contracts.

## Boundaries

- **Family and authorization:** profiles, memberships, care subjects, and subject-scoped grants.
- **Care coordination:** tasks and parent/caregiver check-ins, stored in UTC with an IANA timezone required at entry.
- **Communication:** conversations/messages scoped to an authorized family.
- **Audit and async:** every state-changing endpoint appends an audit record and an idempotent outbox event in the same transaction.
- **Integrations:** adapters are deliberately deferred to stable APIs for EMR/FHIR, FileNest, agent, wearables, and observability; no cross-service database access.

## Local run

```powershell
cd kinguardian-backend
uv sync
uv run fastapi dev app/main.py
```

In development, supply `X-Actor-Subject` to authenticate an actor. Production requires a signed RS256 bearer token validated using the configured JWKS, issuer, and audience.

## Mobile-facing endpoint contract

`POST /check-ins`, `POST /medications/{id}/take`, `POST /care/tasks`, and `POST /documents` accept family and subject identifiers and enforce subject authorization. `POST /ai/conversations/{id}/messages` is limited to the conversation’s family and subject context. `GET /families/{id}/home`, `GET /subjects/{id}/home`, and `GET /subjects/{id}/timeline` provide role-authorized projections.
