"""
Wearable Domain Service Module.
Orchestrates care-subject wearable mappings, metrics querying, webhook event handling,
and Guardian AI anomaly detection.
"""

import uuid
import hmac
import hashlib
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.logging import get_logger
from app.domains.wearables.gateway import IOpenWearablesGateway, HttpOpenWearablesGateway
from app.domains.wearables.schemas import (
    DeviceConnectionResponse,
    DeviceConnectUrlResponse,
    WearableActivitySummary,
    WearableSleepSummary,
    WearableRecoverySummary,
    WearableDashboardResponse,
    OpenWearablesWebhookPayload
)
from app.domains.events.outbox import OutboxService
from app.domains.family.infrastructure.models import (
    CareSubject,
    AIInsight,
    Notification
)

logger = get_logger(__name__)


class WearableService:
    """
    Business logic and orchestration service for wearable device telemetry.
    """

    def __init__(
        self,
        session: AsyncSession,
        gateway: Optional[IOpenWearablesGateway] = None,
        outbox_svc: Optional[OutboxService] = None
    ):
        self.session = session
        self.gateway = gateway or HttpOpenWearablesGateway()
        self.outbox_svc = outbox_svc or OutboxService(session)

    @staticmethod
    def get_wearable_user_id(subject_id: uuid.UUID) -> str:
        """
        Derives the deterministic Open Wearables user identifier for a KinGuard care subject.
        """
        return f"kinguard_subject_{subject_id}"

    async def get_subject_connections(self, subject_id: uuid.UUID) -> List[DeviceConnectionResponse]:
        """Fetch all connected wearable devices for a subject."""
        wearable_user_id = self.get_wearable_user_id(subject_id)
        return await self.gateway.get_user_connections(wearable_user_id)

    async def create_connection_invitation(
        self,
        subject_id: uuid.UUID,
        provider: str
    ) -> DeviceConnectUrlResponse:
        """Generate a connection link or SDK token for a specific provider."""
        wearable_user_id = self.get_wearable_user_id(subject_id)
        return await self.gateway.create_connection_invitation(wearable_user_id, provider)

    async def get_activity_history(
        self,
        subject_id: uuid.UUID,
        days: int = 7
    ) -> List[WearableActivitySummary]:
        """Fetch historical daily activity metrics."""
        wearable_user_id = self.get_wearable_user_id(subject_id)
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
        start_date = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
        return await self.gateway.get_activity_summaries(wearable_user_id, start_date, end_date)

    async def get_sleep_history(
        self,
        subject_id: uuid.UUID,
        days: int = 7
    ) -> List[WearableSleepSummary]:
        """Fetch historical sleep metrics."""
        wearable_user_id = self.get_wearable_user_id(subject_id)
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
        start_date = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
        return await self.gateway.get_sleep_summaries(wearable_user_id, start_date, end_date)

    async def get_recovery_history(
        self,
        subject_id: uuid.UUID,
        days: int = 7
    ) -> List[WearableRecoverySummary]:
        """Fetch historical recovery metrics (HRV, resting HR, SpO2)."""
        wearable_user_id = self.get_wearable_user_id(subject_id)
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
        start_date = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
        return await self.gateway.get_recovery_summaries(wearable_user_id, start_date, end_date)

    async def get_wearable_dashboard(self, subject_id: uuid.UUID) -> WearableDashboardResponse:
        """
        Aggregates a complete single-roundtrip wearable health overview for mobile clients.
        Includes active connections, latest daily vitals, weekly averages, and baseline trend analysis.
        """
        wearable_user_id = self.get_wearable_user_id(subject_id)
        connections = await self.gateway.get_user_connections(wearable_user_id)

        # 7-day query window
        activities = await self.get_activity_history(subject_id, days=7)
        sleeps = await self.get_sleep_history(subject_id, days=7)
        recoveries = await self.get_recovery_history(subject_id, days=7)

        latest_activity = activities[-1] if activities else None
        latest_sleep = sleeps[-1] if sleeps else None
        latest_recovery = recoveries[-1] if recoveries else None

        # Calculate weekly averages
        total_steps = sum(a.steps for a in activities)
        avg_steps = int(total_steps / len(activities)) if activities else 0

        total_sleep_mins = sum(s.total_sleep_minutes for s in sleeps)
        avg_sleep_hours = round(total_sleep_mins / (len(sleeps) * 60), 1) if sleeps else 0.0

        # Baseline anomaly detection: Ramesh's activity drop detection
        baseline_step_goal = 5000
        has_anomaly = False
        anomaly_desc = None

        if latest_activity and latest_activity.steps > 0 and latest_activity.steps < (baseline_step_goal * 0.4):
            has_anomaly = True
            drop_pct = int(((baseline_step_goal - latest_activity.steps) / baseline_step_goal) * 100)
            anomaly_desc = f"Activity dropped by {drop_pct}% compared to baseline goal ({latest_activity.steps} steps vs {baseline_step_goal} baseline)."

        return WearableDashboardResponse(
            subject_id=subject_id,
            wearable_user_id=wearable_user_id,
            connected_providers=connections,
            latest_activity=latest_activity,
            latest_sleep=latest_sleep,
            latest_recovery=latest_recovery,
            weekly_average_steps=avg_steps,
            weekly_average_sleep_hours=avg_sleep_hours,
            baseline_step_goal=baseline_step_goal,
            has_activity_anomaly=has_anomaly,
            anomaly_description=anomaly_desc
        )

    def verify_webhook_signature(self, payload_bytes: bytes, signature_header: Optional[str]) -> bool:
        """
        Verifies HMAC SHA-256 signature on inbound Open Wearables webhooks.
        """
        if not signature_header:
            return False
        secret = settings.OPEN_WEARABLES_WEBHOOK_SECRET.get_secret_value().encode("utf-8")
        computed = hmac.new(secret, payload_bytes, hashlib.sha256).hexdigest()
        return hmac.compare_digest(computed, signature_header)

    async def process_inbound_webhook(self, payload: OpenWearablesWebhookPayload) -> Dict[str, Any]:
        """
        Processes inbound webhook event from Open Wearables.
        Stages domain events in the transactional outbox and detects Guardian Moments.
        """
        logger.info(
            f"Processing Open Wearables webhook: event={payload.event_type} user={payload.user_id} provider={payload.provider}"
        )

        # Extract subject_id from user_id (format: "kinguard_subject_<uuid>")
        subject_id_str = payload.user_id.replace("kinguard_subject_", "")
        try:
            subject_id = uuid.UUID(subject_id_str)
        except ValueError:
            logger.warning(f"Could not parse care subject UUID from Open Wearables user_id '{payload.user_id}'")
            return {"status": "ignored", "reason": "invalid_subject_id"}

        # Find care subject to locate family_id
        res = await self.session.execute(
            select(CareSubject).where(CareSubject.id == subject_id)
        )
        subject = res.scalar_one_or_none()
        if not subject:
            logger.warning(f"Care subject {subject_id} not found for Open Wearables webhook")
            return {"status": "ignored", "reason": "subject_not_found"}

        # 1. Stage transactional domain event
        outbox_event = await self.outbox_svc.stage_event(
            event_type=f"wearable.{payload.event_type.replace(':', '.')}",
            aggregate_type="wearable_telemetry",
            aggregate_id=subject.id,
            family_id=subject.family_id,
            payload={
                "subject_id": str(subject.id),
                "wearable_user_id": payload.user_id,
                "provider": payload.provider,
                "event_type": payload.event_type,
                "data": payload.data
            }
        )

        # 2. Check for anomaly triggers in webhook payload
        activity_data = payload.data.get("activity", {})
        steps = activity_data.get("steps", 0)

        if steps > 0 and steps < 2000:
            # Significant activity drop -> Synthesize Guardian Moment
            now = datetime.utcnow()
            insight = AIInsight(
                family_id=subject.family_id,
                subject_id=subject.id,
                type="guardian_moment",
                severity="attention",
                title="Activity Trending Lower",
                summary=f"Wearable synced {steps} steps today, significantly below the 5,000 baseline goal.",
                observation=f"Daily step count dropped to {steps} steps.",
                recommendation="Reach out to Dad to check for mild fatigue or mobility discomfort.",
                timeframe_start=now - timedelta(days=1),
                timeframe_end=now,
                confidence=0.92,
                status="active",
                actionability="propose_care_task",
                baseline_comparison="Baseline: 5,000 steps/day",
                created_at=now
            )
            self.session.add(insight)
            await self.session.flush()

        await self.session.commit()
        return {"status": "processed", "outbox_id": str(outbox_event.id)}
