/**
 * @file AIService.ts
 * @description KinGuardian Mobile AI Service Interface and Mock Implementation.
 * 
 * ARCHITECTURAL PRINCIPLES:
 * 1. Persona Alignment: Provides calibrated, empathetic answers suitable for long-distance coordinators
 *    and local elderly parents without triggering unwarranted anxiety.
 * 2. Source Provenance: Every response is paired with explicit citations to primary clinical records,
 *    wearable streams, or environmental indices.
 * 3. Offline Resilience: Mock service simulates production bezs-agent responses with deterministic delays.
 */

import { AIInsight } from '../types';

/**
 * Standard structured response payload returned by KinGuardian AI.
 */
export interface AIResponse {
  /** Natural language response formulated by the AI reasoning agent */
  answer: string;
  /** Primary record citations and device attributions providing evidence */
  citations: string[];
}

/**
 * Structured doctor visit preparation package synthesized by AI.
 */
export interface AppointmentPreparation {
  appointmentId: string;
  preparations: string[];
  questionsToAsk: string[];
}

/**
 * Key extraction summary for uploaded clinical lab reports or discharge summaries.
 */
export interface DocumentSummary {
  documentId: string;
  summaryText: string;
  extractedMetrics: { key: string; value: string }[];
}

/**
 * Core AI Service Port defining all intelligent concierge interactions.
 */
export interface AIService {
  /** Answers natural language queries regarding family health patterns */
  ask(question: string, personIds: string[]): Promise<AIResponse>;
  /** Generates proactive Guardian Moment insights based on cross-border data */
  generateInsight(personId: string): Promise<AIInsight>;
  /** Formulates doctor questions and preparation checklists */
  prepareAppointment(appointmentId: string): Promise<AppointmentPreparation>;
  /** Extracts structured lab metrics from scanned health records */
  summarizeDocument(documentId: string): Promise<DocumentSummary>;
}

/**
 * Deterministic Mock AI Service implementation for development, testing, and offline execution.
 */
export class MockAIService implements AIService {
  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 800));
  }


  async ask(question: string, _personIds: string[]): Promise<AIResponse> {
    await this.delay();
    const qLower = question.toLowerCase();

    if (qLower.includes('blood pressure') || qLower.includes('bp')) {
      return {
        answer:
          "I noticed Dad's evening blood pressure shows a slight systolic variance (138/88 mmHg). The data shows this is different from Dad's usual pattern. This correlates with the current Chennai midday heatwave index (39°C). You may want to discuss this with his doctor.",
        citations: ['Omron Blood Pressure Hub (12 readings)', 'Chennai Meteorological Index']
      };
    }

    if (qLower.includes('medication') || qLower.includes('pill') || qLower.includes('medicine')) {
      return {
        answer:
          "I noticed Dad's medication compliance is at 92%. Amlodipine 5mg was taken at 8:15 AM. Atorvastatin 20mg is scheduled for 8:00 PM. The data shows this is consistent with his usual pattern.",
        citations: ['Caregiver Priya Manual Logs', 'Pillbox Sync Sensor']
      };
    }

    if (qLower.includes('appointment') || qLower.includes('doctor') || qLower.includes('visit')) {
      return {
        answer:
          'I noticed Dad has an upcoming Cardiology Consultation with Dr. Sharma at Apollo Hospital Chennai scheduled for tomorrow at 4:00 PM IST.',
        citations: ['Apollo Hospital Portal Integration']
      };
    }

    return {
      answer:
        "I noticed Ramesh's and Lakshmi's active health metrics: all medications are confirmed, and steps are recovering. The data shows no critical anomalies are detected in active sensor loops. You may want to discuss any changes with their doctor.",
      citations: ['Apple Health Step Logs', 'Dexcom Glycemic CGM Stream']
    };
  }

  async generateInsight(personId: string): Promise<AIInsight> {
    await this.delay();
    return {
      id: `ins-${Date.now()}`,
      personId,
      title: 'Veranda Step Activity Decrease',
      summary:
        "I noticed Ramesh's daily steps decreased by 35% over the last five days. The data shows this is different from Dad's usual pattern, highly correlated with Chennai heat levels.",
      type: 'observation',
      severity: 'attention',
      timeframe: 'Past 5 days',
      sources: ['Apple Watch Sync']
    };
  }

  async prepareAppointment(appointmentId: string): Promise<AppointmentPreparation> {
    await this.delay();
    return {
      appointmentId,
      preparations: [
        'Print or share the recent Apollo Hospital Chennai Cardiac Metabolic Panel summary.',
        'Record Ramesh sir fasting blood pressure logs for 3 consecutive days prior to appointment.',
        'Keep Amlodipine and Atorvastatin pill packets handy during telehealth video review.'
      ],
      questionsToAsk: [
        'Should we adjust Dad’s afternoon diuretic timing on days when Chennai heat peaks above 38°C?',
        'Does the recent 35% steps activity decline correlate with his evening blood pressure spikes?'
      ]
    };
  }

  async summarizeDocument(documentId: string): Promise<DocumentSummary> {
    await this.delay();
    return {
      documentId,
      summaryText:
        "I noticed 6 key metabolic lab results from Metropolis Labs Chennai. The data shows glucose is optimal, but creatinine has a slight elevation from Ramesh sir's usual baseline. You may want to discuss this with his doctor.",
      extractedMetrics: [
        { key: 'HbA1c', value: '6.4%' },
        { key: 'eGFR', value: '78 mL/min' },
        { key: 'Creatinine', value: '1.1 mg/dL' },
        { key: 'Fasting Glucose', value: '98 mg/dL' },
        { key: 'LDL Cholesterol', value: '104 mg/dL' },
        { key: 'Potassium', value: '4.4 mmol/L' }
      ]
    };
  }
}
