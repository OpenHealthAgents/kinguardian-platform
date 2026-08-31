import { Medication } from '../types';
import { delay } from './FamilyService';

export interface MedicationService {
  getMedications(personId: string): Promise<Medication[]>;
  markTaken(medicationId: string, status: 'taken' | 'upcoming' | 'missed'): Promise<Medication>;
  sendReminder(medicationId: string): Promise<void>;
}

export class MockMedicationService implements MedicationService {
  private meds: Medication[] = [
    {
      id: 'rec-1',
      personId: 'dad',
      name: 'Amlodipine',
      dose: '5mg',
      frequency: 'Once Daily (Morning)',
      scheduledTime: '8:00 AM',
      status: 'taken',
      adherencePercent: 96,
      prescriber: 'Dr. Sharma (Cardiology)'
    },
    {
      id: 'rec-2',
      personId: 'mom',
      name: 'Metformin ER',
      dose: '500mg',
      frequency: 'Twice Daily (Morning/Night)',
      scheduledTime: '9:00 AM',
      status: 'taken',
      adherencePercent: 98,
      prescriber: 'Dr. Nair (Endocrinology)'
    },
    {
      id: 'rec-5',
      personId: 'dad',
      name: 'Atorvastatin',
      dose: '20mg',
      frequency: 'Once Daily (Night)',
      scheduledTime: '8:00 PM',
      status: 'upcoming',
      adherencePercent: 92,
      prescriber: 'Dr. Sharma (Cardiology)'
    }
  ];

  async getMedications(personId: string): Promise<Medication[]> {
    await delay();
    return this.meds.filter((m) => m.personId === personId);
  }

  async markTaken(
    medicationId: string,
    status: 'taken' | 'upcoming' | 'missed'
  ): Promise<Medication> {
    await delay();
    const idx = this.meds.findIndex((m) => m.id === medicationId);
    if (idx === -1) throw new Error('Medication not found');

    const updated: Medication = {
      ...this.meds[idx],
      status
    };
    this.meds[idx] = updated;
    return updated;
  }

  async sendReminder(_medicationId: string): Promise<void> {
    await delay();
    // Simulated notification side-effect
  }
}
