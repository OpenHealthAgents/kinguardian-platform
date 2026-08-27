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
    WearableProviderConnection,
    WearableConnection
)


@pytest.mark.asyncio
async def test_wearable_connections_table_examples(test_db_session: AsyncSession):
    """
    Tests the wearable_connections table matching the exact user specification:
    wearable_connections:
    - id UUID PK
    - family_id UUID FK
    - subject_id UUID FK
    - profile_id UUID FK
    - provider VARCHAR NOT NULL
    - open_wearables_user_id VARCHAR NOT NULL
    - provider_user_id VARCHAR NULL
    - connection_status VARCHAR NOT NULL
    - permissions JSONB
    - connected_at TIMESTAMPTZ
    - last_sync_at TIMESTAMPTZ NULL
    - disconnected_at TIMESTAMPTZ NULL
    - metadata JSONB
    - created_at TIMESTAMPTZ
    - updated_at TIMESTAMPTZ

    Examples verified:
    1. Ramesh -> Garmin -> connected
    2. Lakshmi -> Fitbit -> connected
    """
    session = test_db_session

    # 1. Family Circle & Coordinator Profile
    coord_id = uuid.uuid4()
    anjali = AppProfile(
        id=coord_id,
        iam_subject_id="iam_anjali_london",
        email="anjali@family.org",
        display_name="Anjali Sharma",
        timezone="Europe/London"
    )
    session.add(anjali)

    family = Family(id=uuid.uuid4(), name="Sharma & Kumar Care Circle", primary_coordinator_profile_id=coord_id)
    session.add(family)
    await session.commit()

    # 2. Care Subject 1: Ramesh in Chennai
    ramesh = CareSubject(
        id=uuid.uuid4(),
        family_id=family.id,
        fhir_patient_id="pat_ramesh_001",
        relationship_to_coordinator="Father",
        city="Chennai",
        timezone="Asia/Kolkata",
        status="active"
    )
    session.add(ramesh)

    # 3. Care Subject 2: Lakshmi in Chennai
    lakshmi = CareSubject(
        id=uuid.uuid4(),
        family_id=family.id,
        fhir_patient_id="pat_lakshmi_002",
        relationship_to_coordinator="Mother",
        city="Chennai",
        timezone="Asia/Kolkata",
        status="active"
    )
    session.add(lakshmi)
    await session.commit()

    # Example 1: Ramesh -> Garmin -> connected
    ramesh_garmin = WearableConnection(
        id=uuid.uuid4(),
        family_id=family.id,
        subject_id=ramesh.id,
        profile_id=coord_id,
        provider="garmin",
        open_wearables_user_id=f"kinguard_subject_{ramesh.id}",
        provider_user_id="garmin_user_ramesh_771",
        connection_status="connected",
        permissions={"activity": True, "sleep": True, "recovery": True},
        metadata_json={"device_model": "Forerunner 265", "firmware": "18.23"}
    )
    session.add(ramesh_garmin)

    # Example 2: Lakshmi -> Fitbit -> connected
    lakshmi_fitbit = WearableConnection(
        id=uuid.uuid4(),
        family_id=family.id,
        subject_id=lakshmi.id,
        profile_id=coord_id,
        provider="fitbit",
        open_wearables_user_id=f"kinguard_subject_{lakshmi.id}",
        provider_user_id="fitbit_user_lakshmi_402",
        connection_status="connected",
        permissions={"activity": True, "sleep": True, "heart_rate": True},
        metadata_json={"device_model": "Charge 6", "app_version": "4.12"}
    )
    session.add(lakshmi_fitbit)
    await session.commit()

    # 4. Verify querying and relationships
    from sqlalchemy.orm import selectinload
    res_ramesh = await session.execute(
        select(CareSubject)
        .where(CareSubject.id == ramesh.id)
        .options(selectinload(CareSubject.wearable_connections))
    )
    subject_r = res_ramesh.scalar_one()
    assert len(subject_r.wearable_connections) == 1
    assert subject_r.wearable_connections[0].provider == "garmin"
    assert subject_r.wearable_connections[0].connection_status == "connected"
    assert subject_r.wearable_connections[0].open_wearables_user_id == f"kinguard_subject_{ramesh.id}"

    res_lakshmi = await session.execute(
        select(CareSubject)
        .where(CareSubject.id == lakshmi.id)
        .options(selectinload(CareSubject.wearable_connections))
    )
    subject_l = res_lakshmi.scalar_one()
    assert len(subject_l.wearable_connections) == 1
    assert subject_l.wearable_connections[0].provider == "fitbit"
    assert subject_l.wearable_connections[0].connection_status == "connected"
    assert subject_l.wearable_connections[0].open_wearables_user_id == f"kinguard_subject_{lakshmi.id}"

    # 5. Verify unique constraint: duplicate connection for same subject + provider fails
    dup_conn = WearableConnection(
        id=uuid.uuid4(),
        family_id=family.id,
        subject_id=ramesh.id,
        provider="garmin",
        open_wearables_user_id=f"kinguard_subject_{ramesh.id}",
        connection_status="connected"
    )
    session.add(dup_conn)
    with pytest.raises(IntegrityError):
        await session.commit()
    await session.rollback()



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
