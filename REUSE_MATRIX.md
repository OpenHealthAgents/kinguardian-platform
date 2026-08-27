# Repository Reuse Matrix

## Scope and Architecture Overview

This matrix defines the authoritative reuse boundaries, integration roles, protocols, and architectural responsibilities across the 10 ecosystem repositories:

| Repository / Service | Architectural Domain | Integration Role & Protocol | Reuse Decision & Strategy | Data & Security Boundary |
|---|---|---|---|---|
| **`bezs-iam`** | **identity/auth** | OIDC / OAuth2 / RS256 JWKS | **Reuse as Platform Identity Provider.** Stateless token validation. | Owns authentication, user credentials, sessions, and JWKS key rotation. Passwords never touch KinGuardian. |
| **`bezs-emr-core`** | **FHIR clinical record** | FHIR R4 REST API (`application/fhir+json`) | **Reuse as Clinical System of Record.** Manages Patient, Observation, Condition, MedicationStatement resources. | Owns authoritative clinical records and FHIR schemas. KinGuardian accesses via `FHIRClinicalRecordGateway`. |
| **`bezs-emr-gql`** | **clinical orchestration** | GraphQL / REST Gateway & BFF | **Reuse for Clinical Orchestration.** Provides aggregated patient timelines and clinical projections. | Orchestrates complex cross-resource clinical queries without exposing internal database schemas. |
| **`bezs-emr-mcp`** | **clinical agent tools** | Model Context Protocol (MCP) | **Reuse for Clinical Agent Tooling.** Equips LLM agents with structured read/write clinical actions. | Enforces tool authorization, schema validation, and clinical parameter bounds before tool execution. |
| **`bezs-agent`** | **AI runtime** | REST / WebSockets / MCP Server | **Reuse as AI Runtime.** Powers conversational Q&A, empathetic synthesis, and proactive trend evaluation. | Autonomous agent execution. Non-diagnostic invariant enforced (telemetry context is never automated clinical diagnosis). |
| **`bezs-filenest`** | **health documents** | REST API with HMAC-SHA256 & Pre-signed URLs | **Reuse for Health Documents & WORM Storage.** Stores lab reports, discharge summaries, and clinical scans. | Owns binary blob storage, SHA-256 integrity verification, and encryption-at-rest. KinGuardian stores only metadata pointers. |
| **`bezs-pipeline`** | **ingestion/ETL** | Connectors / Extractors / Transformers / Loaders | **Reuse for Ingestion & ETL Pipelines.** Batch data transformation, legacy EHR migrations, and search indexing. | Internal pipeline and transformation engine. Writes to clinical records only through verified owner APIs. |
| **`bezs-observability`** | **telemetry/audit** | OpenTelemetry (OTLP HTTP / gRPC) / watcher24 | **Reuse for Platform Telemetry & Audit.** Metrics, traces, logs, and compliance audit streams. | Telemetry and operational metrics. Strict Zero-PHI invariant: never logs raw biometric readings. |
| **`open-wearables`** | **wearable aggregation** | REST API & Inbound HMAC Webhooks | **Reuse for Wearable Aggregation.** Aggregates Garmin, Apple Health, Oura, Whoop, Fitbit, and Health Connect. | Separate deployment & catalog (`open_wearables_db`). KinGuardian queries normalized metrics via `WearableDataGateway`. |
| **`bezs-hms`** | **existing healthcare application surface** | Next.js / React Hospital Portal & EHR UI | **Reuse as Clinical & Hospital Application Surface.** Clinical staff, physician, and administrative UI. | Web client for provider workflows. Integrates with EMR Core, FileNest, and IAM. |

---

## Duplication Risks & Architectural Guardrails

1. **Identity & Auth Boundary**:
   - `bezs-iam` is the single source of truth for identity authentication.
   - Mobile and web clients authenticate with IAM $\to$ KinGuardian verifies claims $\to$ KinGuardian securely proxies to upstream services via service credentials.
2. **Clinical Data Boundary**:
   - `bezs-emr-core` owns FHIR data; `open-wearables` owns device sync pipelines; `kinguardian-backend` owns family circles and care coordination.
   - Database schemas are strictly isolated; cross-service communication occurs solely via versioned APIs and gateways.
3. **Zero Secret Leakage**:
   - Third-party API keys (Open Wearables, FileNest HMAC keys, EMR service keys) reside exclusively on backend secret managers.
4. **Zero Raw Health Metric Value Logging**:
   - `bezs-observability` and application loggers record operational events, latencies, and counts, but never emit raw PHI / biometric measurements.

