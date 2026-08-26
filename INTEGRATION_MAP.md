# Integration Map & Protocol Matrix

## Overview
This document specifies the integration protocols, authentication flows, endpoint contracts, resilience configurations, and data boundaries between `kinguard-backend` and all external services in the `platform/` ecosystem.

---

## 1. Integration Matrix

```mermaid
flowchart TD
    KB["KinGuard Backend (Modular Monolith)"]
    
    subgraph Identity ["Identity & Access (IAM)"]
        IAM["bezs-iam (OIDC / OAuth2)"]
    end

    subgraph Clinical ["Clinical Record System"]
        EMR_CORE["bezs-emr-core (FHIR R4 REST)"]
        EMR_GQL["bezs-emr-gql (GraphQL Projections)"]
        EMR_MCP["bezs-emr-mcp (MCP Clinical Tools)"]
    end

    subgraph Storage ["Document & Object Storage"]
        FILENEST["bezs-filenest (WORM Storage)"]
    end

    subgraph AI ["AI & Autonomous Agent Runtime"]
        AGENT["bezs-agent (Autonomous LLM)"]
    end

    subgraph Telemetry ["Observability & Metrics"]
        OBS["bezs-observability (watcher24 / OTel)"]
    end

    subgraph Wearables ["IoT / Wearable Metrics"]
        WEAR["open-wearables (Aggregator)"]
    end

    KB -->|"JWKS / Bearer Token Validation"| IAM
    KB -->|"FHIR R4 Queries (/Patient, /MedicationRequest)"| EMR_CORE
    KB -->|"GraphQL Projections (/patients/{id})"| EMR_GQL
    KB -->|"MCP Tools Protocol"| EMR_MCP
    KB -->|"WORM Upload / Pre-signed URL / SHA-256"| FILENEST
    KB -->|"Async Chat / Propose Action / Trend Eval"| AGENT
    KB -->|"OpenTelemetry Spans & Metrics"| OBS
    KB -->|"REST Ingestion (Observations)"| WEAR
```

---

## 2. Service Integration Specifications

### 2.1 Identity & Access Management (`bezs-iam`)
- **Protocol**: HTTP / OIDC (RS256 JWT validation via JWKS endpoint)
- **Base URL Setting**: `IAM_JWKS_URL`, `IAM_ISSUER`, `IAM_AUDIENCE`
- **Integration Mechanism**: Stateless cryptographic token verification in `app/core/security.py`
- **Security Boundary**: KinGuard validates token signature, issuer, expiration, and extracts `sub` as `iam_subject_id`. Passwords and credentials never touch KinGuard.
- **Failover / Degradation**: Public keys are cached locally with TTL; requests fail-fast on token expiration (`401 Unauthorized`).

### 2.2 Clinical Record Gateway (`bezs-emr-core` & `bezs-emr-gql`)
- **Protocol**: HTTP REST (FHIR R4 format: `application/fhir+json`) and GraphQL HTTP POST
- **Base URL Setting**: `FHIR_API_URL`, `FHIR_GQL_URL`, `EMR_CORE_URL`, `EMR_GQL_URL`
- **Gateway Adapter**: `FHIRClinicalRecordGateway` (`app/domains/clinical/gateway.py`)
- **Timeouts & Retries**: Connect: 2.0s, Read: 4.0s, Total: 5.0s. Max 3 retries on transient errors with jitter.
- **Circuit Breaker**: `failure_threshold: 4`, `recovery_timeout: 20s`, `half_open_probes: 2`.
- **Degradation Policy**: On outage, returns degraded clinical payload (`ResilientFHIRHandler`) so coordinator dashboard loads family data without throwing 500 errors.

### 2.3 Document Storage Gateway (`bezs-filenest`)
- **Protocol**: HTTP REST with HMAC-SHA256 request signing and dynamic idempotency key (`upload-{sha256}`)
- **Base URL Setting**: `FILENEST_URL`
- **Gateway Adapter**: `FileNestGateway` (`app/core/adapters/prod_filenest.py`)
- **Timeouts & Retries**: Connect: 3.0s, Read: 8.0s, Write: 10.0s, Total: 10.0s. Max 3 retries.
- **Circuit Breaker**: `failure_threshold: 5`, `recovery_timeout: 30s`, `half_open_probes: 2`.
- **Data Boundary**: KinGuard stores metadata (`filenest_file_id`, `sha256_checksum`, `mime_type`), never raw binary bytes.

### 2.4 Autonomous AI Agent (`bezs-agent`)
- **Protocol**: HTTP REST (`POST /api/v1/agent/chat`, `POST /api/v1/agent/propose-action`) & WebSockets
- **Base URL Setting**: `AGENT_SERVICE_URL`, `AGENT_TIMEOUT` (default: 15.0s)
- **Gateway Adapter**: `AgentGateway` (`app/core/adapters/prod_agent.py`)
- **Timeouts & Retries**: Connect: 3.0s, Read: 12.0s, Total: 15.0s. 2 bounded attempts on transient network errors. Non-idempotent mutations are never retried blindly.
- **Circuit Breaker**: `failure_threshold: 3`, `recovery_timeout: 15s`, `half_open_probes: 1`.
- **Degradation Policy**: When breaker is OPEN or LLM fails, returns safe fallback insight: *"KinGuard couldn't generate the insight right now. You can review the underlying health information."*

### 2.5 Observability & Telemetry (`bezs-observability` / `watcher24`)
- **Protocol**: OpenTelemetry (OTLP HTTP / gRPC)
- **Base URL Setting**: `OBSERVABILITY_URL`
- **Adapter**: `TelemetryService` / `MetricsCollector` (`app/core/telemetry.py`)
- **Dispatch**: Non-blocking background buffer with zero interference to primary request latency.

---

## 3. Communication Channels & Protocols Summary

| Service | Target Port / Protocol | Auth Method | Idempotency Header | Fallback Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **`bezs-iam`** | `4000/http` | RS256 JWKS | N/A (Read-only) | Cached JWKS public key set |
| **`bezs-emr-core`** | `8001/http` | Bearer Token | `Idempotency-Key` on mutations | Degraded in-memory clinical stub |
| **`bezs-emr-gql`** | `8000/http` | Bearer Token | N/A (Read projections) | Cached subject timeline |
| **`bezs-filenest`** | `8080/http` | HMAC API Key | `Idempotency-Key: upload-{sha256}` | Fast-fail with retry guidance |
| **`bezs-agent`** | `8002/http` | Bearer Token | N/A (Guarded non-idempotent) | Safe fallback insight message |
| **`bezs-observability`** | `4318/http` (OTLP) | Service Secret | N/A | Non-blocking drop on buffer full |
