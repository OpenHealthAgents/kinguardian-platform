"""
Open Wearables Domain Schemas & DTOs.

Provides strongly-typed contracts for wearable device connections,
daily aggregated health summaries (activity, sleep, recovery, body),
and inbound webhook event ingestion.
"""

import uuid
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, date
from pydantic import BaseModel, Field, ConfigDict


class WearableProvider(str):
    GARMIN = "garmin"
    OURA = "oura"
    WHOOP = "whoop"
    SUUNTO = "suunto"
    POLAR = "polar"
    ULTRAHUMAN = "ultrahuman"
    STRAVA = "strava"
    FITBIT = "fitbit"
    APPLE_HEALTH = "apple_health"
    HEALTH_CONNECT = "health_connect"
    SAMSUNG_HEALTH = "samsung_health"


class DeviceConnectionResponse(BaseModel):
    """Connected wearable device state for a care subject."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    provider: str
    status: Literal["active", "inactive", "pending", "error"] = "active"
    provider_user_id: Optional[str] = None
    last_synced_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    capabilities: Dict[str, Any] = Field(default_factory=dict)


class DeviceConnectUrlResponse(BaseModel):
    """OAuth connection URL or mobile SDK token for connecting a wearable device."""
    provider: str
    connect_url: Optional[str] = None
    invitation_code: Optional[str] = None
    sdk_token: Optional[str] = None
    expires_at: Optional[datetime] = None


class WearableActivitySummary(BaseModel):
    """Daily aggregated activity metrics (steps, energy, active duration)."""
    date: str
    steps: int = 0
    active_duration_minutes: int = 0
    calories_burned_kcal: Optional[float] = None
    distance_meters: Optional[float] = None
    floors_climbed: Optional[int] = None
    source_provider: Optional[str] = None


class WearableSleepSummary(BaseModel):
    """Daily aggregated sleep architecture and quality metrics."""
    date: str
    total_sleep_minutes: int = 0
    deep_sleep_minutes: Optional[int] = None
    light_sleep_minutes: Optional[int] = None
    rem_sleep_minutes: Optional[int] = None
    awake_minutes: Optional[int] = None
    sleep_score: Optional[int] = None  # 0 - 100
    efficiency_percentage: Optional[float] = None
    source_provider: Optional[str] = None


class WearableRecoverySummary(BaseModel):
    """Daily aggregated autonomic recovery and physiological metrics."""
    date: str
    resting_heart_rate_bpm: Optional[int] = None
    hrv_ms: Optional[float] = None  # Heart Rate Variability (RMSSD)
    spo2_percentage: Optional[float] = None  # Blood oxygen saturation
    skin_temperature_celsius: Optional[float] = None
    recovery_score: Optional[int] = None  # 0 - 100
    respiratory_rate_bpm: Optional[float] = None
    source_provider: Optional[str] = None


class WearableDashboardResponse(BaseModel):
    """Single-roundtrip aggregated wearable health overview for a care subject."""
    subject_id: uuid.UUID
    wearable_user_id: str
    connected_providers: List[DeviceConnectionResponse] = Field(default_factory=list)
    latest_activity: Optional[WearableActivitySummary] = None
    latest_sleep: Optional[WearableSleepSummary] = None
    latest_recovery: Optional[WearableRecoverySummary] = None
    weekly_average_steps: int = 0
    weekly_average_sleep_hours: float = 0.0
    baseline_step_goal: int = 5000
    has_activity_anomaly: bool = False
    anomaly_description: Optional[str] = None


class WearableWorkoutSummary(BaseModel):
    """Normalized workout or physical exercise session."""
    id: str
    date: str
    activity_type: str  # e.g. "walking", "running", "yoga", "swimming"
    duration_minutes: int
    calories_burned_kcal: Optional[float] = None
    average_heart_rate_bpm: Optional[int] = None
    max_heart_rate_bpm: Optional[int] = None
    distance_meters: Optional[float] = None
    source_provider: Optional[str] = None


class WearableSyncStatus(BaseModel):
    """Sync status and health diagnostics across all connected providers."""
    user_id: str
    is_syncing: bool = False
    last_successful_sync_at: Optional[datetime] = None
    connected_provider_count: int = 0
    active_providers: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)


class OpenWearablesWebhookPayload(BaseModel):
    """Inbound webhook event delivered by Open Wearables upon sync."""
    event_type: str = Field(..., description="e.g. data.synced, connection.created, anomaly.detected")
    user_id: str
    provider: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data: Dict[str, Any] = Field(default_factory=dict)


class WearablePermissionDetail(BaseModel):
    """Explains in clear, human-friendly terms what data is shared under a specific scope."""
    key: str
    label: str
    description: str
    is_granted: bool
    data_types: List[str]


class WearableConnectionPermissionsResponse(BaseModel):
    """Granular permissions/scope granted to a specific wearable connection."""
    connection_id: uuid.UUID
    subject_id: uuid.UUID
    provider: str
    permissions: Dict[str, bool]
    permission_explanations: List[WearablePermissionDetail]
    updated_at: Optional[datetime] = None


class UpdateWearablePermissionsRequest(BaseModel):
    """Request payload to update granted scopes for a connection."""
    permissions: Dict[str, bool]


WEARABLE_PERMISSION_METADATA: Dict[str, Dict[str, Any]] = {
    "activity": {
        "label": "Daily Activity & Movement",
        "description": "Daily steps, active minutes, walking distance, and estimated calorie expenditure.",
        "data_types": ["steps", "distance", "active_minutes", "calories"]
    },
    "sleep": {
        "label": "Sleep Architecture & Quality",
        "description": "Total sleep duration, sleep scores, and sleep stage cycles (Deep, REM, Light).",
        "data_types": ["sleep_duration", "sleep_score", "sleep_stages"]
    },
    "heart_rate": {
        "label": "Heart Rate & Recovery",
        "description": "Continuous pulse, resting heart rate (RHR), and heart rate variability (HRV RMSSD).",
        "data_types": ["heart_rate", "resting_heart_rate", "heart_rate_variability"]
    },
    "workouts": {
        "label": "Exercise & Workout Sessions",
        "description": "Logged fitness activities including walking, running, and cardio sessions.",
        "data_types": ["workout", "activity_level"]
    },
    "weight": {
        "label": "Weight & Body Composition",
        "description": "Body weight measurements and BMI trends.",
        "data_types": ["weight"]
    },
    "blood_oxygen": {
        "label": "Pulse Oximetry (SpO2)",
        "description": "Blood oxygen saturation levels and nocturnal respiratory rate patterns.",
        "data_types": ["blood_oxygen", "respiratory_rate"]
    },
    "body_temperature": {
        "label": "Skin Temperature",
        "description": "Wrist/skin temperature variations relative to baseline.",
        "data_types": ["body_temperature"]
    },
    "stress": {
        "label": "Autonomic Stress Index",
        "description": "Physiological stress scores and relaxation balance derived from HRV.",
        "data_types": ["stress"]
    }
}


