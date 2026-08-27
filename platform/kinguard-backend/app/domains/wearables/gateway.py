"""
Wearable Data Gateway Module (Hexagonal Anti-Corruption Layer).
Treats Open Wearables purely as an EXTERNAL INFRASTRUCTURE CAPABILITY.

EARLY-STAGE COMPATIBILITY GUARANTEES:
- Open Wearables is pinned to Commit: `a3c9df8091ee591db4a7b3e1580e150c4c8d0e9b` (v0.1.0-alpha).
- Isolated behind `WearableDataGateway(Protocol)` Anti-Corruption Layer (ACL).
- Zero Open Wearables internal models/schemas are imported into the KinGuard domain.

Architectural Topology:
Mobile App
    ↓
KinGuard API
    ↓
WearableDataGateway (Anti-Corruption Protocol)
    ↓
Open Wearables (External Capability Platform, Pinned: a3c9df8)
    ↓
Wearable Provider (Garmin, Oura, Apple Health, Health Connect, Whoop, Fitbit)

Ownership Boundary:
1. KinGuard Backend OWNS:
   - "This wearable/health-data identity belongs to this KinGuard parent (CareSubject)."
   - Family Circle RBAC, Consent Grants, and Dual-Timezone Presentation.
   - Transactional Outbox Event Staging & Guardian Moment AI Synthesis.
2. Open Wearables OWNS:
   - "This provider account/device produced these normalized measurements."
   - Third-party OAuth token refreshes, rate-limiting, and webhook ingestion.
"""

from typing import Protocol, runtime_checkable, List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import httpx

from app.core.config import settings
from app.core.logging import get_logger
from app.core.resilience.circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerConfig,
    CircuitState,
    CircuitBreakerOpenError
)
from app.domains.wearables.schemas import (
    DeviceConnectionResponse,
    DeviceConnectUrlResponse,
    WearableActivitySummary,
    WearableSleepSummary,
    WearableRecoverySummary,
    WearableWorkoutSummary,
    WearableSyncStatus
)

logger = get_logger(__name__)

# Pinned Open Wearables Deployment Metadata
OPEN_WEARABLES_PINNED_VERSION = "0.1.0-alpha"
OPEN_WEARABLES_PINNED_COMMIT = "a3c9df8091ee591db4a7b3e1580e150c4c8d0e9b"


@runtime_checkable
class WearableDataGateway(Protocol):
    """
    Primary Port protocol for wearable telemetry retrieval.
    Acts as the Hexagonal Boundary isolating KinGuard from external wearable platforms.
    """

    async def create_user(
        self,
        user_id: str,
        email: Optional[str] = None,
        display_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Registers a care subject identity in the external wearable aggregator."""
        ...

    async def create_connection_link(
        self,
        user_id: str,
        provider: str
    ) -> DeviceConnectUrlResponse:
        """Generates an OAuth connection URL or mobile SDK token."""
        ...

    async def get_connections(
        self,
        user_id: str
    ) -> List[DeviceConnectionResponse]:
        """Fetches active and pending wearable device connections."""
        ...

    async def disconnect(
        self,
        user_id: str,
        connection_id_or_provider: str
    ) -> bool:
        """Revokes and disconnects a wearable provider connection."""
        ...

    async def get_metrics(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """Fetches unified multi-dimension biometric metrics."""
        ...

    async def get_daily_activity(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableActivitySummary]:
        """Fetches daily aggregated activity metrics (steps, active minutes, calories)."""
        ...

    async def get_sleep(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableSleepSummary]:
        """Fetches daily aggregated sleep architecture and quality."""
        ...

    async def get_heart_rate(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableRecoverySummary]:
        """Fetches daily recovery and cardiovascular vitals (RHR, HRV, SpO2)."""
        ...

    async def get_workouts(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableWorkoutSummary]:
        """Fetches individual recorded workout sessions."""
        ...

    async def get_sync_status(
        self,
        user_id: str
    ) -> WearableSyncStatus:
        """Fetches synchronization health and provider statuses."""
        ...

    # Backward compatibility helper aliases
    async def get_user_connections(self, user_id: str) -> List[DeviceConnectionResponse]:
        return await self.get_connections(user_id)

    async def create_connection_invitation(self, user_id: str, provider: str) -> DeviceConnectUrlResponse:
        return await self.create_connection_link(user_id, provider)

    async def get_activity_summaries(self, user_id: str, start_date: str, end_date: str) -> List[WearableActivitySummary]:
        return await self.get_daily_activity(user_id, start_date, end_date)

    async def get_sleep_summaries(self, user_id: str, start_date: str, end_date: str) -> List[WearableSleepSummary]:
        return await self.get_sleep(user_id, start_date, end_date)

    async def get_recovery_summaries(self, user_id: str, start_date: str, end_date: str) -> List[WearableRecoverySummary]:
        return await self.get_heart_rate(user_id, start_date, end_date)


class OpenWearablesGateway(WearableDataGateway):
    """
    Production HTTP Adapter communicating with Open Wearables (Pinned Commit: a3c9df8).
    Protected by CircuitBreaker and strict timeouts.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout_seconds: float = 10.0
    ):
        self.base_url = (base_url or settings.OPEN_WEARABLES_URL).rstrip("/")
        self.api_key = api_key or settings.OPEN_WEARABLES_API_KEY.get_secret_value()
        self.timeout = httpx.Timeout(timeout_seconds)
        self.circuit_breaker = CircuitBreaker(
            name="open_wearables",
            config=CircuitBreakerConfig(
                failure_threshold=4,
                recovery_timeout_seconds=15.0
            )
        )


    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "X-Client-Platform": "KinGuard",
            "X-Target-Commit": OPEN_WEARABLES_PINNED_COMMIT
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            headers["X-API-Key"] = self.api_key
        return headers

    async def create_user(
        self,
        user_id: str,
        email: Optional[str] = None,
        display_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Registers a care subject identity in Open Wearables."""
        url = f"{self.base_url}/v1/users"
        payload = {"external_id": user_id, "email": email, "display_name": display_name}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await self.circuit_breaker.execute(
                    client.post, url, json=payload, headers=self._get_headers()
                )
                if resp.status_code in (200, 201):
                    return resp.json()
                return {"user_id": user_id, "status": "created_or_exists"}
        except Exception as e:
            logger.warning(f"Failed to register user in Open Wearables ({user_id}): {e}")
            return {"user_id": user_id, "status": "provisional"}

    async def create_connection_link(
        self,
        user_id: str,
        provider: str
    ) -> DeviceConnectUrlResponse:
        """Generates an OAuth invitation link or SDK session token."""
        url = f"{self.base_url}/v1/users/{user_id}/invitations"
        payload = {"provider": provider}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await self.circuit_breaker.execute(
                    client.post, url, json=payload, headers=self._get_headers()
                )
                resp.raise_for_status()
                data = resp.json()
                return DeviceConnectUrlResponse(
                    provider=provider,
                    connect_url=data.get("connect_url") or data.get("invitation_url"),
                    invitation_code=data.get("code") or data.get("invitation_code"),
                    sdk_token=data.get("sdk_token"),
                    expires_at=data.get("expires_at")
                )
        except Exception as e:
            logger.warning(f"Failed to create Open Wearables invitation for {provider}: {e}")
            return DeviceConnectUrlResponse(
                provider=provider,
                connect_url=f"{self.base_url}/connect/{provider}?user_id={user_id}",
                invitation_code=f"inv_{uuid.uuid4().hex[:8]}"
            )

    async def get_connections(
        self,
        user_id: str
    ) -> List[DeviceConnectionResponse]:
        """Fetches active provider connections."""
        url = f"{self.base_url}/v1/users/{user_id}/connections"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await self.circuit_breaker.execute(
                    client.get, url, headers=self._get_headers()
                )
                resp.raise_for_status()
                raw_items = resp.json()
                if isinstance(raw_items, dict) and "items" in raw_items:
                    raw_items = raw_items["items"]

                connections = []
                for item in raw_items:
                    connections.append(
                        DeviceConnectionResponse(
                            id=str(item.get("id", uuid.uuid4())),
                            provider=item.get("provider", "unknown"),
                            status=item.get("status", "active"),
                            provider_user_id=item.get("provider_user_id"),
                            last_synced_at=item.get("last_synced_at"),
                            created_at=item.get("created_at"),
                            capabilities=item.get("capabilities", {})
                        )
                    )
                return connections
        except Exception as e:
            logger.warning(f"Failed to fetch Open Wearables connections for {user_id}: {e}")
            return []

    async def disconnect(
        self,
        user_id: str,
        connection_id_or_provider: str
    ) -> bool:
        """Revokes a provider connection."""
        url = f"{self.base_url}/v1/users/{user_id}/connections/{connection_id_or_provider}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await self.circuit_breaker.execute(
                    client.delete, url, headers=self._get_headers()
                )
                return resp.status_code in (200, 204)
        except Exception as e:
            logger.warning(f"Failed to disconnect wearable {connection_id_or_provider}: {e}")
            return False

    async def get_metrics(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """Fetches multi-dimension biometric telemetry."""
        activity = await self.get_daily_activity(user_id, start_date, end_date)
        sleep = await self.get_sleep(user_id, start_date, end_date)
        recovery = await self.get_heart_rate(user_id, start_date, end_date)
        return {
            "user_id": user_id,
            "start_date": start_date,
            "end_date": end_date,
            "activity": [a.model_dump() for a in activity],
            "sleep": [s.model_dump() for s in sleep],
            "recovery": [r.model_dump() for r in recovery]
        }

    async def get_daily_activity(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableActivitySummary]:
        """Fetches daily activity summaries."""
        url = f"{self.base_url}/v1/users/{user_id}/summaries/activity"
        params = {"start_date": start_date, "end_date": end_date}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await self.circuit_breaker.execute(
                    client.get, url, params=params, headers=self._get_headers()
                )
                resp.raise_for_status()
                raw_items = resp.json()
                if isinstance(raw_items, dict) and "items" in raw_items:
                    raw_items = raw_items["items"]

                return [
                    WearableActivitySummary(
                        date=item.get("date", start_date),
                        steps=item.get("steps", 0),
                        active_duration_minutes=item.get("active_duration_minutes", 0),
                        calories_burned_kcal=item.get("calories_burned_kcal"),
                        distance_meters=item.get("distance_meters"),
                        floors_climbed=item.get("floors_climbed"),
                        source_provider=item.get("source_provider")
                    )
                    for item in raw_items
                ]
        except Exception as e:
            logger.warning(f"Failed to fetch activity summaries for {user_id}: {e}")
            return []

    async def get_sleep(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableSleepSummary]:
        """Fetches daily sleep summaries."""
        url = f"{self.base_url}/v1/users/{user_id}/summaries/sleep"
        params = {"start_date": start_date, "end_date": end_date}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await self.circuit_breaker.execute(
                    client.get, url, params=params, headers=self._get_headers()
                )
                resp.raise_for_status()
                raw_items = resp.json()
                if isinstance(raw_items, dict) and "items" in raw_items:
                    raw_items = raw_items["items"]

                return [
                    WearableSleepSummary(
                        date=item.get("date", start_date),
                        total_sleep_minutes=item.get("total_sleep_minutes", 0),
                        deep_sleep_minutes=item.get("deep_sleep_minutes"),
                        light_sleep_minutes=item.get("light_sleep_minutes"),
                        rem_sleep_minutes=item.get("rem_sleep_minutes"),
                        awake_minutes=item.get("awake_minutes"),
                        sleep_score=item.get("sleep_score"),
                        efficiency_percentage=item.get("efficiency_percentage"),
                        source_provider=item.get("source_provider")
                    )
                    for item in raw_items
                ]
        except Exception as e:
            logger.warning(f"Failed to fetch sleep summaries for {user_id}: {e}")
            return []

    async def get_heart_rate(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableRecoverySummary]:
        """Fetches daily recovery and cardiovascular vitals."""
        url = f"{self.base_url}/v1/users/{user_id}/summaries/recovery"
        params = {"start_date": start_date, "end_date": end_date}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await self.circuit_breaker.execute(
                    client.get, url, params=params, headers=self._get_headers()
                )
                resp.raise_for_status()
                raw_items = resp.json()
                if isinstance(raw_items, dict) and "items" in raw_items:
                    raw_items = raw_items["items"]

                return [
                    WearableRecoverySummary(
                        date=item.get("date", start_date),
                        resting_heart_rate_bpm=item.get("resting_heart_rate_bpm"),
                        hrv_ms=item.get("hrv_ms"),
                        spo2_percentage=item.get("spo2_percentage"),
                        skin_temperature_celsius=item.get("skin_temperature_celsius"),
                        recovery_score=item.get("recovery_score"),
                        respiratory_rate_bpm=item.get("respiratory_rate_bpm"),
                        source_provider=item.get("source_provider")
                    )
                    for item in raw_items
                ]
        except Exception as e:
            logger.warning(f"Failed to fetch recovery summaries for {user_id}: {e}")
            return []

    async def get_workouts(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableWorkoutSummary]:
        """Fetches individual workout sessions."""
        url = f"{self.base_url}/v1/users/{user_id}/workouts"
        params = {"start_date": start_date, "end_date": end_date}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await self.circuit_breaker.execute(
                    client.get, url, params=params, headers=self._get_headers()
                )
                resp.raise_for_status()
                raw_items = resp.json()
                if isinstance(raw_items, dict) and "items" in raw_items:
                    raw_items = raw_items["items"]

                return [
                    WearableWorkoutSummary(
                        id=str(item.get("id", uuid.uuid4())),
                        date=item.get("date", start_date),
                        activity_type=item.get("activity_type", "walking"),
                        duration_minutes=item.get("duration_minutes", 30),
                        calories_burned_kcal=item.get("calories_burned_kcal"),
                        average_heart_rate_bpm=item.get("average_heart_rate_bpm"),
                        max_heart_rate_bpm=item.get("max_heart_rate_bpm"),
                        distance_meters=item.get("distance_meters"),
                        source_provider=item.get("source_provider")
                    )
                    for item in raw_items
                ]
        except Exception as e:
            logger.warning(f"Failed to fetch workouts for {user_id}: {e}")
            return []

    async def get_sync_status(
        self,
        user_id: str
    ) -> WearableSyncStatus:
        """Fetches sync status."""
        connections = await self.get_connections(user_id)
        active_providers = [c.provider for c in connections if c.status == "active"]
        return WearableSyncStatus(
            user_id=user_id,
            is_syncing=False,
            last_successful_sync_at=datetime.utcnow() if active_providers else None,
            connected_provider_count=len(connections),
            active_providers=active_providers
        )


class MockWearableDataGateway(WearableDataGateway):
    """
    In-memory Mock Adapter for local development, integration tests, and CI/CD pipelines.
    Provides realistic default telemetry for Indian care subjects (e.g. Ramesh Sharma in Chennai).
    """

    def __init__(self):
        self._user_connections: Dict[str, List[DeviceConnectionResponse]] = {}
        self._user_activity: Dict[str, List[WearableActivitySummary]] = {}
        self._user_sleep: Dict[str, List[WearableSleepSummary]] = {}
        self._user_recovery: Dict[str, List[WearableRecoverySummary]] = {}
        self._user_workouts: Dict[str, List[WearableWorkoutSummary]] = {}

    def seed_user_data(
        self,
        user_id: str,
        connections: Optional[List[DeviceConnectionResponse]] = None,
        activity: Optional[List[WearableActivitySummary]] = None,
        sleep: Optional[List[WearableSleepSummary]] = None,
        recovery: Optional[List[WearableRecoverySummary]] = None,
        workouts: Optional[List[WearableWorkoutSummary]] = None
    ):
        if connections is not None:
            self._user_connections[user_id] = connections
        if activity is not None:
            self._user_activity[user_id] = activity
        if sleep is not None:
            self._user_sleep[user_id] = sleep
        if recovery is not None:
            self._user_recovery[user_id] = recovery
        if workouts is not None:
            self._user_workouts[user_id] = workouts

    def _ensure_default_seed(self, user_id: str):
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        if user_id not in self._user_connections:
            self._user_connections[user_id] = [
                DeviceConnectionResponse(
                    id=str(uuid.uuid4()),
                    provider="garmin",
                    status="active",
                    provider_user_id="garmin_user_9921",
                    last_synced_at=datetime.utcnow(),
                    capabilities={"activity": True, "sleep": True, "recovery": True}
                ),
                DeviceConnectionResponse(
                    id=str(uuid.uuid4()),
                    provider="apple_health",
                    status="active",
                    provider_user_id="apple_health_ramesh",
                    last_synced_at=datetime.utcnow(),
                    capabilities={"activity": True, "sleep": True, "heart_rate": True}
                )
            ]

        if user_id not in self._user_activity:
            self._user_activity[user_id] = [
                WearableActivitySummary(
                    date=today_str,
                    steps=5840,
                    active_duration_minutes=48,
                    calories_burned_kcal=2150.0,
                    distance_meters=4120.0,
                    floors_climbed=6,
                    source_provider="garmin"
                )
            ]

        if user_id not in self._user_sleep:
            self._user_sleep[user_id] = [
                WearableSleepSummary(
                    date=today_str,
                    total_sleep_minutes=440,
                    deep_sleep_minutes=75,
                    light_sleep_minutes=240,
                    rem_sleep_minutes=95,
                    awake_minutes=30,
                    sleep_score=84,
                    efficiency_percentage=93.5,
                    source_provider="garmin"
                )
            ]

        if user_id not in self._user_recovery:
            self._user_recovery[user_id] = [
                WearableRecoverySummary(
                    date=today_str,
                    resting_heart_rate_bpm=64,
                    hrv_ms=48.5,
                    spo2_percentage=98.2,
                    skin_temperature_celsius=36.4,
                    recovery_score=82,
                    respiratory_rate_bpm=14.2,
                    source_provider="garmin"
                )
            ]

        if user_id not in self._user_workouts:
            self._user_workouts[user_id] = [
                WearableWorkoutSummary(
                    id=str(uuid.uuid4()),
                    date=today_str,
                    activity_type="walking",
                    duration_minutes=35,
                    calories_burned_kcal=180.0,
                    average_heart_rate_bpm=108,
                    max_heart_rate_bpm=124,
                    distance_meters=2600.0,
                    source_provider="garmin"
                )
            ]

    async def create_user(
        self,
        user_id: str,
        email: Optional[str] = None,
        display_name: Optional[str] = None
    ) -> Dict[str, Any]:
        self._ensure_default_seed(user_id)
        return {"user_id": user_id, "status": "created", "environment": "mock"}

    async def create_connection_link(
        self,
        user_id: str,
        provider: str
    ) -> DeviceConnectUrlResponse:
        return DeviceConnectUrlResponse(
            provider=provider,
            connect_url=f"https://connect.openwearables.dev/auth/{provider}?mock_user={user_id}",
            invitation_code=f"inv_mock_{provider}_{uuid.uuid4().hex[:6]}",
            sdk_token=f"mock_sdk_jwt_{provider}",
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )

    async def get_connections(
        self,
        user_id: str
    ) -> List[DeviceConnectionResponse]:
        self._ensure_default_seed(user_id)
        return self._user_connections.get(user_id, [])

    async def disconnect(
        self,
        user_id: str,
        connection_id_or_provider: str
    ) -> bool:
        self._ensure_default_seed(user_id)
        conns = self._user_connections.get(user_id, [])
        self._user_connections[user_id] = [
            c for c in conns if c.id != connection_id_or_provider and c.provider != connection_id_or_provider
        ]
        return True

    async def get_metrics(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        self._ensure_default_seed(user_id)
        return {
            "user_id": user_id,
            "activity": [a.model_dump() for a in self._user_activity.get(user_id, [])],
            "sleep": [s.model_dump() for s in self._user_sleep.get(user_id, [])],
            "recovery": [r.model_dump() for r in self._user_recovery.get(user_id, [])]
        }

    async def get_daily_activity(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableActivitySummary]:
        self._ensure_default_seed(user_id)
        return self._user_activity.get(user_id, [])

    async def get_sleep(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableSleepSummary]:
        self._ensure_default_seed(user_id)
        return self._user_sleep.get(user_id, [])

    async def get_heart_rate(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableRecoverySummary]:
        self._ensure_default_seed(user_id)
        return self._user_recovery.get(user_id, [])

    async def get_workouts(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableWorkoutSummary]:
        self._ensure_default_seed(user_id)
        return self._user_workouts.get(user_id, [])

    async def get_sync_status(
        self,
        user_id: str
    ) -> WearableSyncStatus:
        self._ensure_default_seed(user_id)
        conns = self._user_connections.get(user_id, [])
        active = [c.provider for c in conns if c.status == "active"]
        return WearableSyncStatus(
            user_id=user_id,
            is_syncing=False,
            last_successful_sync_at=datetime.utcnow(),
            connected_provider_count=len(conns),
            active_providers=active
        )


# Backward-compatible aliases
IOpenWearablesGateway = WearableDataGateway
HttpOpenWearablesGateway = OpenWearablesGateway
MockOpenWearablesGateway = MockWearableDataGateway
