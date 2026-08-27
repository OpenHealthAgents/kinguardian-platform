"""
Wearable Domain Events Module.
Defines strongly-typed domain events dispatched during wearable device connectivity,
biometric telemetry ingestion, and Guardian AI anomaly triggers.
"""

from dataclasses import dataclass, field
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

from app.domains.wearables.domain.value_objects import (
    DeviceProvider,
    AnomalySeverity,
    ActivityMetrics,
    SleepArchitecture,
    RecoveryVitals
)


@dataclass(frozen=True)
class WearableDomainEvent:
    """Base domain event for wearable state transitions."""
    event_id: uuid.UUID = field(default_factory=uuid.uuid4)
    occurred_at: datetime = field(default_factory=datetime.utcnow)
    subject_id: uuid.UUID = field(default_factory=uuid.uuid4)
    family_id: uuid.UUID = field(default_factory=uuid.uuid4)


@dataclass(frozen=True)
class WearableDeviceConnectedEvent(WearableDomainEvent):
    """Fired when a care subject establishes an active provider connection (e.g. Garmin, Apple Health)."""
    provider: DeviceProvider = DeviceProvider.UNKNOWN
    provider_user_id: Optional[str] = None
    connection_id: Optional[str] = None


@dataclass(frozen=True)
class WearableDeviceDisconnectedEvent(WearableDomainEvent):
    """Fired when a care subject or coordinator revokes a device connection."""
    provider: DeviceProvider = DeviceProvider.UNKNOWN
    reason: Optional[str] = None


@dataclass(frozen=True)
class WearableDataSyncedEvent(WearableDomainEvent):
    """Fired when fresh normalized wearable summaries arrive via webhook or pull sync."""
    date: str = ""
    provider: DeviceProvider = DeviceProvider.UNKNOWN
    activity: Optional[ActivityMetrics] = None
    sleep: Optional[SleepArchitecture] = None
    recovery: Optional[RecoveryVitals] = None


@dataclass(frozen=True)
class WearableAnomalyDetectedEvent(WearableDomainEvent):
    """Fired when wearable telemetry deviates significantly from baseline, requesting a Guardian Moment."""
    metric_name: str = ""
    observed_value: float = 0.0
    baseline_value: float = 0.0
    percentage_drop: float = 0.0
    severity: AnomalySeverity = AnomalySeverity.ATTENTION
    description: str = ""
    suggested_action: str = ""
