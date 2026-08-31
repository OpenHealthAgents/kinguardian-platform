import uuid
from datetime import UTC, datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.models import CareSubject, CareTask, CheckIn, Conversation, DocumentReference, Family, Insight, MedicationAdherence, Membership, Message, Notification
from app.schemas import AIMessageCreate, CheckInCreate, DocumentCreate, FamilyCreate, GrantCreate, MedicationTakenCreate, MemberCreate, MessageCreate, RoutedCheckInCreate, RoutedTaskCreate, SubjectCreate, TaskComplete, TaskCreate
from app.security import current_profile, require_membership
from app.services import CARE_WRITE, COORDINATOR, authorize_subject, create_family, grant_access, notify_coordinators, record, subject_for_family

router = APIRouter(prefix="/api/v1")


def view(model):
    data = {column.name: getattr(model, column.name) for column in model.__table__.columns}
    return data


def notification_adapter(request: Request):
    return request.app.state.notification_adapter


def ai_adapter(request: Request):
    return request.app.state.ai_adapter


async def create_checkin(session, actor, family_id, subject_id, body):
    await authorize_subject(session, family_id, subject_id, actor.id, "checkins", write=True)
    if body.occurred_at.tzinfo is None:
        raise HTTPException(422, "occurred_at must include an offset/timezone")
    checkin = CheckIn(subject_id=subject_id, submitted_by=actor.id, mood=body.mood, note=body.note, severity=body.severity, occurred_at=body.occurred_at)
    session.add(checkin)
    await session.flush()
    await record(session, actor_id=actor.id, family_id=family_id, action="care.checkin_recorded.v1", resource_type="checkin", resource_id=checkin.id, payload={"severity": checkin.severity})
    return checkin


@router.post("/families", status_code=status.HTTP_201_CREATED)
async def post_family(body: FamilyCreate, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    family = await create_family(session, actor.id, body.name, body.home_timezone)
    await session.commit()
    return view(family)


@router.get("/families")
async def list_families(session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    rows = (await session.execute(select(Family).join(Membership).where(Membership.profile_id == actor.id, Membership.status == "active"))).scalars().all()
    return [view(row) for row in rows]


@router.post("/families/{family_id}/members", status_code=201)
async def post_member(family_id: uuid.UUID, body: MemberCreate, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    await require_membership(session, family_id, actor.id, COORDINATOR)
    if not await session.get(Family, family_id):
        raise HTTPException(404, "Family not found")
    membership = Membership(family_id=family_id, profile_id=body.profile_id, role=body.role)
    session.add(membership)
    await session.flush()
    await record(session, actor_id=actor.id, family_id=family_id, action="family.member_added.v1", resource_type="membership", resource_id=membership.id, payload={"role": body.role})
    await session.commit()
    return view(membership)


@router.post("/families/{family_id}/subjects", status_code=201)
async def post_subject(family_id: uuid.UUID, body: SubjectCreate, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    await require_membership(session, family_id, actor.id, COORDINATOR)
    subject = CareSubject(family_id=family_id, **body.model_dump())
    session.add(subject)
    await session.flush()
    await record(session, actor_id=actor.id, family_id=family_id, action="care.subject_created.v1", resource_type="care_subject", resource_id=subject.id, payload={"timezone": subject.preferred_timezone})
    await session.commit()
    return view(subject)


@router.post("/families/{family_id}/subjects/{subject_id}/access-grants", status_code=201)
async def post_grant(family_id: uuid.UUID, subject_id: uuid.UUID, body: GrantCreate, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    grant = await grant_access(session, family_id, subject_id, actor.id, body.profile_id, body.scopes, body.expires_at)
    await session.commit()
    return view(grant)


@router.post("/families/{family_id}/subjects/{subject_id}/care-tasks", status_code=201)
async def post_task(family_id: uuid.UUID, subject_id: uuid.UUID, body: TaskCreate, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    await authorize_subject(session, family_id, subject_id, actor.id, "care.tasks", write=True)
    await require_membership(session, family_id, body.assigned_to)
    if body.due_at.tzinfo is None:
        raise HTTPException(422, "due_at must include an offset/timezone")
    task = CareTask(family_id=family_id, subject_id=subject_id, created_by=actor.id, **body.model_dump())
    session.add(task)
    await session.flush()
    await record(session, actor_id=actor.id, family_id=family_id, action="care.task_created.v1", resource_type="care_task", resource_id=task.id, payload={"subject_id": str(subject_id), "due_at": task.due_at.astimezone(UTC).isoformat()})
    await session.commit()
    return view(task)


@router.post("/families/{family_id}/subjects/{subject_id}/checkins", status_code=201)
async def post_checkin(family_id: uuid.UUID, subject_id: uuid.UUID, body: CheckInCreate, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    checkin = await create_checkin(session, actor, family_id, subject_id, body)
    await session.commit()
    return view(checkin)


@router.post("/check-ins", status_code=201)
async def post_checkin_flat(body: RoutedCheckInCreate, session: AsyncSession = Depends(get_session), actor=Depends(current_profile), notifier=Depends(notification_adapter)):
    checkin = await create_checkin(session, actor, body.family_id, body.subject_id, body)
    await notify_coordinators(session, body.family_id, "care.checkin_recorded.v1", {"subject_id": str(body.subject_id), "severity": body.severity}, notifier)
    await session.commit()
    return view(checkin)


@router.post("/medications/{medication_id}/take", status_code=201)
async def take_medication(medication_id: str, body: MedicationTakenCreate, session: AsyncSession = Depends(get_session), actor=Depends(current_profile), notifier=Depends(notification_adapter)):
    await authorize_subject(session, body.family_id, body.subject_id, actor.id, "medications", write=True)
    if body.taken_at.tzinfo is None:
        raise HTTPException(422, "taken_at must include an offset/timezone")
    adherence = MedicationAdherence(subject_id=body.subject_id, medication_ref=medication_id, confirmed_by=actor.id, taken_at=body.taken_at, source=body.source)
    session.add(adherence)
    await session.flush()
    await record(session, actor_id=actor.id, family_id=body.family_id, action="medication.taken_recorded.v1", resource_type="medication_adherence", resource_id=adherence.id, payload={"medication_ref": medication_id})
    await notify_coordinators(session, body.family_id, "medication.taken_recorded.v1", {"subject_id": str(body.subject_id), "medication_ref": medication_id}, notifier)
    await session.commit()
    return view(adherence)


@router.post("/care/tasks", status_code=201)
async def post_task_flat(body: RoutedTaskCreate, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    await authorize_subject(session, body.family_id, body.subject_id, actor.id, "care.tasks", write=True)
    await require_membership(session, body.family_id, body.assigned_to)
    if body.due_at.tzinfo is None:
        raise HTTPException(422, "due_at must include an offset/timezone")
    task = CareTask(family_id=body.family_id, subject_id=body.subject_id, created_by=actor.id, assigned_to=body.assigned_to, title=body.title, detail=body.detail, priority=body.priority, due_at=body.due_at)
    session.add(task)
    await session.flush()
    await record(session, actor_id=actor.id, family_id=body.family_id, action="care.task_created.v1", resource_type="care_task", resource_id=task.id, payload={"subject_id": str(body.subject_id)})
    await session.commit()
    return view(task)


@router.post("/care/tasks/{task_id}/complete")
async def complete_task(task_id: uuid.UUID, body: TaskComplete, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    task = await session.get(CareTask, task_id)
    if not task:
        raise HTTPException(404, "Care task not found")
    membership = await require_membership(session, task.family_id, actor.id)
    await authorize_subject(session, task.family_id, task.subject_id, actor.id, "care.tasks", write=True)
    if task.assigned_to != actor.id and membership.role != "coordinator":
        raise HTTPException(403, "Only the assignee or coordinator may complete this task")
    if body.completed_at.tzinfo is None:
        raise HTTPException(422, "completed_at must include an offset/timezone")
    task.status, task.completed_at = "completed", body.completed_at
    await record(session, actor_id=actor.id, family_id=task.family_id, action="care.task_completed.v1", resource_type="care_task", resource_id=task.id, payload={"subject_id": str(task.subject_id)})
    response_data = view(task)
    await session.commit()
    return response_data


@router.post("/documents", status_code=201)
async def post_document(body: DocumentCreate, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    await authorize_subject(session, body.family_id, body.subject_id, actor.id, "documents", write=True)
    document = DocumentReference(**body.model_dump(), uploaded_by=actor.id)
    session.add(document)
    await session.flush()
    await record(session, actor_id=actor.id, family_id=body.family_id, action="document.reference_registered.v1", resource_type="document_reference", resource_id=document.id, payload={"filenest_file_id": body.filenest_file_id})
    await session.commit()
    return view(document)


@router.get("/families/{family_id}/subjects/{subject_id}/timeline")
async def get_timeline(family_id: uuid.UUID, subject_id: uuid.UUID, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    await authorize_subject(session, family_id, subject_id, actor.id, "health.summary")
    tasks = (await session.execute(select(CareTask).where(CareTask.subject_id == subject_id).order_by(CareTask.due_at.desc()).limit(30))).scalars().all()
    checkins = (await session.execute(select(CheckIn).where(CheckIn.subject_id == subject_id).order_by(CheckIn.occurred_at.desc()).limit(30))).scalars().all()
    return {"subject_id": subject_id, "tasks": [view(x) for x in tasks], "checkins": [view(x) for x in checkins]}


@router.get("/families/{family_id}/home")
async def family_home(family_id: uuid.UUID, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    membership = await require_membership(session, family_id, actor.id)
    family = await session.get(Family, family_id)
    if not family:
        raise HTTPException(404, "Family not found")
    subjects = (await session.execute(select(CareSubject).where(CareSubject.family_id == family_id, CareSubject.status == "active"))).scalars().all()
    open_tasks = (await session.execute(select(CareTask).where(CareTask.family_id == family_id, CareTask.status == "open").order_by(CareTask.due_at).limit(10))).scalars().all()
    latest_checkins = []
    if membership.role == "coordinator":
        latest_checkins = [view(item) for item in (await session.execute(select(CheckIn).join(CareSubject).where(CareSubject.family_id == family_id).order_by(CheckIn.occurred_at.desc()).limit(10))).scalars().all()]
    notifications = [view(item) for item in (await session.execute(select(Notification).where(Notification.family_id == family_id, Notification.recipient_id == actor.id).order_by(Notification.created_at.desc()).limit(20))).scalars().all()]
    return {"family": view(family), "subjects": [view(subject) for subject in subjects], "open_tasks": [view(task) for task in open_tasks], "recent_checkins": latest_checkins, "notifications": notifications}


@router.get("/subjects/{subject_id}/home")
async def subject_home(subject_id: uuid.UUID, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    subject = await session.get(CareSubject, subject_id)
    if not subject:
        raise HTTPException(404, "Care subject not found")
    await authorize_subject(session, subject.family_id, subject_id, actor.id, "health.summary")
    tasks = (await session.execute(select(CareTask).where(CareTask.subject_id == subject_id, CareTask.status == "open").order_by(CareTask.due_at).limit(5))).scalars().all()
    latest = (await session.execute(select(CheckIn).where(CheckIn.subject_id == subject_id).order_by(CheckIn.occurred_at.desc()).limit(1))).scalar_one_or_none()
    return {"subject": view(subject), "open_tasks": [view(task) for task in tasks], "latest_checkin": view(latest) if latest else None}


@router.get("/subjects/{subject_id}/timeline")
async def subject_timeline(subject_id: uuid.UUID, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    subject = await session.get(CareSubject, subject_id)
    if not subject:
        raise HTTPException(404, "Care subject not found")
    await authorize_subject(session, subject.family_id, subject_id, actor.id, "health.summary")
    tasks = (await session.execute(select(CareTask).where(CareTask.subject_id == subject_id).order_by(CareTask.due_at.desc()).limit(30))).scalars().all()
    checkins = (await session.execute(select(CheckIn).where(CheckIn.subject_id == subject_id).order_by(CheckIn.occurred_at.desc()).limit(30))).scalars().all()
    return {"subject_id": subject_id, "tasks": [view(item) for item in tasks], "checkins": [view(item) for item in checkins]}


@router.post("/families/{family_id}/conversations", status_code=201)
async def post_conversation(family_id: uuid.UUID, subject_id: uuid.UUID | None = None, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    await require_membership(session, family_id, actor.id)
    if subject_id:
        await authorize_subject(session, family_id, subject_id, actor.id, "messages")
    conversation = Conversation(family_id=family_id, subject_id=subject_id)
    session.add(conversation)
    await session.flush()
    await record(session, actor_id=actor.id, family_id=family_id, action="communication.conversation_created.v1", resource_type="conversation", resource_id=conversation.id, payload={})
    await session.commit()
    return view(conversation)


@router.post("/families/{family_id}/conversations/{conversation_id}/messages", status_code=201)
async def post_message(family_id: uuid.UUID, conversation_id: uuid.UUID, body: MessageCreate, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    await require_membership(session, family_id, actor.id)
    conversation = await session.get(Conversation, conversation_id)
    if not conversation or conversation.family_id != family_id:
        raise HTTPException(404, "Conversation not found")
    message = Message(conversation_id=conversation_id, sender_id=actor.id, body=body.body)
    session.add(message)
    await session.flush()
    await record(session, actor_id=actor.id, family_id=family_id, action="communication.message_sent.v1", resource_type="message", resource_id=message.id, payload={"conversation_id": str(conversation_id)})
    await session.commit()
    return view(message)


@router.post("/ai/conversations/{conversation_id}/messages", status_code=201)
async def post_ai_message(conversation_id: uuid.UUID, body: AIMessageCreate, session: AsyncSession = Depends(get_session), actor=Depends(current_profile), ai=Depends(ai_adapter)):
    conversation = await session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(404, "Conversation not found")
    await require_membership(session, conversation.family_id, actor.id)
    if conversation.subject_id:
        await authorize_subject(session, conversation.family_id, conversation.subject_id, actor.id, "messages")
    message = Message(conversation_id=conversation_id, sender_id=actor.id, body=body.body)
    session.add(message)
    await session.flush()
    latest_checkin = None
    if conversation.subject_id:
        latest_checkin = (await session.execute(select(CheckIn).where(CheckIn.subject_id == conversation.subject_id).order_by(CheckIn.occurred_at.desc()).limit(1))).scalar_one_or_none()
    summary = await ai.generate_insight(body.body, {"latest_checkin_severity": latest_checkin.severity if latest_checkin else "unknown"})
    insight = Insight(family_id=conversation.family_id, subject_id=conversation.subject_id, conversation_id=conversation.id, summary=summary)
    session.add(insight)
    await session.flush()
    await record(session, actor_id=actor.id, family_id=conversation.family_id, action="ai.message_submitted.v1", resource_type="message", resource_id=message.id, payload={"conversation_id": str(conversation_id)})
    await record(session, actor_id=actor.id, family_id=conversation.family_id, action="ai.insight_generated.v1", resource_type="insight", resource_id=insight.id, payload={"conversation_id": str(conversation_id), "subject_id": str(conversation.subject_id) if conversation.subject_id else None})
    await session.commit()
    return {**view(message), "insight": view(insight)}


@router.get("/families/{family_id}/notifications")
async def list_notifications(family_id: uuid.UUID, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    await require_membership(session, family_id, actor.id)
    rows = (await session.execute(select(Notification).where(Notification.family_id == family_id, Notification.recipient_id == actor.id).order_by(Notification.created_at.desc()))).scalars().all()
    return [view(item) for item in rows]


@router.get("/families/{family_id}/audit")
async def get_audit(family_id: uuid.UUID, session: AsyncSession = Depends(get_session), actor=Depends(current_profile)):
    from app.models import AuditLog
    await require_membership(session, family_id, actor.id, COORDINATOR)
    rows = (await session.execute(select(AuditLog).where(AuditLog.family_id == family_id).order_by(AuditLog.occurred_at.desc()).limit(200))).scalars().all()
    return [view(row) for row in rows]
