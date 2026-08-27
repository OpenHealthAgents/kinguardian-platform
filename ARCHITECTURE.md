# KinGuardian Platform Architecture & System Design

## 1. Final Architectural Principle & System Topology

KinGuardian is the **Family Health Intelligence and Coordination Layer** that sits at the center of the healthcare ecosystem, backed by specialized infrastructure layers:

- **KinGuardian**: **Family Intelligence & Coordination Layer** (owns the **Family Care Graph**, contextual baselines, Guardian Moments, and task routing).
- **Open Wearables**: **Wearable Connectivity & Normalization Layer** (vendor OAuth, device streams, unit/timestamp normalization).
- **FHIR R4 (`bezs-emr-core`)**: **Clinical Record Layer** (authoritative EMR system of record).
- **FileNest (`bezs-filenest`)**: **Document Layer** (immutable WORM storage, SHA-256 integrity, lab scans).
- **bezs-agent**: **AI / Agent Layer** (autonomous LLM runtime, clinical tooling, and empathetic synthesis).
- **bezs-iam**: **Identity & Authorization Foundation** (OIDC, OAuth2, RS256 JWKS, session tokens).

### The Platform Layer Breakdown

```
                        KinGuardian
                    Family Health Layer
                         │
       ┌─────────────────┼──────────────────┐
       │                 │                  │
       ▼                 ▼                  ▼
   Clinical           Wearable              AI
   Records             Data              Intelligence
       │                 │                  │
       ▼                 ▼                  ▼
   FHIR R4       Open Wearables         bezs-agent
       │                 │                  │
       └─────────────────┼──────────────────┘
                         │
                         ▼
                  Family Care Graph
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
    Parents          Caregivers         Children
     India            India             Abroad
```

### The Family Care Graph Invariant

The **Family Care Graph** is the core KinGuardian-owned aggregate tying the entire ecosystem together:
- **Evidence vs Decision Ownership**: Open Wearables provides the raw/normalized wearable evidence; KinGuardian's Family Care Graph decides:
  1. **Which parent it belongs to** (CareSubject identity mapping and device source tracking).
  2. **Who is permitted to see it** (Granular consent grants and RBAC scope gates).
  3. **What changed** (Deterministic rolling baselines and metric comparisons).
  4. **Whether it matters** (Insight engine, multi-source correlation, and non-alarmist Guardian Moments).
  5. **What action should follow** (Care tasks, check-in prompts, follow-ups, and notifications).

---

## 2. Deployment Architecture

```mermaid
graph TB
    subgraph Client_Layer ["Client Presentation Layer"]
        MobileApp["kinguard-mobile (React Native / Expo)"]
        WebApp["Web Portal (Next.js)"]
    end


    subgraph Edge_Routing ["Ingress & Security Perimeter"]
        Ingress["Ingress Controller / API Gateway (TLS 1.3, DDoS, Rate Limiting)"]
    end

    subgraph KinGuardian_Container ["KinGuardian Application Runtime (Modular Monolith)"]
        FastAPI["FastAPI ASGI App (:8000)"]
        AuthMiddleware["Stateless JWT Token Validator (RS256)"]
        AppServices["Application Orchestration Layer"]
        DomainLayer["Domain Entities & State Machines"]
        ResilienceEngine["Resilience Engine (Timeouts, Bounded Retries, Circuit Breakers)"]
        OutboxWorker["Background Outbox / Cron Scheduler"]
    end


    subgraph Internal_Persistence ["Core Persistence & Caching"]
        PostgreSQL[("PostgreSQL 16 (Relational SoR, Outbox, Audit Logs)")]
        RedisCache[("Redis 7.2 (Cache, Distributed Locks, Rate Limits)")]
    end

    subgraph External_Ecosystem ["Platform Microservices Ecosystem"]
        IAM["bezs-iam (:4000) (OIDC / OAuth2 / JWKS)"]
        EMR_Core["bezs-emr-core (:8001) (FHIR R4 HAPI Server)"]
        EMR_GQL["bezs-emr-gql (:8000) (GraphQL Query BFF)"]
        FileNest["bezs-filenest (:8080) (WORM Storage Engine)"]
        AgentService["bezs-agent (:8002) (Autonomous LLM Runtime)"]
        Observability["bezs-observability (:4318) (watcher24 / OpenTelemetry)"]
    end

    MobileApp -->|HTTPS / WSS| Ingress
    WebApp -->|HTTPS / WSS| Ingress
    Ingress --> FastAPI

    FastAPI --> AuthMiddleware
    AuthMiddleware --> AppServices
    AppServices --> DomainLayer
    AppServices --> ResilienceEngine
    AppServices --> OutboxWorker

    DomainLayer --> PostgreSQL
    AppServices --> RedisCache

    ResilienceEngine -->|"Public JWKS Keys (Cached)"| IAM
    ResilienceEngine -->|"FHIR R4 REST API"| EMR_Core
    ResilienceEngine -->|"GraphQL Projections"| EMR_GQL
    ResilienceEngine -->|"HMAC-Signed Binary Streams"| FileNest
    ResilienceEngine -->|"Inference & Action Proposals"| AgentService
    ResilienceEngine -->|"OTel Spans & Metrics"| Observability
```

---

## 3. Domain Model & Bounded Contexts

```mermaid
classDiagram
    class Family {
        +UUID id
        +String name
        +UUID primary_coordinator_profile_id
        +DateTime created_at
    }

    class AppProfile {
        +UUID id
        +String iam_subject_id
        +String email
        +String timezone
        +String display_name
    }

    class FamilyMembership {
        +UUID family_id
        +UUID profile_id
        +String membership_role
        +String status
    }

    class CareSubject {
        +UUID id
        +UUID family_id
        +String fhir_patient_id
        +String relationship_to_coordinator
        +String timezone
    }

    class Consent {
        +UUID id
        +UUID family_id
        +UUID subject_id
        +UUID grantor_profile_id
        +UUID grantee_profile_id
        +JSON scope
        +String status
    }

    class MedicationAdherenceEvent {
        +UUID id
        +UUID subject_id
        +String fhir_medication_request_id
        +DateTime scheduled_at
        +DateTime confirmed_at
        +String status
    }

    class WellbeingCheckin {
        +UUID id
        +UUID family_id
        +UUID subject_id
        +String feeling
        +String notes
        +DateTime recorded_at
    }

    class HealthDocument {
        +UUID id
        +UUID family_id
        +UUID subject_id
        +String filenest_file_id
        +String sha256_checksum
        +String status
    }

    class AIInsight {
        +UUID id
        +UUID family_id
        +UUID subject_id
        +String type
        +String severity
        +String summary
        +String status
    }

    class CareTask {
        +UUID id
        +UUID family_id
        +UUID subject_id
        +String title
        +String priority
        +String status
        +UUID assigned_to_profile_id
    }

    Family "1" *-- "*" FamilyMembership
    Family "1" *-- "*" CareSubject
    Family "1" *-- "*" Consent
    Family "1" *-- "*" HealthDocument
    Family "1" *-- "*" AIInsight
    Family "1" *-- "*" CareTask
    AppProfile "1" -- "*" FamilyMembership
    CareSubject "1" *-- "*" MedicationAdherenceEvent
    CareSubject "1" *-- "*" WellbeingCheckin
```

---

## 4. Internal Layered Dependency Graph

KinGuard enforces **Clean Architecture** with strict inward dependency flows:

```mermaid
graph TD
    subgraph Presentation_Layer ["Presentation Layer (HTTP & WebSockets)"]
        Routers["API Routers (app/domains/*/router.py)"]
        Schemas["Pydantic Schemas & DTOs"]
    end

    subgraph Application_Layer ["Application & Orchestration Layer"]
        AppServices["Application Services (FamilyService, DocumentService, etc.)"]
        ReadServices["Read-Optimized Query Services (ParentHomeReadService)"]
        Permissions["Capability & RBAC Gatekeeper"]
    end

    subgraph Domain_Layer ["Core Domain Layer (Pure Business Rules)"]
        DomainEntities["Domain Entities & Aggregates"]
        StateMachines["State Machines (Consent, Document, CareTask, Adherence)"]
        DomainEvents["Domain Event Definitions & Taxonomy"]
        Interfaces["Repository & Gateway Interfaces (Ports)"]
    end

    subgraph Infrastructure_Layer ["Infrastructure Layer (Adapters & Persistence)"]
        SQLRepositories["SQLAlchemy Repository Implementations"]
        ExternalGateways["FHIR, FileNest, Agent, and IAM Gateways"]
        OutboxPublisher["Transactional Outbox Publisher"]
        RealtimeMgr["WebSocket Realtime Manager"]
    end

    Routers --> Application_Layer
    AppServices --> Domain_Layer
    ReadServices --> Domain_Layer
    SQLRepositories --> Interfaces
    ExternalGateways --> Interfaces
    OutboxPublisher --> DomainEvents
```

---

## 5. Authoritative Data Ownership & System of Record (SoR)

To eliminate distributed race conditions and synchronization drifts, **every data field has exactly one authoritative owner**:

| Domain Concept | Authoritative Owner | System of Record | Anti-Duplication Rule |
| :--- | :--- | :--- | :--- |
| **Medication Prescriptions & Dose** | **FHIR / EMR** | `MedicationRequest`, `MedicationStatement` | KinGuard holds only external reference pointers (`fhir_medication_request_id`). No parallel prescription catalog is stored in KinGuard SQL. |
| **Medication Adherence Tracking** | **KinGuard** | `medication_adherence_events` | KinGuard is the single authoritative source of truth for dosage confirmations, dual-timezone timestamps, and adherence metrics. |
| **Parent & Care Circle Hierarchy** | **KinGuard** | `care_subjects`, `family_memberships`, `care_relationships` | Family groupings, member roles, and caregiver delegations are exclusively managed by KinGuard. |
| **Patient Identity & Demographics** | **FHIR + IAM Linkage** | `Patient` resource + IAM `sub` | Clinical demographics originate in FHIR; KinGuard maintains linkage (`care_subjects.fhir_patient_id`). |
| **File Binary Storage** | **FileNest** | WORM Storage Chunks | Raw PDF/image bytes are stored in FileNest; KinGuard stores only metadata pointers (`health_documents.filenest_file_id`, `sha256_checksum`). |
| **AI Conversational Session** | **bezs-agent** | LLM Context & Scratchpads | Intermediate LLM prompt windows are owned by `bezs-agent`; KinGuard stores session pointers (`ai_conversations.agent_session_id`). |
| **AI Insight Application Metadata** | **KinGuard** | `ai_insights`, `ai_actions`, `care_tasks` | Clinical insight metadata, severity, human-in-the-loop approvals, and care task state transitions are strictly owned by KinGuard. |

---

## 6. Security Boundaries & Threat Mitigation Matrix

```mermaid
graph TD
    User["Untrusted Inbound Data (User Text / OCR Text / Voice Transcript)"] --> Sanitizer["UntrustedContentWrapper (Neutralizes Prompt Injections)"]
    Sanitizer --> LLM["bezs-agent (Autonomous LLM)"]
    LLM --> Propose["Proposed Action / Tool Execution Request"]
    
    subgraph Security_Gatekeeper ["Deterministic Tool Authorization Gatekeeper"]
        Check1{"Is User Authenticated?"}
        Check2{"Does User Have Role Capability?"}
        Check3{"Is Explicit Granular Consent Active?"}
    end

    Propose --> Check1
    Check1 -->|Yes| Check2
    Check2 -->|Yes| Check3
    Check3 -->|Yes| Execute["Execute Deterministic Domain Service"]
    Check1 -->|No| Reject["401 / 403 Forbidden"]
    Check2 -->|No| Reject
    Check3 -->|No| Reject
```

### Security Controls Breakdown:
1. **Identity & Auth Boundary**: Stateless RS256 JWKS validation against `bezs-iam`. Passwords and credentials never touch KinGuard.
2. **Access Control Matrix**: Fine-grained role capabilities (`coordinator`, `parent`, `caregiver`, `doctor`, `admin`) validated before service execution.
3. **PHI Perimeter & Consent Verification**: Every health data read or document extraction strictly checks active, unexpired `Consent` records (`grantor -> grantee`).
4. **Untrusted LLM Input Neutralization**: Inbound transcripts, OCR strings, and user messages are encapsulated in `<untrusted_user_text>` wrappers to prevent indirect prompt injection.
5. **No Blind Database Execution**: Agent tools in `ControlledToolRegistry` are read-only or parameter-checked; arbitrary SQL or administrative DB access is strictly prohibited.

---

## 7. Event Architecture & Versioning

```mermaid
sequenceDiagram
    autonumber
    actor Parent as Parent (Mobile App)
    participant API as KinGuard API & Service Layer
    participant DB as PostgreSQL Transaction
    participant Outbox as Transactional Outbox Worker
    participant EventBus as Domain Event Bus / Broker
    participant AuditStore as Immutable Audit Store
    participant Sub as Reactive Handler (Coordinator Alert)

    Parent->>API: POST /check-ins (feeling: not_well)
    activate API
    
    rect rgb(240, 248, 255)
        Note over API,DB: Atomic Database Transaction
        API->>DB: 1. Insert WellbeingCheckin
        API->>DB: 2. Insert OutboxEvent (subject.checkin.submitted v1)
        API->>DB: 3. Commit Transaction
    end

    API-->>Parent: 201 Created (CheckinResponse)
    deactivate API

    par Async Background Processing
        Outbox->>DB: Fetch pending outbox records
        Outbox->>EventBus: publish(DomainEvent: subject.checkin.submitted)
        EventBus->>Sub: Notify Coordinator & Trigger AI Trend Engine
        Outbox->>DB: Mark OutboxEvent as PUBLISHED
    and Compliance Recording
        API->>AuditStore: record_audit_event(AuditEvent: Who=Parent, Action=checkin.created, IP=49.37.150.12)
    end
```

### Canonical Event Taxonomy:
- `family.created`
- `family.member.added`
- `care.relationship.created`
- `subject.checkin.submitted`
- `medication.taken`
- `medication.missed`
- `document.uploaded`
- `document.processed`
- `appointment.preparation.created`
- `insight.generated`
- `guardian.moment.created`
- `care.task.created`
- `care.task.completed`
- `notification.created`

### Event Versioning Contract:
Every event envelope strictly includes:
- `event_type: str`
- `event_version: int`
- `event_id: UUID` (idempotency key)
- `occurred_at: datetime` (UTC)
- `payload: Dict[str, Any]` (validated against `EventSchemaRegistry`)
