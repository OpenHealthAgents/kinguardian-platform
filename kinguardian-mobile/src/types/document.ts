export interface HealthDocument {
  id: string;
  name: string;
  status: 'processing' | 'ready' | 'error' | 'parsed';

  personId?: string;
  type?: 'prescription' | 'lab' | 'scan' | 'discharge-summary' | 'bill' | 'other';
  uploadedAt?: string;
  uploadedBy?: string;

  // Compatibility properties for vault UI
  category?: string;
  date?: string;
  uploader?: string;
  summary?: string;
  findings?: string[];
  recommendations?: string[];
  fileSize?: string;
}
