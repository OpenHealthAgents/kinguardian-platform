import { HealthEvent } from '../types';
import { INITIAL_HEALTH_RECORDS } from '../data/mockData';
import { delay } from './FamilyService';

export interface HealthEventService {
  getHealthEvents(personId: string): Promise<HealthEvent[]>;
  logVitalEvent(
    personId: string,
    vital: { systolic?: number; diastolic?: number; glucose?: number; note?: string }
  ): Promise<HealthEvent>;
}

export class MockHealthEventService implements HealthEventService {
  private events = [...INITIAL_HEALTH_RECORDS];

  async getHealthEvents(personId: string): Promise<HealthEvent[]> {
    await delay();
    return this.events.filter((e) => e.personId === personId);
  }

  async logVitalEvent(
    personId: string,
    vital: { systolic?: number; diastolic?: number; glucose?: number; note?: string }
  ): Promise<HealthEvent> {
    await delay();

    let title = 'Fasting Glucose Logged';
    let subtitle = `${vital.glucose} mg/dL • Manual Ingestion`;

    if (vital.systolic && vital.diastolic) {
      title = 'Manual BP Logged';
      subtitle = `${vital.systolic}/${vital.diastolic} mmHg • Manual Ingestion`;
    }

    const newEvent: HealthEvent = {
      id: `rec-manual-${Date.now()}`,
      personId,
      type: 'vital',
      title,
      subtitle,
      description: vital.note,
      occurredAt: new Date().toISOString(),
      date: 'Just now',
      source: 'coordinator',
      severity: 'normal',
      category: 'vitals',
      details: vital.note || 'Logged via KinGuardian companion portal.'
    };

    this.events.unshift(newEvent);
    return newEvent;
  }
}
