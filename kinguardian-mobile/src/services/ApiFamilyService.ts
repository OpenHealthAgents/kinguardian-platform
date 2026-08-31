import { FamilyMember } from '../types';
import { INITIAL_PEOPLE } from '../data/mockData';
import { DrGodlyApiClient } from './api-client/client';
import { CONFIG } from '../constants/config';

export const DEFAULT_FAMILY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const RAMESH_SUBJECT_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const LAKSHMI_SUBJECT_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

export interface AddParentPayload {
  name: string;
  relationship?: string;
  city?: string;
  countryCode?: string;
  timezone?: string;
  age?: number;
  phone?: string;
}

export class ApiFamilyService {
  private client: DrGodlyApiClient;
  public familyId: string;
  private localMembers: FamilyMember[] = [...INITIAL_PEOPLE];

  constructor(baseUrl: string = CONFIG.apiUrl, familyId: string = DEFAULT_FAMILY_ID) {
    this.client = new DrGodlyApiClient({ baseUrl });
    this.familyId = familyId;
  }

  async getFamilyMembers(): Promise<FamilyMember[]> {
    try {
      const homeData = await this.client.families.getHome(this.familyId);
      if (homeData && homeData.subjects && Array.isArray(homeData.subjects)) {
        // Map backend subjects into frontend FamilyMember format
        const backendMembers: FamilyMember[] = homeData.subjects.map((s: any, idx: number) => {
          const isDad = s.display_name?.toLowerCase().includes('father') || s.relationship?.toLowerCase() === 'father' || idx === 0;
          const matchedInitial = this.localMembers.find(
            (m) => m.id === (isDad ? 'dad' : 'mom') || m.name.toLowerCase() === s.display_name?.toLowerCase()
          );

          return {
            id: s.subject_id || (isDad ? 'dad' : 'mom'),
            backendSubjectId: s.subject_id,
            name: matchedInitial?.name || s.display_name || (isDad ? 'Ramesh' : 'Lakshmi'),
            relation: s.relationship ? s.relationship.charAt(0).toUpperCase() + s.relationship.slice(1) : (isDad ? 'Father' : 'Mother'),
            age: matchedInitial?.age || (isDad ? 68 : 64),
            location: `${s.city || 'Chennai'}, India`,
            avatarUrl: matchedInitial?.avatarUrl || (isDad ? INITIAL_PEOPLE[0].avatarUrl : INITIAL_PEOPLE[1].avatarUrl),
            wellbeingStatus: s.latest_feeling === 'unwell' || s.latest_feeling === 'critical' ? 'attention' : 'doing-well',
            currentStatus: s.vital_summary?.blood_pressure ? `BP: ${s.vital_summary.blood_pressure}` : 'Doing well • Vitals stable',
            lastCheckIn: 'Recently'
          };
        });

        if (backendMembers.length > 0) {
          this.localMembers = backendMembers;
          return backendMembers;
        }
      }
    } catch (err) {
      console.warn('ApiFamilyService: Failed to fetch from backend, using local state:', err);
    }
    return this.localMembers;
  }

  async addParent(payload: AddParentPayload): Promise<FamilyMember> {
    const isDad = payload.relationship?.toLowerCase().includes('father') || payload.relationship?.toLowerCase().includes('dad');
    const relationName = payload.relationship || (isDad ? 'Father' : 'Mother');
    const fhirId = `synthetic-pat-${Date.now().toString(36)}`;

    let createdSubject: any = null;
    try {
      createdSubject = await this.client.subjects.create(this.familyId, {
        fhir_patient_id: fhirId,
        relationship_to_coordinator: relationName.toLowerCase(),
        city: payload.city || 'Chennai',
        country_code: payload.countryCode || 'IN',
        timezone: payload.timezone || 'Asia/Kolkata'
      });
      console.log('ApiFamilyService: Successfully persisted parent to database:', createdSubject);
    } catch (err) {
      console.warn('ApiFamilyService: Error persisting parent to backend DB, updating local state:', err);
    }

    const newMember: FamilyMember = {
      id: createdSubject?.id || `parent-${Date.now()}`,
      backendSubjectId: createdSubject?.id,
      name: payload.name,
      relation: relationName,
      age: payload.age || 65,
      location: `${payload.city || 'Chennai'}, India`,
      avatarUrl: isDad ? INITIAL_PEOPLE[0].avatarUrl : INITIAL_PEOPLE[1].avatarUrl,
      wellbeingStatus: 'doing-well',
      currentStatus: 'Doing well • Vitals stable',
      lastCheckIn: 'Just added'
    };

    this.localMembers.push(newMember);
    return newMember;
  }

  async updateCheckIn(personId: string, status: 'Good' | 'Tired' | 'Unwell'): Promise<FamilyMember> {
    // Map person ID to database CareSubject UUID
    let subjectUuid = personId;
    if (personId === 'dad' || personId.toLowerCase().includes('ramesh')) {
      subjectUuid = RAMESH_SUBJECT_ID;
    } else if (personId === 'mom' || personId.toLowerCase().includes('lakshmi')) {
      subjectUuid = LAKSHMI_SUBJECT_ID;
    }

    const feelingMapping: Record<string, 'great' | 'good' | 'neutral' | 'unwell' | 'critical'> = {
      'Good': 'good',
      'Tired': 'neutral',
      'Unwell': 'unwell'
    };

    try {
      await this.client.checkins.submit({
        family_id: this.familyId,
        subject_id: subjectUuid,
        feeling: feelingMapping[status] || 'good',
        notes: `Logged ${status} check-in via mobile application.`
      });
      console.log(`ApiFamilyService: Persisted check-in (${status}) for subject ${subjectUuid}`);
    } catch (err) {
      console.warn('ApiFamilyService: Error submitting check-in to backend:', err);
    }

    const idx = this.localMembers.findIndex((m) => m.id === personId || m.backendSubjectId === personId);
    if (idx !== -1) {
      const updated: FamilyMember = {
        ...this.localMembers[idx],
        wellbeingStatus: status === 'Good' ? 'doing-well' : 'attention',
        currentStatus: `Logged check-in: feeling ${status}`,
        lastCheckIn: 'Just now'
      };
      this.localMembers[idx] = updated;
      return updated;
    }

    return {
      id: personId,
      name: 'Parent',
      relation: 'Parent',
      age: 65,
      location: 'Chennai, India',
      avatarUrl: INITIAL_PEOPLE[0].avatarUrl,
      wellbeingStatus: status === 'Good' ? 'doing-well' : 'attention',
      currentStatus: `Logged check-in: feeling ${status}`,
      lastCheckIn: 'Just now'
    };
  }
}
