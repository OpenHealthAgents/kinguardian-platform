"""
Open Wearables Webhook Ingress Router.
Receives real-time data sync, connection change, and anomaly notifications from Open Wearables.
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.logging import get_logger
from app.domains.wearables.services import WearableService
from app.domains.wearables.schemas import OpenWearablesWebhookPayload

logger = get_logger(__name__)

router = APIRouter(
    prefix="/webhooks",
    tags=["Webhooks & Ingress"]
)


def get_wearable_service(session: AsyncSession = Depends(get_db)) -> WearableService:
    return WearableService(session=session)


@router.post(
    "/open-wearables",
    summary="Inbound webhook callback receiver from Open Wearables platform"
)
async def receive_open_wearables_webhook(
    request: Request,
    payload: OpenWearablesWebhookPayload,
    service: WearableService = Depends(get_wearable_service),
    x_open_wearables_signature: str = Header(None, alias="X-Open-Wearables-Signature")
):
    """
    Validates inbound Open Wearables webhook payload, stages domain events into the transactional outbox,
    and checks for biometric baseline anomalies to trigger proactive Guardian Moments.
    """
    body_bytes = await request.body()
    
    # In production environments with signature header, verify HMAC signature
    if x_open_wearables_signature:
        if not service.verify_webhook_signature(body_bytes, x_open_wearables_signature):
            logger.warning("Open Wearables webhook signature verification failed")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature."
            )

    result = await service.process_inbound_webhook(payload)
    return {"status": "success", "result": result}
