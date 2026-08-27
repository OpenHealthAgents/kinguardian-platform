"""
Wearable Domain Package.
Exports entities, value objects, domain services, events, policies, and repositories.
"""

from app.domains.wearables.domain.entities import (
    WearableIdentity,
    WearableDeviceConnection,
    WearableDailySummary,
    WearableAnomalyDiagnostic,
    WearableMetric,
    WearableGuardianMoment
)

from app.domains.wearables.domain.value_objects import (
    DeviceProvider,
    ConnectionStatus,
    AnomalySeverity,
    ActivityMetrics,
    SleepArchitecture,
    RecoveryVitals,
    AnomalyThreshold,
    WearableMetricType,
    METRIC_UNIT_MAP
)
from app.domains.wearables.domain.repositories import (
    IWearableRepository,
    InMemoryWearableRepository
)
from app.domains.wearables.domain.services import WearableDomainService
from app.domains.wearables.domain.events import (
    WearableDomainEvent,
    WearableConnectedEvent,
    WearableDisconnectedEvent,
    WearableSyncStartedEvent,
    WearableSyncCompletedEvent,
    WearableSyncFailedEvent,
    WearableDataReceivedEvent,
    WearableDataUpdatedEvent,
    create_batched_data_received_event,
    WearableDeviceConnectedEvent,
    WearableDeviceDisconnectedEvent,
    WearableDataSyncedEvent,
    WearableAnomalyDetectedEvent
)
from app.domains.wearables.domain.policies import (
    ActivityAnomalyPolicy,
    SleepDisruptionPolicy,
    AutonomicRecoveryPolicy,
    WearableToFHIRMappingPolicy,
    FHIRMappingRules
)
from app.domains.wearables.domain.normalizer import WearableMetricNormalizer
from app.domains.wearables.domain.units import HealthUnitConverter, StandardUnit
from app.domains.wearables.domain.baselines import (
    BaselineWindow,
    WearableBaselineComparison,
    WearableBaselineCalculator
)
from app.domains.wearables.domain.availability import (
    DataAvailabilityPillar,
    DataQualityClassification,
    WearableDataAvailabilityResult,
    WearableDataAvailabilityEvaluator
)
from app.domains.wearables.domain.quality import (
    QualityViolationType,
    QualityViolation,
    QualityAuditReport,
    WearableDataQualityService
)
from app.domains.wearables.domain.multidevice import (
    MetricSourcePriorityConfig,
    ResolvedWearableMetric,
    MultiDeviceDataSynthesizer
)
from app.domains.wearables.domain.source_priority_policy import (
    SourcePriorityRule,
    SourcePriorityPolicy,
    PolicyResolvedMetric,
    ConfigurableSourcePriorityEngine
)
from app.domains.wearables.domain.aggregation_policy import (
    AggregationMethod,
    SourceProvenance,
    MetricAggregationRule,
    AggregatedWearableMetric,
    MetricAggregationPolicy
)
from app.domains.wearables.domain.database_strategy import (
    MaterializationReason,
    StorageTier,
    WearableAnalyticsProjection,
    ProjectionMaterializationPolicy,
    WearableDatabaseStrategyManager
)
from app.domains.wearables.domain.retention_policy import (
    DataRetentionCategory,
    ExpiryAction,
    RetentionRule,
    DataRetentionPolicy
)

__all__ = [
    "WearableIdentity",
    "WearableDeviceConnection",
    "WearableDailySummary",
    "WearableAnomalyDiagnostic",
    "WearableMetric",
    "WearableMetricNormalizer",
    "HealthUnitConverter",
    "StandardUnit",
    "DeviceProvider",
    "ConnectionStatus",
    "AnomalySeverity",
    "ActivityMetrics",
    "SleepArchitecture",
    "RecoveryVitals",
    "AnomalyThreshold",
    "WearableMetricType",
    "METRIC_UNIT_MAP",
    "IWearableRepository",
    "InMemoryWearableRepository",
    "WearableDomainService",
    "WearableDomainEvent",
    "WearableConnectedEvent",
    "WearableDisconnectedEvent",
    "WearableSyncStartedEvent",
    "WearableSyncCompletedEvent",
    "WearableSyncFailedEvent",
    "WearableDataReceivedEvent",
    "WearableDataUpdatedEvent",
    "create_batched_data_received_event",
    "WearableDeviceConnectedEvent",
    "WearableDeviceDisconnectedEvent",
    "WearableDataSyncedEvent",
    "WearableAnomalyDetectedEvent",
    "ActivityAnomalyPolicy",
    "SleepDisruptionPolicy",
    "AutonomicRecoveryPolicy",
    "WearableToFHIRMappingPolicy",
    "FHIRMappingRules",
    "BaselineWindow",
    "WearableBaselineComparison",
    "WearableBaselineCalculator",
    "WearableGuardianMoment",
    "DataAvailabilityPillar",
    "DataQualityClassification",
    "WearableDataAvailabilityResult",
    "WearableDataAvailabilityEvaluator",
    "QualityViolationType",
    "QualityViolation",
    "QualityAuditReport",
    "WearableDataQualityService",
    "MetricSourcePriorityConfig",
    "ResolvedWearableMetric",
    "MultiDeviceDataSynthesizer",
    "SourcePriorityRule",
    "SourcePriorityPolicy",
    "PolicyResolvedMetric",
    "ConfigurableSourcePriorityEngine",
    "AggregationMethod",
    "SourceProvenance",
    "MetricAggregationRule",
    "AggregatedWearableMetric",
    "MetricAggregationPolicy",
    "MaterializationReason",
    "StorageTier",
    "WearableAnalyticsProjection",
    "ProjectionMaterializationPolicy",
    "WearableDatabaseStrategyManager",
    "DataRetentionCategory",
    "ExpiryAction",
    "RetentionRule",
    "DataRetentionPolicy"
]











