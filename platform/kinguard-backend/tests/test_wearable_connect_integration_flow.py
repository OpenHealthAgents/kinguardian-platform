"""
Wearable Connect Integration Flow Test Suite.

Verifies the complete #Connect Lifecycle:
KinGuard
→ Open Wearables
→ connection link
→ callback / webhook
→ connection persisted

Scenario:
1. Coordinator/Parent initiates connection for Dad (Ramesh in Chennai) to Garmin.
2. KinGuard validates active wearable health data consent.
3. KinGuard requests a secure invitation link from Open Wearables.
4. Open Wearables returns connection link (connect_url + invitation_code).
5. User authorizes on provider screen.
6. Open Wearables sends callback / webhook to KinGuard API.
7. KinGuard verifies webhook signature and persists the connection with status="active".
8. Connection query returns the active persisted wearable device.
"""

import pytest
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.core.database import Base
from app.domains.family.infrastructure.models import (
    AppProfile,
    Family,
    FamilyMembership,
    CareSubject,
    WearableConnection,
    WearableDataSource,
    Consent
)
from app.domains.wearables.gateway import MockWearableDataGateway
from app.domains.wearables.schemas import OpenWearablesWebhookPayload
from app.domains.wearables.services import WearableService


@pytest.fixture
async def integration_db_session():
    """In-memory SQLite async database session for integration testing."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with async_session() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_connect_kinguard_to_open_wearables_link_callback_persisted(integration_db_session: AsyncSession):
    """
    Executes the full #Connect flow:
    KinGuard -> Open Wearables -> connection link -> callback -> connection persisted
    """
    session = integration_db_session

    # Step 0: Setup Dad (Ramesh Sharma in Chennai) and Anjali in London
    dad_profile_id = uuid.uuid4()
    dad_profile = AppProfile(
        id=dad_profile_id,
        iam_subject_id="iam_ramesh_chennai",
        email="ramesh@family.org",
        display_name="Ramesh Sharma",
        timezone="Asia/Kolkata"
    )
    session.add(dad_profile)

    coordinator_id = uuid.uuid4()
    coordinator_profile = AppProfile(
        id=coordinator_id,
        iam_subject_id="iam_anjali_london",
        email="anjali@family.org",
        display_name="Anjali Sharma",
        timezone="Europe/London"
    )
    session.add(coordinator_profile)

    family_id = uuid.uuid4()
    family = Family(
        id=family_id,
        name="Sharma Family Circle",
        primary_coordinator_profile_id=coordinator_id
    )
    session.add(family)

    subject_id = uuid.uuid4()
    care_subject = CareSubject(
        id=subject_id,
        family_id=family_id,
        profile_id=dad_profile_id,
        fhir_patient_id="synthetic-pat-ramesh-001",
        relationship_to_coordinator="Father",
        city="Chennai",
        timezone="Asia/Kolkata",
        status="active"
    )
    session.add(care_subject)

    # Active Wearable Data Consent Grant
    consent = Consent(
        id=uuid.uuid4(),
        family_id=family_id,
        subject_id=subject_id,
        grantor_profile_id=dad_profile_id,
        grantee_profile_id=coordinator_id,
        consent_type="wearable_health_data",
        scope={"activity": True, "sleep": True, "heart_rate": True},
        status="active"
    )
    session.add(consent)
    await session.commit()


    # Step 1: KinGuard -> Open Wearables Connection Request
    mock_gateway = MockWearableDataGateway()
    wearable_service = WearableService(session=session, gateway=mock_gateway)

    # Step 2: Generate connection link
    connection_invitation = await wearable_service.create_connection_invitation(
        subject_id=subject_id,
        provider="garmin",
        redirect_url="kinguard://wearables/callback"
    )

    # Step 3: Assert connection link is generated
    assert connection_invitation.provider == "garmin"
    assert connection_invitation.connect_url is not None
    assert "garmin" in connection_invitation.connect_url.lower()

    # Verify initial database state is "pending"
    res_pending = await session.execute(
        select(WearableConnection).where(
            WearableConnection.subject_id == subject_id,
            WearableConnection.provider == "garmin"
        )
    )
    pending_conn = res_pending.scalar_one_or_none()
    assert pending_conn is not None
    assert pending_conn.connection_status == "pending"

    # Step 4: Provider OAuth Callback / Webhook arrives from Open Wearables
    wearable_user_id = wearable_service.get_wearable_user_id(subject_id)
    callback_webhook = OpenWearablesWebhookPayload(
        event_id=f"evt_cb_{uuid.uuid4().hex[:12]}",
        event_type="connection.created",
        user_id=wearable_user_id,
        provider="garmin",
        timestamp=datetime.now(timezone.utc).isoformat(),
        data={
            "connection_id": f"conn_garmin_{uuid.uuid4().hex[:8]}",
            "provider_user_id": "garmin_usr_99812",
            "status": "active",
            "device_model": "Garmin Venu 3",
            "device_name": "Dad's Garmin Watch",
            "capabilities": {
                "activity": True,
                "sleep": True,
                "heart_rate": True
            }
        }
    )

    # Step 5: Process Inbound Webhook / Callback
    webhook_result = await wearable_service.process_inbound_webhook(callback_webhook)
    assert webhook_result["status"] == "processed"
    assert "outbox_id" in webhook_result

    # Step 6: Verify Connection is Persisted in KinGuard DB with status="connected"
    res_active = await session.execute(
        select(WearableConnection).where(
            WearableConnection.subject_id == subject_id,
            WearableConnection.provider == "garmin"
        )
    )
    active_conn = res_active.scalar_one_or_none()
    assert active_conn is not None
    assert active_conn.connection_status == "connected"
    assert active_conn.provider_user_id == "garmin_usr_99812"

    # Step 7: Verify WearableDataSource is also persisted
    res_source = await session.execute(
        select(WearableDataSource).where(
            WearableDataSource.connection_id == active_conn.id
        )
    )
    active_source = res_source.scalar_one_or_none()
    assert active_source is not None
    assert active_source.status == "active"
    assert active_source.device_name == "Dad's Garmin Watch"
    assert active_source.provider == "garmin"


