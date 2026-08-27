"""
Wearable Data Gateway Module (Hexagonal Anti-Corruption Layer).
Treats Open Wearables purely as an EXTERNAL INFRASTRUCTURE CAPABILITY.

Architectural Topology:
Mobile App
    ↓
KinGuard API
    ↓
WearableDataGateway (Anti-Corruption Layer)
    ↓
Open Wearables (External Capability Platform)
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

Guarantees:
- Zero duplication: No provider-specific SDK or OAuth logic resides in KinGuard.
- Schema isolation: Open Wearables internal schemas are translated via ACL into KinGuard domain DTOs.
- Resilience: All outbound calls are protected by a CircuitBreaker and strict HTTP timeouts.
"""

import abc
import uuid
from typing import List, Optional, Dict, Any
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
    WearableRecoverySummary
)

logger = get_logger(__name__)


class WearableDataGateway(abc.ABC):
    """
    Primary Port interface for wearable telemetry retrieval.
    Acts as the Hexagonal Boundary isolating KinGuard from external wearable platforms.
    """

    @abc.abstractmethod
    async def get_user_connections(self, user_id: str) -> List[DeviceConnectionResponse]:
        """Fetch active wearable connections for a user."""
        pass

    @abc.abstractmethod
    async def create_connection_invitation(self, user_id: str, provider: str) -> DeviceConnectUrlResponse:
        """Generate an OAuth connection URL or mobile SDK token."""
        pass

    @abc.abstractmethod
    async def get_activity_summaries(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableActivitySummary]:
        """Fetch daily aggregated activity metrics."""
        pass

    @abc.abstractmethod
    async def get_sleep_summaries(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableSleepSummary]:
        """Fetch daily aggregated sleep metrics."""
        pass

    @abc.abstractmethod
    async def get_recovery_summaries(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableRecoverySummary]:
        """Fetch daily recovery metrics (HRV, resting HR, SpO2)."""
        pass


# Backwards compatibility alias
IOpenWearablesGateway = WearableDataGateway


class HttpOpenWearablesGateway(WearableDataGateway):

    """
    Production HTTP Adapter for Open Wearables API.
    Interacts with Open Wearables backend endpoints protected by CircuitBreaker.
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
            "open_wearables",
            CircuitBreakerConfig(failure_threshold=4, recovery_timeout_seconds=15.0)
        )

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    async def get_user_connections(self, user_id: str) -> List[DeviceConnectionResponse]:
        async def _call():
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(
                    f"{self.base_url}/v1/users/{user_id}/connections",
                    headers=self._get_headers()
                )
                resp.raise_for_status()
                data = resp.json()
                return [DeviceConnectionResponse.model_validate(c) for c in data]

        try:
            return await self.circuit_breaker.call(_call)
        except Exception as e:
            logger.warning(f"Failed to fetch Open Wearables connections for {user_id}: {e}")
            return []

    async def create_connection_invitation(self, user_id: str, provider: str) -> DeviceConnectUrlResponse:
        async def _call():
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    f"{self.base_url}/v1/users/{user_id}/invitations",
                    headers=self._get_headers(),
                    json={"provider": provider}
                )
                resp.raise_for_status()
                data = resp.json()
                return DeviceConnectUrlResponse(
                    provider=provider,
                    connect_url=data.get("connect_url") or f"{self.base_url}/connect/{provider}?token={data.get('code')}",
                    invitation_code=data.get("code")
                )

        try:
            return await self.circuit_breaker.call(_call)
        except Exception as e:
            logger.warning(f"Failed to create connection invitation for {user_id}/{provider}: {e}")
            return DeviceConnectUrlResponse(
                provider=provider,
                connect_url=f"{self.base_url}/oauth/{provider}/authorize?user_id={user_id}"
            )

    async def get_activity_summaries(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableActivitySummary]:
        async def _call():
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(
                    f"{self.base_url}/v1/users/{user_id}/summaries/activity",
                    headers=self._get_headers(),
                    params={"start_date": start_date, "end_date": end_date}
                )
                resp.raise_for_status()
                payload = resp.json()
                items = payload.get("items", payload) if isinstance(payload, dict) else payload
                return [
                    WearableActivitySummary(
                        date=item.get("date", start_date),
                        steps=item.get("steps", 0),
                        active_duration_minutes=item.get("active_duration_minutes", 0),
                        calories_burned_kcal=item.get("calories_burned_kcal"),
                        distance_meters=item.get("distance_meters"),
                        source_provider=item.get("source_provider")
                    )
                    for item in items
                ]

        try:
            return await self.circuit_breaker.call(_call)
        except Exception as e:
            logger.warning(f"Failed to fetch activity summaries for {user_id}: {e}")
            return []

    async def get_sleep_summaries(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableSleepSummary]:
        async def _call():
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(
                    f"{self.base_url}/v1/users/{user_id}/summaries/sleep",
                    headers=self._get_headers(),
                    params={"start_date": start_date, "end_date": end_date}
                )
                resp.raise_for_status()
                payload = resp.json()
                items = payload.get("items", payload) if isinstance(payload, dict) else payload
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
                    for item in items
                ]

        try:
            return await self.circuit_breaker.call(_call)
        except Exception as e:
            logger.warning(f"Failed to fetch sleep summaries for {user_id}: {e}")
            return []

    async def get_recovery_summaries(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableRecoverySummary]:
        async def _call():
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(
                    f"{self.base_url}/v1/users/{user_id}/summaries/recovery",
                    headers=self._get_headers(),
                    params={"start_date": start_date, "end_date": end_date}
                )
                resp.raise_for_status()
                payload = resp.json()
                items = payload.get("items", payload) if isinstance(payload, dict) else payload
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
                    for item in items
                ]

        try:
            return await self.circuit_breaker.call(_call)
        except Exception as e:
            logger.warning(f"Failed to fetch recovery summaries for {user_id}: {e}")
            return []


class MockOpenWearablesGateway(IOpenWearablesGateway):
    """
    Deterministic Mock Gateway for local development, demo scenarios, and unit tests.
    """

    def __init__(self):
        self._connections: Dict[str, List[DeviceConnectionResponse]] = {}
        self._activity: Dict[str, List[WearableActivitySummary]] = {}
        self._sleep: Dict[str, List[WearableSleepSummary]] = {}
        self._recovery: Dict[str, List[WearableRecoverySummary]] = {}

    def seed_user_data(
        self,
        user_id: str,
        connections: Optional[List[DeviceConnectionResponse]] = None,
        activity: Optional[List[WearableActivitySummary]] = None,
        sleep: Optional[List[WearableSleepSummary]] = None,
        recovery: Optional[List[WearableRecoverySummary]] = None
    ):
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        self._connections[user_id] = connections or [
            DeviceConnectionResponse(
                id="conn-garmin-01",
                provider="garmin",
                status="active",
                provider_user_id="garmin_user_123",
                last_synced_at=datetime.utcnow()
            ),
            DeviceConnectionResponse(
                id="conn-apple-01",
                provider="apple_health",
                status="active",
                provider_user_id="apple_health_123",
                last_synced_at=datetime.utcnow()
            )
        ]
        self._activity[user_id] = activity or [
            WearableActivitySummary(
                date=today_str,
                steps=5840,
                active_duration_minutes=42,
                calories_burned_kcal=1850.0,
                distance_meters=4120.0,
                source_provider="garmin"
            )
        ]
        self._sleep[user_id] = sleep or [
            WearableSleepSummary(
                date=today_str,
                total_sleep_minutes=440,
                deep_sleep_minutes=95,
                light_sleep_minutes=240,
                rem_sleep_minutes=85,
                awake_minutes=20,
                sleep_score=84,
                efficiency_percentage=94.5,
                source_provider="garmin"
            )
        ]
        self._recovery[user_id] = recovery or [
            WearableRecoverySummary(
                date=today_str,
                resting_heart_rate_bpm=64,
                hrv_ms=48.5,
                spo2_percentage=98.0,
                skin_temperature_celsius=36.4,
                recovery_score=82,
                source_provider="garmin"
            )
        ]

    async def get_user_connections(self, user_id: str) -> List[DeviceConnectionResponse]:
        if user_id not in self._connections:
            self.seed_user_data(user_id)
        return self._connections.get(user_id, [])

    async def create_connection_invitation(self, user_id: str, provider: str) -> DeviceConnectUrlResponse:
        return DeviceConnectUrlResponse(
            provider=provider,
            connect_url=f"http://localhost:8000/connect/{provider}?user_id={user_id}",
            invitation_code=f"INV-{uuid.uuid4().hex[:6].upper()}",
            sdk_token=f"sdk_token_{uuid.uuid4()}"
        )

    async def get_activity_summaries(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableActivitySummary]:
        if user_id not in self._activity:
            self.seed_user_data(user_id)
        return self._activity.get(user_id, [])

    async def get_sleep_summaries(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableSleepSummary]:
        if user_id not in self._sleep:
            self.seed_user_data(user_id)
        return self._sleep.get(user_id, [])

    async def get_recovery_summaries(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> List[WearableRecoverySummary]:
        if user_id not in self._recovery:
            self.seed_user_data(user_id)
        return self._recovery.get(user_id, [])
