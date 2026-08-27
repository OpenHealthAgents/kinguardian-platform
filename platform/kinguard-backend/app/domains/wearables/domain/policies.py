"""
Wearable Domain Policies Module.
Encapsulates domain rules for baseline deviation detection, multi-metric correlation,
and consent-gated access policies.
"""

from typing import List, Optional
import uuid

from app.domains.wearables.domain.value_objects import (
    ActivityMetrics,
    SleepArchitecture,
    RecoveryVitals,
    AnomalySeverity,
    AnomalyThreshold
)
from app.domains.wearables.domain.entities import (
    WearableAnomalyDiagnostic,
    WearableDailySummary
)


class ActivityAnomalyPolicy:
    """
    Evaluates whether a care subject's daily physical activity has plummeted
    significantly below their rolling historical baseline (e.g. Ramesh in Chennai).
    """

    @classmethod
    def evaluate(
        cls,
        subject_id: uuid.UUID,
        current_activity: ActivityMetrics,
        baseline_steps: int,
        threshold: AnomalyThreshold = AnomalyThreshold()
    ) -> Optional[WearableAnomalyDiagnostic]:
        if baseline_steps <= 0:
            return None

        # Check percentage drop
        if current_activity.steps < baseline_steps:
            drop_pct = ((baseline_steps - current_activity.steps) / float(baseline_steps)) * 100.0
            if drop_pct >= threshold.activity_drop_percentage:
                severity = AnomalySeverity.WARNING if drop_pct >= 60.0 else AnomalySeverity.ATTENTION
                return WearableAnomalyDiagnostic(
                    id=uuid.uuid4(),
                    subject_id=subject_id,
                    metric_name="daily_steps",
                    observed_value=float(current_activity.steps),
                    baseline_value=float(baseline_steps),
                    percentage_deviation=drop_pct,
                    severity=severity,
                    description=(
                        f"Daily step count ({current_activity.steps:,}) dropped by {drop_pct:.0f}% "
                        f"compared to the baseline of {baseline_steps:,} steps."
                    )
                )
        return None


class SleepDisruptionPolicy:
    """
    Evaluates whether sleep quality or duration has dropped into an alertable zone.
    """

    @classmethod
    def evaluate(
        cls,
        subject_id: uuid.UUID,
        current_sleep: SleepArchitecture,
        baseline_sleep_hours: float = 7.0,
        threshold: AnomalyThreshold = AnomalyThreshold()
    ) -> Optional[WearableAnomalyDiagnostic]:
        observed_hours = current_sleep.total_sleep_hours
        if baseline_sleep_hours <= 0.0:
            return None

        if observed_hours < baseline_sleep_hours:
            drop_pct = ((baseline_sleep_hours - observed_hours) / baseline_sleep_hours) * 100.0
            if drop_pct >= threshold.sleep_drop_percentage or current_sleep.is_deprived:
                severity = AnomalySeverity.WARNING if observed_hours < 4.0 else AnomalySeverity.ATTENTION
                return WearableAnomalyDiagnostic(
                    id=uuid.uuid4(),
                    subject_id=subject_id,
                    metric_name="sleep_duration_hours",
                    observed_value=observed_hours,
                    baseline_value=baseline_sleep_hours,
                    percentage_deviation=drop_pct,
                    severity=severity,
                    description=(
                        f"Nocturnal sleep duration ({observed_hours:.1f} hrs) dropped by {drop_pct:.0f}% "
                        f"below baseline ({baseline_sleep_hours:.1f} hrs)."
                    )
                )
        return None


class AutonomicRecoveryPolicy:
    """
    Evaluates autonomic stress / cardiovascular recovery indicators (elevated resting HR, depressed HRV).
    """

    @classmethod
    def evaluate(
        cls,
        subject_id: uuid.UUID,
        current_recovery: RecoveryVitals,
        baseline_resting_hr: int = 65,
        threshold: AnomalyThreshold = AnomalyThreshold()
    ) -> Optional[WearableAnomalyDiagnostic]:
        if current_recovery.resting_heart_rate_bpm is not None and baseline_resting_hr > 0:
            elevation = current_recovery.resting_heart_rate_bpm - baseline_resting_hr
            if elevation >= threshold.resting_hr_elevation_bpm:
                return WearableAnomalyDiagnostic(
                    id=uuid.uuid4(),
                    subject_id=subject_id,
                    metric_name="resting_heart_rate_bpm",
                    observed_value=float(current_recovery.resting_heart_rate_bpm),
                    baseline_value=float(baseline_resting_hr),
                    percentage_deviation=(elevation / float(baseline_resting_hr)) * 100.0,
                    severity=AnomalySeverity.WARNING,
                    description=(
                        f"Resting heart rate elevated by +{elevation} bpm "
                        f"({current_recovery.resting_heart_rate_bpm} bpm vs baseline {baseline_resting_hr} bpm)."
                    )
                )

        # SpO2 hypoxia check
        if current_recovery.is_hypoxemic and current_recovery.spo2_percentage is not None:
            return WearableAnomalyDiagnostic(
                id=uuid.uuid4(),
                subject_id=subject_id,
                metric_name="spo2_percentage",
                observed_value=current_recovery.spo2_percentage,
                baseline_value=98.0,
                percentage_deviation=98.0 - current_recovery.spo2_percentage,
                severity=AnomalySeverity.CRITICAL,
                description=f"Nocturnal blood oxygen saturation dropped to {current_recovery.spo2_percentage:.1f}% (desaturation warning)."
            )

        return None
