import { HealthDocument } from '../types';
import { INITIAL_DOCUMENTS } from '../data/mockData';
import { delay } from './FamilyService';

export interface DocumentService {
  getDocuments(personId: string): Promise<HealthDocument[]>;
  uploadDocument(newDoc: HealthDocument): Promise<HealthDocument>;
}

export class MockDocumentService implements DocumentService {
  private docs: HealthDocument[] = [...INITIAL_DOCUMENTS];

  async getDocuments(personId: string): Promise<HealthDocument[]> {
    await delay();
    return this.docs.filter((d) => d.personId === personId || !d.personId);
  }

  async uploadDocument(newDoc: HealthDocument): Promise<HealthDocument> {
    await delay();
    const uploaded: HealthDocument = {
      ...newDoc,
      status: 'parsed',
      uploadedAt: new Date().toISOString()
    };
    this.docs.unshift(uploaded);
    return uploaded;
  }
}
