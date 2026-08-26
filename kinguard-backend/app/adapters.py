"""Replaceable outbound adapters used by the application layer.

Production adapters call provider APIs. These deterministic adapters let workflow
tests run without external credentials or network calls.
"""
from dataclasses import dataclass, field
from typing import Protocol


class NotificationAdapter(Protocol):
    async def deliver(self, recipient_id: str, event_type: str, payload: dict) -> None: ...


class AIAdapter(Protocol):
    async def generate_insight(self, question: str, context: dict) -> str: ...


@dataclass
class MockNotificationAdapter:
    deliveries: list[dict] = field(default_factory=list)
    async def deliver(self, recipient_id: str, event_type: str, payload: dict) -> None:
        self.deliveries.append({"recipient_id": recipient_id, "event_type": event_type, "payload": payload})


class MockAIAdapter:
    async def generate_insight(self, question: str, context: dict) -> str:
        severity = context.get("latest_checkin_severity", "normal")
        return f"Mock care insight: review the parent update ({severity}) and follow the assigned care plan."
