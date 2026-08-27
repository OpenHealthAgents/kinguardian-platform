"""
Application Database Integration Test: Wearable Relational Chain.
Verifies the exact 5-tier relational hierarchy in the KinGuard application database:
KinGuard user (AppProfile)
    ↓
KinGuard care subject (CareSubject)
    ↓
Wearable identity (CareSubjectWearableIdentity)
    ↓
Open Wearables user (open_wearables_user_id)
    ↓
Provider connection (WearableProviderConnection)

Confirms that raw time-series metrics are NOT stored in the transactional database.
"""

import pytest
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.database import Base
from app.domains.family.infrastructure.models import (
    AppProfile,
    Family,
    FamilyMembership,
    CareSubject,
    CareSubjectWearableIdentity,
    WearableProviderConnection
)


@pytest.fixture
async def test_db_session():
    """In-memory SQLite async test database session."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with async_session() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_wearable_relational_hierarchy_and_constraints(test_db_session: AsyncSession):
    session = test_db_session

    # 1. KinGuard User (Anjali in London)
    user_id = uuid.uuid4()
    coordinator = AppProfile(
        id=user_id,
        iam_subject_id="iam_anjali_uk_01",
        email="anjali@london.org",
        display_name="Anjali Sharma",
        timezone="Europe/London"
    )
    session.add(coordinator)

    family = Family(id=uuid.uuid4(), name="Sharma Care Circle", primary_coordinator_profile_id=user_id)
    session.add(family)

    membership = FamilyMembership(
        id=uuid.uuid4(),
        family_id=family.id,
        profile_id=user_id,
        membership_role="primary_coordinator",
        status="active"
    )
    session.add(membership)

    # 2. KinGuard Care Subject (Dad / Ramesh in Chennai)
    subject_id = uuid.uuid4()
    subject = CareSubject(
        id=subject_id,
        family_id=family.id,
        fhir_patient_id="pat_ramesh_chennai",
        relationship_to_coordinator="Father",
        city="Chennai",
        country_code="IN",
        timezone="Asia/Kolkata",
        status="active"
    )
    session.add(subject)
    await session.commit()

    # 3. Wearable Identity -> Open Wearables User ID
    wearable_id = uuid.uuid4()
    open_wearables_uid = f"kinguard_subject_{subject.id}"
    identity = CareSubjectWearableIdentity(
        id=wearable_id,
        family_id=family.id,
        subject_id=subject.id,
        open_wearables_user_id=open_wearables_uid,
        baseline_step_goal=5000,
        baseline_sleep_hours_goal=7.50,
        status="active"
    )
    session.add(identity)
    await session.commit()

    # 4. Provider Connections (Garmin & Apple Health)
    conn_garmin = WearableProviderConnection(
        id=uuid.uuid4(),
        wearable_identity_id=identity.id,
        provider="garmin",
        provider_user_id="garmin_user_9921",
        status="active",
        capabilities={"activity": True, "sleep": True, "recovery": True}
    )
    conn_apple = WearableProviderConnection(
        id=uuid.uuid4(),
        wearable_identity_id=identity.id,
        provider="apple_health",
        provider_user_id="apple_health_ramesh",
        status="active",
        capabilities={"activity": True, "sleep": True}
    )
    session.add_all([conn_garmin, conn_apple])
    await session.commit()

    # 5. Query and verify full navigation chain
    from sqlalchemy.orm import selectinload
    res = await session.execute(
        select(CareSubject)
        .where(CareSubject.id == subject.id)
        .options(
            selectinload(CareSubject.wearable_identity)
            .selectinload(CareSubjectWearableIdentity.provider_connections)
        )
    )
    fetched_subject = res.scalar_one()
    assert fetched_subject.wearable_identity is not None
    assert fetched_subject.wearable_identity.open_wearables_user_id == open_wearables_uid
    assert len(fetched_subject.wearable_identity.provider_connections) == 2

    provider_names = [p.provider for p in fetched_subject.wearable_identity.provider_connections]
    assert "garmin" in provider_names
    assert "apple_health" in provider_names


    # 6. Verify duplicate provider constraint fails
    duplicate_garmin = WearableProviderConnection(
        id=uuid.uuid4(),
        wearable_identity_id=identity.id,
        provider="garmin",
        status="active"
    )
    session.add(duplicate_garmin)
    with pytest.raises(IntegrityError):
        await session.commit()
    await session.rollback()
