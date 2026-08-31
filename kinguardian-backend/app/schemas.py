import uuid
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from zoneinfo import ZoneInfo


class FamilyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    home_timezone: str = "Asia/Kolkata"
    @field_validator("home_timezone")
    @classmethod
    def valid_timezone(cls, value: str) -> str:
        ZoneInfo(value)
        return value


class MemberCreate(BaseModel):
    profile_id: uuid.UUID
    role: str = Field(pattern="^(coordinator|parent|caregiver|observer)$")


class SubjectCreate(BaseModel):
    profile_id: uuid.UUID | None = None
    external_patient_ref: str | None = Field(default=None, max_length=255)
    preferred_timezone: str = "Asia/Kolkata"
    @field_validator("preferred_timezone")
    @classmethod
    def valid_timezone(cls, value: str) -> str:
        ZoneInfo(value)
        return value


class GrantCreate(BaseModel):
    profile_id: uuid.UUID
    scopes: set[str] = Field(min_length=1)
    expires_at: datetime | None = None


class TaskCreate(BaseModel):
    assigned_to: uuid.UUID
    title: str = Field(min_length=1, max_length=200)
    detail: str | None = Field(default=None, max_length=5000)
    priority: str = Field(default="routine", pattern="^(routine|high|urgent)$")
    due_at: datetime


class CheckInCreate(BaseModel):
    occurred_at: datetime
    mood: str = Field(min_length=1, max_length=24)
    note: str | None = Field(default=None, max_length=5000)
    severity: str = Field(default="normal", pattern="^(normal|watch|urgent)$")


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)


class ConsentCreate(BaseModel):
    profile_id: uuid.UUID
    scopes: set[str] = Field(min_length=1)


class RoutedCheckInCreate(CheckInCreate):
    family_id: uuid.UUID
    subject_id: uuid.UUID


class MedicationTakenCreate(BaseModel):
    family_id: uuid.UUID
    subject_id: uuid.UUID
    taken_at: datetime
    source: str = Field(default="parent", pattern="^(parent|caregiver|coordinator)$")


class RoutedTaskCreate(TaskCreate):
    family_id: uuid.UUID
    subject_id: uuid.UUID


class DocumentCreate(BaseModel):
    family_id: uuid.UUID
    subject_id: uuid.UUID
    filenest_file_id: str = Field(min_length=1, max_length=255)
    classification: str = Field(default="unclassified", max_length=64)


class AIMessageCreate(MessageCreate):
    # The agent receives a bounded conversation reference; it does not receive raw DB access.
    pass


class TaskComplete(BaseModel):
    completed_at: datetime
