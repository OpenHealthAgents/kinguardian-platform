import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { AppContext } from './AppContext';
import {
  ActiveTab,
  ScreenView,
  HealthObservation,
  HealthRecordItem,
  Person,
  AppNotification,
  DocumentItem,
  SyncLog,
  ChatMessage,
  DemoUser,
  Medication,
  Appointment,
  HealthEvent,
  HealthDocument,
  CareTask,
  AIInsight
} from '../types';
import {
  INITIAL_PEOPLE,
  INITIAL_OBSERVATIONS,
  INITIAL_HEALTH_RECORDS,
  INITIAL_RECENT_SEARCHES,
  INITIAL_NOTIFICATIONS,
  INITIAL_DOCUMENTS,
  INITIAL_SYNC_LOGS
} from '../data/mockData';
import {
  ApiFamilyService,
  MockMedicationService,
  MockHealthEventService,
  MockDocumentService
} from '../services';

const familyService = new ApiFamilyService();
const medicationService = new MockMedicationService();
const healthEventService = new MockHealthEventService();
const documentService = new MockDocumentService();

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'anjali',
    name: 'Anjali',
    age: 36,
    location: 'London, UK',
    role: 'coordinator',
    relation: 'Coordinator',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBjb58pDYmLPOvRb2C93qIwVmN3Z3qZ__ljM1T9ZSdVoVI9ovH8x3UkvVX2km1jcc-lJDB8XKVXGhKX0bZL8qDi2s9jgC8eOKs1TubpaykQObp6xTg11e7t9fDFBiO9G_knt_Iu91RQ6oYuQGrd_EwUBKvQprl0XXO1mrgZ2LripRVXQ9ztlZOQr21ScUbgnP5iva9lVWOYFTQ4E6180FpDmnFn1lhIDcG8awhKsT88RjoTEgkPxtmV'
  },
  {
    id: 'ramesh',
    name: 'Ramesh',
    age: 68,
    location: 'Chennai, India',
    role: 'parent',
    relation: 'Father',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuALvS8om7n8gN1nN9dwPrBv-8lUIiusfbDJ_24xukhktin6SS4Fum03pBDjOv6QZq7FG1zrXkOAvuYXPyd3bNWRiExOfo8jITls7X2v_F_ae2gOUZWhU50WGJItnoRtI9opmF1QBZU6bzSEV02qftPpb92imjH5svG7X7JsNrBwsRS4KyeFQ20zUd6kbGNULu6DnWuaKXcPSFfVBT19aNcq-tWb94VlGR9d-nSgRSdV7ns615jW5_9B'
  },
  {
    id: 'lakshmi',
    name: 'Lakshmi',
    age: 64,
    location: 'Chennai, India',
    role: 'parent',
    relation: 'Mother',
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256'
  }
];

const DEFAULT_MEDICATIONS: Medication[] = [
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

const DEFAULT_CARE_TASKS: CareTask[] = [
  {
    id: 'task-1',
    personId: 'dad',
    title: 'Verify afternoon hydration',
    status: 'completed',
    dueAt: 'Today, 2:00 PM',
    priority: 'high',
    assignedTo: 'Suresh Kumar'
  },
  {
    id: 'task-2',
    personId: 'dad',
    title: 'Walk path verification inside house',
    status: 'pending',
    dueAt: 'Today, 5:30 PM',
    priority: 'medium',
    assignedTo: 'Suresh Kumar'
  }
];

const DEFAULT_AI_INSIGHTS: AIInsight[] = [
  {
    id: 'ins-1',
    personId: 'dad',
    title: 'Midday Step Decreased by 35%',
    summary:
      'Ramesh daily physical activity decreased today. High correlation with local heat levels (39°C).',
    type: 'observation',
    severity: 'attention',
    timeframe: 'Today',
    sources: ['Apple Health']
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<DemoUser>(DEMO_USERS[0]);
  const [consentApproved, setConsentApproved] = useState<boolean>(true);
  const [currentScenario, setCurrentScenario] = useState<
    | 'normal'
    | 'medication-missed'
    | 'guardian-moment'
    | 'new-lab-report'
    | 'upcoming-appointment'
    | 'parent-feeling-unwell'
  >('normal');

  const switchDemoUser = (userId: string) => {
    const user = DEMO_USERS.find((u) => u.id === userId);
    if (!user) return;

    setCurrentUser(user);
    setAppMode(user.role);

    if (user.role === 'coordinator') {
      setCurrentScreen('health_dashboard');
      setActiveTab('home');
    } else {
      setCurrentPersonId(user.id === 'ramesh' ? 'dad' : 'mom');
      setCurrentScreen('parent_dashboard');
    }

    showToast(`Persona changed to: ${user.name} (${user.location})`);
  };
  // Navigation & Screen Management
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('onboarding');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [appMode, setAppMode] = useState<'coordinator' | 'parent'>('coordinator');

  // Data States
  const [people, setPeople] = useState<Person[]>(INITIAL_PEOPLE);
  const [currentPersonId, setCurrentPersonId] = useState<string>('dad');
  const [observations, setObservations] =
    useState<Record<string, HealthObservation>>(INITIAL_OBSERVATIONS);
  const [records, setRecords] = useState<HealthRecordItem[]>(INITIAL_HEALTH_RECORDS);
  const [recentSearches, setRecentSearches] = useState<string[]>(INITIAL_RECENT_SEARCHES);

  // Interactive prototype states
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(INITIAL_SYNC_LOGS);

  // Real-time Vitals Telemetry States
  const [currentBP, setCurrentBP] = useState('138/88 mmHg');
  const [currentGlucose, setCurrentGlucose] = useState('98');
  const [isSyncing, setIsSyncing] = useState(false);

  // Overlays
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [askAIOpen, setAskAIOpen] = useState(false);
  const [askAIQuery, setAskAIQuery] = useState<string>('');
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentLoopStep, setCurrentLoopStep] = useState(0);

  // Vital readings history stores
  const [bpHistory, setBpHistory] = useState<any[]>([
    { date: 'Today', time: '8:45 PM', systolic: 138, diastolic: 88, source: 'Omron Monitor' },
    { date: 'Aug 16', time: '8:30 PM', systolic: 136, diastolic: 86, source: 'Omron Monitor' },
    { date: 'Aug 15', time: '9:10 PM', systolic: 140, diastolic: 90, source: 'Apple Health' },
    { date: 'Aug 14', time: '8:15 PM', systolic: 134, diastolic: 84, source: 'Omron Monitor' }
  ]);

  const [glucoseHistory, setGlucoseHistory] = useState<any[]>([
    { date: 'Today', time: '8:00 AM', glucose: 98, source: 'Dexcom G7 CGM' },
    { date: 'Yesterday', time: '8:15 AM', glucose: 102, source: 'Dexcom G7 CGM' },
    { date: 'Aug 15', time: '8:00 AM', glucose: 94, source: 'Dexcom G7 CGM' },
    { date: 'Aug 14', time: '8:30 AM', glucose: 96, source: 'Dexcom G7 CGM' }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'user',
      senderName: 'Anjali (You)',
      senderAvatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBjb58pDYmLPOvRb2C93qIwVmN3Z3qZ__ljM1T9ZSdVoVI9ovH8x3UkvVX2km1jcc-lJDB8XKVXGhKX0bZL8qDi2s9jgC8eOKs1TubpaykQObp6xTg11e7t9fDFBiO9G_knt_Iu91RQ6oYuQGrd_EwUBKvQprl0XXO1mrgZ2LripRVXQ9ztlZOQr21ScUbgnP5iva9lVWOYFTQ4E6180FpDmnFn1lhIDcG8awhKsT88RjoTEgkPxtmV',
      text: "Hey everyone, KinGuardian noticed Dad's steps are down 35% over the past 5 days in Chennai and evening BP spiked to 138/88 mmHg. Suresh, has Dad been taking his afternoon walks on the veranda?",
      timestamp: '3:15 PM IST (9:45 AM BST)'
    },
    {
      id: '2',
      sender: 'family',
      senderName: 'Suresh Kumar (Caregiver)',
      senderAvatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
      text: 'Hello Anjali! Yes, Chennai weather is very hot (39°C) this week. I advised Ramesh sir to stay indoors in the AC and do light walking inside instead. I will check his hydration and log a manual BP reading this evening.',
      timestamp: '3:22 PM IST (9:52 AM BST)'
    },
    {
      id: '3',
      sender: 'family',
      senderName: 'Dad (Ramesh)',
      senderAvatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuALvS8om7n8gN1nN9dwPrBv-8lUIiusfbDJ_24xukhktin6SS4Fum03pBDjOv6QZq7FG1zrXkOAvuYXPyd3bNWRiExOfo8jITls7X2v_F_ae2gOUZWhU50WGJItnoRtI9opmF1QBZU6bzSEV02qftPpb92imjH5svG7X7JsNrBwsRS4KyeFQ20zUd6kbGNULu6DnWuaKXcPSFfVBT19aNcq-tWb94VlGR9d-nSgRSdV7ns615jW5_9B',
      text: 'I am feeling quite fine, Anjali! Staying indoors and drinking buttermilk Suresh made. Just took my morning Amlodipine.',
      timestamp: '3:30 PM IST (10:00 AM BST)'
    }
  ]);

  const [medications, setMedications] = useState<Medication[]>(DEFAULT_MEDICATIONS);

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 'appt-1',
      personId: 'dad',
      doctorName: 'Dr. Sharma',
      specialty: 'Cardiology',
      date: 'Tomorrow',
      time: '10:30 AM',
      location: 'Apollo Cardiology Center, Chennai',
      status: 'upcoming'
    },
    {
      id: 'appt-2',
      personId: 'mom',
      doctorName: 'Dr. Nair',
      specialty: 'Endocrinology',
      date: 'Next Monday',
      time: '4:00 PM',
      location: 'Apollo Metabolic Clinic, Adyar, Chennai',
      status: 'upcoming'
    }
  ]);

  const [careTasks, setCareTasks] = useState<CareTask[]>(DEFAULT_CARE_TASKS);

  const [aiInsights, setAiInsights] = useState<AIInsight[]>(DEFAULT_AI_INSIGHTS);

  // Load state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const storedScenario = await AsyncStorage.getItem('kinguardian_scenario');
        if (storedScenario) setCurrentScenario(storedScenario as any);

        const storedBP = await AsyncStorage.getItem('kinguardian_bp');
        if (storedBP) setCurrentBP(storedBP);

        const storedPeople = await AsyncStorage.getItem('kinguardian_people');
        if (storedPeople) setPeople(JSON.parse(storedPeople));

        const storedMeds = await AsyncStorage.getItem('kinguardian_medications');
        if (storedMeds) setMedications(JSON.parse(storedMeds));

        const storedNotifs = await AsyncStorage.getItem('kinguardian_notifications');
        if (storedNotifs) setNotifications(JSON.parse(storedNotifs));

        const storedTasks = await AsyncStorage.getItem('kinguardian_tasks');
        if (storedTasks) setCareTasks(JSON.parse(storedTasks));

        const storedRecords = await AsyncStorage.getItem('kinguardian_records');
        if (storedRecords) setRecords(JSON.parse(storedRecords));

        // Sync live subjects from database if available
        try {
          const liveMembers = await familyService.getFamilyMembers();
          if (liveMembers && liveMembers.length > 0) {
            setPeople(liveMembers);
          }
        } catch (apiErr) {
          console.warn('Could not sync live family members on mount:', apiErr);
        }
      } catch (err) {
        console.warn('Failed to load persisted offline state:', err);
      }
    };
    loadState();
  }, []);

  // Save state on changes
  useEffect(() => {
    const saveState = async () => {
      try {
        await AsyncStorage.setItem('kinguardian_scenario', currentScenario);
        await AsyncStorage.setItem('kinguardian_bp', currentBP);
        await AsyncStorage.setItem('kinguardian_people', JSON.stringify(people));
        await AsyncStorage.setItem('kinguardian_medications', JSON.stringify(medications));
        await AsyncStorage.setItem('kinguardian_notifications', JSON.stringify(notifications));
        await AsyncStorage.setItem('kinguardian_tasks', JSON.stringify(careTasks));
        await AsyncStorage.setItem('kinguardian_records', JSON.stringify(records));
      } catch (err) {
        console.warn('Failed to save offline state:', err);
      }
    };
    saveState();
  }, [currentScenario, currentBP, people, medications, notifications, careTasks, records]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  async function runWithSyncLoader<T>(callback: () => Promise<T>): Promise<T> {
    setIsSyncing(true);
    try {
      return await callback();
    } finally {
      setIsSyncing(false);
    }
  }

  const handleManualBPLog = async (vital: {
    systolic: number;
    diastolic: number;
    note: string;
  }) => {
    await runWithSyncLoader(async () => {
      const loggedEvent = await healthEventService.logVitalEvent('dad', {
        systolic: vital.systolic,
        diastolic: vital.diastolic,
        note: vital.note
      });
      setCurrentBP(`${vital.systolic}/${vital.diastolic} mmHg`);
      const newLog = {
        date: 'Today',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        systolic: vital.systolic,
        diastolic: vital.diastolic,
        source: 'Manual Log (Anjali)',
        note: vital.note
      };
      setBpHistory((prev) => [newLog, ...prev]);
      setRecords((prev) => [loggedEvent, ...prev]);
      showToast(`Logged BP ${vital.systolic}/${vital.diastolic} on behalf of Dad.`);
    });
  };

  const handleManualGlucoseLog = async (val: number, note: string) => {
    await runWithSyncLoader(async () => {
      const loggedEvent = await healthEventService.logVitalEvent('mom', {
        glucose: val,
        note
      });
      setCurrentGlucose(val.toString());
      const newLog = {
        date: 'Today',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        glucose: val,
        source: 'Manual Log (Anjali)',
        note
      };
      setGlucoseHistory((prev) => [newLog, ...prev]);
      setRecords((prev) => [loggedEvent, ...prev]);
      showToast(`Logged fasting sugar ${val} mg/dL on behalf of Mom.`);
    });
  };

  const handleConfirmMedication = async (id: string, name: string, taken: boolean) => {
    await runWithSyncLoader(async () => {
      await medicationService.markTaken(id, taken ? 'taken' : 'upcoming');
      setRecords((prev) =>
        prev.map((rec) => {
          if (rec.id === id) {
            return {
              ...rec,
              status: taken ? '✓ Confirmed at 8:05 PM' : 'Active • Scheduled 8:00 PM IST'
            };
          }
          return rec;
        })
      );

      const newLog: SyncLog = {
        id: `slog-med-${Date.now()}`,
        time: '8:05 PM',
        device: 'Manual Checklist',
        status: 'synced',
        value: taken ? '✓ Confirmed at 8:05 PM' : `Unchecked: ${name}`,
        user: 'Ramesh (Dad)'
      };
      setSyncLogs((prev) => [newLog, ...prev]);

      if (taken) {
        const medNotif: AppNotification = {
          id: `sim-notif-med-${Date.now()}`,
          title: 'Medication Adherence Sync',
          message: "Dad's medication was confirmed.",
          type: 'sync',
          time: '8:05 PM',
          read: false
        };
        setNotifications((prev) => [medNotif, ...prev]);
      }

      showToast(taken ? `Confirmed ${name} taken!` : `Reset ${name} status.`);
    });
  };

  const handleParentCheckIn = async (status: 'Good' | 'Tired' | 'Unwell') => {
    await runWithSyncLoader(async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const updatedPerson = await familyService.updateCheckIn('dad', status);

      // Clear active check-in request notification
      setNotifications((prev) =>
        prev.map((n) =>
          n.recipient === 'parent' && n.category === 'kinguardian_request' ? { ...n, read: true } : n
        )
      );

      // If Dad says Good, clear the active guardian-moment scenario
      if (currentScenario === 'guardian-moment' && status === 'Good') {
        setCurrentScenario('normal');
        setCurrentBP('120/80 mmHg');
      }

      setPeople((prev) =>
        prev.map((p) => {
          if (p.id === 'dad') {
            return {
              ...updatedPerson,
              wellbeingStatus: status === 'Good' ? ('doing-well' as const) : ('attention' as const),
              currentStatus: status === 'Good' ? "I'm feeling okay." : `Feels ${status}`,
              lastCheckIn: 'Today'
            };
          }
          return p;
        })
      );

      const newLog: SyncLog = {
        id: `slog-checkin-${Date.now()}`,
        time: 'Just now',
        device: 'Wellbeing Sync',
        status: 'synced',
        value: `Check-in: Ramesh feels ${status}`,
        user: 'Ramesh (Dad)'
      };
      setSyncLogs((prev) => [newLog, ...prev]);

      let checkinNotif: AppNotification;
      if (status === 'Tired') {
        checkinNotif = {
          id: `sim-notif-check-${Date.now()}`,
          title: 'Care Alert: Ramesh (Dad)',
          message:
            'Dad logged feeling Tired 😴. Chennai weather is currently 39°C. Tap to message Suresh.',
          type: 'alert',
          time: 'Just now',
          read: false,
          actionScreen: 'chat_view'
        };
      } else if (status === 'Unwell') {
        checkinNotif = {
          id: `sim-notif-check-${Date.now()}`,
          title: 'Critical Care Warning: Dad Unwell',
          message: 'Ramesh logged feeling Unwell 🤒. Click to trigger emergency summary check.',
          type: 'alert',
          time: 'Just now',
          read: false,
          actionScreen: 'health_dashboard'
        };
      } else {
        checkinNotif = {
          id: `sim-notif-check-${Date.now()}`,
          title: 'Check-in Sync: Dad',
          message: 'Dad checked in: Feeling Good 😊. All active sync metrics normal.',
          type: 'info',
          time: 'Just now',
          read: false
        };
      }

      setNotifications((prev) => [checkinNotif, ...prev]);
      showToast(`Logged status: Feeling ${status}`);
    });
  };

  const addParent = async (payload: {
    name: string;
    relationship?: string;
    city?: string;
    countryCode?: string;
    timezone?: string;
    age?: number;
    phone?: string;
  }) => {
    await runWithSyncLoader(async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const newMember = await familyService.addParent(payload);
      setPeople((prev) => {
        const filtered = prev.filter(
          (p) => p.id !== newMember.id && (!newMember.backendSubjectId || p.backendSubjectId !== newMember.backendSubjectId)
        );
        return [...filtered, newMember];
      });
      showToast(`Connected ${payload.name} (${payload.relationship || 'Parent'}) successfully.`);
    });
  };

  const handleUploadDocument = async (newDoc: DocumentItem) => {
    await runWithSyncLoader(async () => {
      const uploadedDoc = await documentService.uploadDocument(newDoc);
      setDocuments((prev) => [uploadedDoc, ...prev]);

      const docRecord: HealthRecordItem = {
        id: `rec-doc-${Date.now()}`,
        category: 'documents',
        personId: 'dad',
        title: `OCR Snapshot Ingested: ${newDoc.name}`,
        subtitle: `${newDoc.uploader} • Description: ${newDoc.summary}`,
        date: 'Just now',
        status: 'Parsed',
        tag: 'Camera Ingest',
        icon: 'description',
        iconBgColor: 'bg-[#d9e3f6]',
        iconColor: 'text-[#464554]'
      };
      setRecords((prev) => [docRecord, ...prev]);

      const newLog: SyncLog = {
        id: `slog-doc-${Date.now()}`,
        time: 'Just now',
        device: 'Camera Ingestion',
        status: 'synced',
        value: `Document snapshot upload finalized: ${newDoc.name}`,
        user: 'Ramesh (Dad)'
      };
      setSyncLogs((prev) => [newLog, ...prev]);

      const docNotif: AppNotification = {
        id: `sim-notif-doc-${Date.now()}`,
        title: 'New Health Document Uploaded',
        message:
          'Dad (Ramesh) uploaded a new Cardiology paper snapshot. Click to read AI analysis.',
        type: 'info',
        time: 'Just now',
        read: false,
        actionScreen: 'search_records'
      };
      setNotifications((prev) => [docNotif, ...prev]);
      showToast('Document transmitted to London Vault!');
    });
  };

  const handleAddMedication = (med: { name: string; dosage: string; person: string }) => {
    const medRec: HealthRecordItem = {
      id: `med-${Date.now()}`,
      category: 'medications',
      personId: med.person.toLowerCase().includes('dad') ? 'dad' : 'mom',
      title: med.name,
      subtitle: `${med.dosage} • Prescribed medication`,
      date: 'Today',
      status: 'Active schedule',
      tag: med.person,
      icon: 'pill',
      iconBgColor: 'bg-[#86f2e4]/30',
      iconColor: 'text-[#006a61]'
    };
    setRecords((prev) => [medRec, ...prev]);
    showToast(`Added ${med.name} dosage schedule.`);
  };

  const handleAddAppointment = (appt: {
    specialty: string;
    doctor: string;
    date: string;
    time: string;
  }) => {
    const apptRec: HealthRecordItem = {
      id: `appt-${Date.now()}`,
      category: 'appointments',
      personId: currentPersonId,
      title: `${appt.specialty} Consultation`,
      subtitle: `${appt.doctor} • ${appt.date} at ${appt.time}`,
      date: appt.date,
      status: 'Scheduled',
      tag: currentPersonId === 'dad' ? 'Dad (Ramesh)' : 'Mom (Lakshmi)',
      icon: 'calendar',
      iconBgColor: 'bg-rose-50',
      iconColor: 'text-[#ff3b30]'
    };
    setRecords((prev) => [apptRec, ...prev]);

    const newAppt: Appointment = {
      id: `appt-new-${Date.now()}`,
      personId: currentPersonId,
      doctorName: appt.doctor,
      specialty: appt.specialty,
      date: appt.date,
      time: appt.time,
      location: 'Apollo Clinic, Chennai',
      status: 'upcoming'
    };
    setAppointments((prev) => [newAppt, ...prev]);
    showToast(`Scheduled ${appt.specialty} appointment with ${appt.doctor}.`);
  };

  const handleAddContextNote = (note: string) => {
    const noteRec: HealthRecordItem = {
      id: `symptom-${Date.now()}`,
      category: 'symptoms',
      personId: currentPersonId,
      title: 'Proxy caregiver log',
      subtitle: note,
      date: 'Just now',
      status: 'Shared',
      tag: currentPersonId === 'dad' ? 'Dad' : 'Mom',
      icon: 'add_comment',
      iconBgColor: 'bg-[#e6eeff]',
      iconColor: 'text-[#2a14b4]'
    };
    setRecords((prev) => [noteRec, ...prev]);
    showToast('Injected context note to clinical history.');
  };

  // --- USER SPECIFIED STATE MUTATIONS ---
  const markMedicationTaken = async (medicationId: string) => {
    await runWithSyncLoader(async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const updated = await medicationService.markTaken(medicationId, 'taken');
      setMedications((prev) =>
        prev.map((m) => (m.id === medicationId ? { ...m, status: 'taken' } : m))
      );

      // Mark parent medication reminders as read
      setNotifications((prev) =>
        prev.map((n) =>
          n.recipient === 'parent' && n.category === 'medication_reminder'
            ? { ...n, read: true }
            : n
        )
      );

      // Update coordinator records view status to "✓ Confirmed at 8:05 PM"
      setRecords((prev) =>
        prev.map((rec) => {
          if (rec.id === medicationId || rec.id === 'rec-5') {
            return {
              ...rec,
              status: '✓ Confirmed at 8:05 PM'
            };
          }
          return rec;
        })
      );

      // Ingest a new coordinator notification
      const medNotif: AppNotification = {
        id: `sync-notif-med-${Date.now()}`,
        title: 'Medication Adherence Sync',
        message: "Dad's medication was confirmed.",
        type: 'sync',
        time: '8:05 PM',
        read: false
      };
      setNotifications((prev) => [medNotif, ...prev]);

      showToast(`Medication ${updated.name} marked as taken.`);
    });
  };

  const markMedicationMissed = async (medicationId: string) => {
    await runWithSyncLoader(async () => {
      const updated = await medicationService.markTaken(medicationId, 'missed');
      setMedications((prev) =>
        prev.map((m) => (m.id === medicationId ? { ...m, status: 'missed' } : m))
      );
      showToast(`Medication ${updated.name} marked as missed.`);
    });
  };

  const sendMedicationReminder = async (medicationId: string) => {
    await runWithSyncLoader(async () => {
      await medicationService.sendReminder(medicationId);
      const med = medications.find((m) => m.id === medicationId);

      const parentNotif: AppNotification = {
        id: `scen-notif-remind-${Date.now()}`,
        title: 'Anjali sent you a reminder. ❤️',
        message: `Did you take your ${med?.name || 'evening medication'}?`,
        type: 'reminder',
        time: 'Just now',
        read: false,
        recipient: 'parent',
        category: 'medication_reminder'
      };
      setNotifications((prev) => [parentNotif, ...prev]);

      showToast(`Reminder SMS transmitted for ${med?.name || 'Medication'}.`);
    });
  };

  const addCheckIn = async (status: 'Good' | 'Tired' | 'Unwell') => {
    await handleParentCheckIn(status);
  };

  const uploadDocument = async (newDoc: HealthDocument) => {
    await handleUploadDocument(newDoc);
  };

  const completeCareTask = async (taskId: string) => {
    await runWithSyncLoader(async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCareTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t))
      );
      const task = careTasks.find((t) => t.id === taskId);

      const newLog: SyncLog = {
        id: `slog-task-${Date.now()}`,
        time: 'Just now',
        device: 'Care Team portal',
        status: 'synced',
        value: `Task completed: ${task?.title || 'Care Task'}`,
        user: 'Suresh Kumar'
      };
      setSyncLogs((prev) => [newLog, ...prev]);
      showToast('Task marked as completed.');
    });
  };

  const assignCareTask = async (task: CareTask) => {
    await runWithSyncLoader(async () => {
      setCareTasks((prev) => [...prev, task]);
      const newLog: SyncLog = {
        id: `slog-task-${Date.now()}`,
        time: 'Just now',
        device: 'Coordinator portal',
        status: 'synced',
        value: `Assigned new task: ${task.title} to ${task.assignedTo}`,
        user: 'Anjali'
      };
      setSyncLogs((prev) => [newLog, ...prev]);
      showToast(`Assigned task: ${task.title}`);
    });
  };

  const sendFamilyMessage = (text: string) => {
    handleSendMessage(text);
  };

  const addHealthEvent = (event: HealthEvent) => {
    setRecords((prev) => [event as HealthRecordItem, ...prev]);
    showToast(`Health Event recorded: ${event.title}`);
  };

  const handleTriggerSimulation = (type: 'bp_spike' | 'missed_med' | 'cgm_sync' | 'suresh_log') => {
    let newNotif: AppNotification;

    if (type === 'bp_spike') {
      setCurrentBP('142/90 mmHg');
      const newLog = {
        date: 'Today',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        systolic: 142,
        diastolic: 90,
        source: 'Omron Monitor',
        note: 'Simulated BP spike'
      };
      setBpHistory((prev) => [newLog, ...prev]);

      newNotif = {
        id: `sim-notif-${Date.now()}`,
        title: 'BP Spiking Alert (Dad)',
        message:
          'Ramesh’s evening blood pressure increased to 142/90 mmHg. KinGuardian suggests checking room temperature.',
        type: 'alert',
        time: 'Just now',
        read: false,
        actionText: 'Analyze Vitals',
        actionScreen: 'vitals_detail',
        actionData: 'dad'
      };
    } else if (type === 'missed_med') {
      newNotif = {
        id: `sim-notif-${Date.now()}`,
        title: 'Medication Non-Adherence Alert',
        message:
          'Dad (Ramesh) has not checked off his morning Amlodipine 5mg dose. (Scheduled 2h ago).',
        type: 'reminder',
        time: 'Just now',
        read: false,
        actionText: 'View Med Schedule',
        actionScreen: 'care_view'
      };
    } else if (type === 'cgm_sync') {
      setCurrentGlucose('108');
      const newLog = {
        date: 'Today',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        glucose: 108,
        source: 'Dexcom G7 CGM',
        note: 'Continuous stream sync'
      };
      setGlucoseHistory((prev) => [newLog, ...prev]);

      newNotif = {
        id: `sim-notif-${Date.now()}`,
        title: 'CGM Sensor Stream Ingestion',
        message:
          'Martha (Mom) fasting glucose is 108 mg/dL. All metabolic trend markers are optimal.',
        type: 'sync',
        time: 'Just now',
        read: false,
        actionText: 'View CGM Graph',
        actionScreen: 'vitals_detail',
        actionData: 'mom'
      };
    } else {
      newNotif = {
        id: `sim-notif-${Date.now()}`,
        title: 'Caregiver Update: Suresh',
        message: 'Suresh completed Dad’s morning walking path. Vitals logged normal.',
        type: 'info',
        time: 'Just now',
        read: false,
        actionText: 'Open Chat',
        actionScreen: 'chat_view'
      };
    }

    setNotifications((prev) => [newNotif, ...prev]);
    showToast(`Simulation triggered: ${newNotif.title}`);
  };

  const handleWearableSyncRefresh = () => {
    setIsSyncing(true);
    showToast('Starting cloud synchronization...');
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Ingested 4 connected devices.');
      const newLog: SyncLog = {
        id: `slog-refresh-${Date.now()}`,
        time: 'Just now',
        device: 'Cloud Gateway',
        status: 'synced',
        value: 'Completed ambulatory sensor sweeps: 0 errors',
        user: 'System Ingest'
      };
      setSyncLogs((prev) => [newLog, ...prev]);
    }, 1500);
  };

  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      senderName: 'Anjali (You)',
      senderAvatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBjb58pDYmLPOvRb2C93qIwVmN3Z3qZ__ljM1T9ZSdVoVI9ovH8x3UkvVX2km1jcc-lJDB8XKVXGhKX0bZL8qDi2s9jgC8eOKs1TubpaykQObp6xTg11e7t9fDFBiO9G_knt_Iu91RQ6oYuQGrd_EwUBKvQprl0XXO1mrgZ2LripRVXQ9ztlZOQr21ScUbgnP5iva9lVWOYFTQ4E6180FpDmnFn1lhIDcG8awhKsT88RjoTEgkPxtmV',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' BST'
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const handleMarkRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleResetLoop = () => {
    setCurrentLoopStep(0);
    setCurrentBP('138/88 mmHg');
    setObservations(INITIAL_OBSERVATIONS);
    showToast('Walkthrough simulation reset.');
  };

  const handleAdvanceLoop = () => {
    const nextStep = currentLoopStep === 7 ? 0 : currentLoopStep + 1;
    setCurrentLoopStep(nextStep);

    if (nextStep === 0) {
      handleResetLoop();
      return;
    }

    if (nextStep === 1) {
      setCurrentBP('142/90 mmHg');
      const newLog = {
        date: 'Today',
        time: 'Just now',
        systolic: 142,
        diastolic: 90,
        source: 'Omron Monitor',
        note: 'Walkthrough Spike'
      };
      setBpHistory((prev) => [newLog, ...prev]);
      showToast('Step 1: BP spike event logged in Chennai.');
    } else if (nextStep === 2) {
      const logItem: SyncLog = {
        id: `loop-slog-${Date.now()}`,
        time: 'Just now',
        device: 'Omron Monitor',
        status: 'synced',
        value: 'Elevated BP reading stored: 142/90 mmHg',
        user: 'Ramesh (Dad)'
      };
      setSyncLogs((prev) => [logItem, ...prev]);
      showToast('Step 2: Shared state database updated.');
    } else if (nextStep === 3) {
      setObservations((prev) => ({
        ...prev,
        dad: {
          ...prev.dad,
          primaryStatement:
            "I noticed Dad's BP rose to 142/90 mmHg. The data shows this is different from Dad's usual pattern. You may want to discuss this with his doctor.",
          highlightText:
            'Systolic readings rose by 12% alongside a 35% decrease in outdoor step recovery.'
        }
      }));
      showToast('Step 3: KinGuardian AI clinical reasoning computed.');
    } else if (nextStep === 4) {
      const loopNotif: AppNotification = {
        id: `loop-notif-${Date.now()}`,
        title: 'Care Alert: Ramesh (Dad)',
        message:
          'I noticed Dad’s BP rose to 142/90 mmHg. The data shows this is different from Dad’s usual pattern. You may want to discuss this with his doctor.',
        type: 'alert',
        time: 'Just now',
        read: false,
        actionScreen: 'chat_view'
      };
      setNotifications((prev) => [loopNotif, ...prev]);
      showToast('Step 4: Anjali notified in London.');
    } else if (nextStep === 5) {
      setActiveTab('care');
      setCurrentScreen('care_view');
      const msgAnjali = {
        id: `loop-msg-anj-${Date.now()}`,
        sender: 'user' as const,
        senderName: 'Anjali (You)',
        senderAvatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBjb58pDYmLPOvRb2C93qIwVmN3Z3qZ__ljM1T9ZSdVoVI9ovH8x3UkvVX2km1jcc-lJDB8XKVXGhKX0bZL8qDi2s9jgC8eOKs1TubpaykQObp6xTg11e7t9fDFBiO9G_knt_Iu91RQ6oYuQGrd_EwUBKvQprl0XXO1mrgZ2LripRVXQ9ztlZOQr21ScUbgnP5iva9lVWOYFTQ4E6180FpDmnFn1lhIDcG8awhKsT88RjoTEgkPxtmV',
        text: "Suresh, KinGuardian just flagged Dad's BP is 142/90! Please check if he is drinking water and keeping cool in Chennai.",
        timestamp: 'Just now'
      };
      setChatMessages((prev) => [...prev, msgAnjali]);
      showToast('Step 5: Anjali messages caregiver Suresh.');
    } else if (nextStep === 6) {
      const msgSuresh = {
        id: `loop-msg-sur-${Date.now()}`,
        sender: 'family' as const,
        senderName: 'Suresh Kumar (Caregiver)',
        senderAvatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
        text: 'Hello Anjali, I am with Ramesh sir now. Gave him cold buttermilk and checked the AC. I will check his BP now.',
        timestamp: 'Just now'
      };
      setChatMessages((prev) => [...prev, msgSuresh]);
      showToast('Step 6: Suresh verified Ramesh sir, logs normal BP.');
    } else if (nextStep === 7) {
      setCurrentBP('124/80 mmHg');
      const logItem: SyncLog = {
        id: `loop-slog-res-${Date.now()}`,
        time: 'Just now',
        device: 'Manual check',
        status: 'synced',
        value: 'Suresh verified BP 124/80 (Normal)',
        user: 'Suresh (Caregiver)'
      };
      setSyncLogs((prev) => [logItem, ...prev]);
      setObservations(INITIAL_OBSERVATIONS);
      showToast('Step 7: Shared state returns to normal. Loop complete!');
    }
  };

  const switchScenario = (scenario: typeof currentScenario) => {
    setCurrentScenario(scenario);

    // Reset loop walkthrough state if they change scenario manually to avoid UI conflicts
    setCurrentLoopStep(0);

    // Reset base arrays to initial values first
    let newMeds: Medication[] = [...DEFAULT_MEDICATIONS];
    let newNotifs: AppNotification[] = [...INITIAL_NOTIFICATIONS];
    let newTasks: CareTask[] = [...DEFAULT_CARE_TASKS];
    let newInsights: AIInsight[] = [...DEFAULT_AI_INSIGHTS];
    let newBP = '120/80 mmHg';
    let newPeople = [...INITIAL_PEOPLE];

    if (scenario === 'normal') {
      newPeople = newPeople.map((p) => {
        if (p.id === 'dad') {
          return {
            ...p,
            wellbeingStatus: 'doing-well' as const,
            currentStatus: 'All vitals steady & medications taken',
            lastCheckIn: 'Today 9:15 AM'
          };
        }
        if (p.id === 'mom') {
          return {
            ...p,
            wellbeingStatus: 'doing-well' as const,
            currentStatus: 'All vitals steady & medications taken'
          };
        }
        return p;
      });
      showToast('Scenario: Calming Normal activated.');
    } else if (scenario === 'medication-missed') {
      newPeople = newPeople.map((p) => {
        if (p.id === 'dad') {
          return {
            ...p,
            wellbeingStatus: 'attention' as const,
            currentStatus: 'Atorvastatin missed tonight',
            lastCheckIn: 'Today 9:15 AM'
          };
        }
        return p;
      });
      // Flag Dad Atorvastatin as missed
      newMeds = newMeds.map((m) => (m.id === 'rec-5' ? { ...m, status: 'missed' } : m));
      // Add notification alert
      newNotifs.unshift({
        id: `scen-notif-missed-${Date.now()}`,
        title: 'Adherence Alert: Evening Atorvastatin',
        message:
          'I noticed Dad missed his evening Atorvastatin dose. The data shows this is different from Dad’s usual pattern. You may want to discuss this with his doctor.',
        type: 'alert',
        time: 'Just now',
        read: false,
        recipient: 'coordinator',
        category: 'medication'
      });
      // Add care task
      newTasks.unshift({
        id: `scen-task-missed-${Date.now()}`,
        personId: 'dad',
        title: 'Investigate missed Atorvastatin dose',
        status: 'pending',
        dueAt: 'Today · Urgent',
        priority: 'high',
        assignedTo: 'Priya'
      });
      showToast('Scenario: Medication Missed activated.');
    } else if (scenario === 'guardian-moment') {
      newBP = '142/90 mmHg';
      newPeople = newPeople.map((p) => {
        if (p.id === 'dad') {
          return {
            ...p,
            wellbeingStatus: 'attention' as const,
            currentStatus: 'BP Spiking (142/90 mmHg)',
            lastCheckIn: 'Today 9:15 AM'
          };
        }
        return p;
      });
      // Add BP Spike notification
      newNotifs.unshift({
        id: `scen-notif-guard-${Date.now()}`,
        title: 'Care Alert: BP Spike',
        message:
          'I noticed Ramesh’s systolic blood pressure rose to 142/90 mmHg. The data shows this is different from Dad’s usual pattern. You may want to discuss this with his doctor.',
        type: 'alert',
        time: 'Just now',
        read: false,
        recipient: 'coordinator',
        category: 'health_change'
      });
      // Add care task
      newTasks.unshift({
        id: `scen-task-guard-${Date.now()}`,
        personId: 'dad',
        title: 'Verify Ramesh hydration levels & AC cooling',
        status: 'pending',
        dueAt: 'Today · Urgent',
        priority: 'high',
        assignedTo: 'Suresh Kumar'
      });
      // Add insight
      newInsights.unshift({
        id: `scen-ins-guard-${Date.now()}`,
        personId: 'dad',
        title: 'Systolic Blood Pressure Spike',
        summary:
          'I noticed Ramesh sir’s blood pressure spiked to 142/90 mmHg. The data shows this is different from Dad’s usual pattern. You may want to discuss this with his doctor.',
        type: 'observation',
        severity: 'attention',
        timeframe: 'Just now',
        sources: ['Omron Monitor Sync']
      });
      showToast('Scenario: Guardian Moment activated.');
    } else if (scenario === 'new-lab-report') {
      newPeople = newPeople.map((p) => {
        if (p.id === 'dad') {
          return {
            ...p,
            wellbeingStatus: 'attention' as const,
            currentStatus: 'New metabolic panel results available',
            lastCheckIn: 'Today 9:15 AM'
          };
        }
        return p;
      });
      // Add document notification
      newNotifs.unshift({
        id: `scen-notif-doc-${Date.now()}`,
        title: 'Clinical Document Uploaded',
        message:
          'I noticed 6 new lab results in the Apollo report. The data shows creatinine has a slight elevation from Ramesh’s baseline. You may want to discuss this with his doctor.',
        type: 'sync',
        time: 'Just now',
        read: false,
        recipient: 'coordinator',
        category: 'document'
      });
      // Add care task
      newTasks.unshift({
        id: `scen-task-doc-${Date.now()}`,
        personId: 'dad',
        title: 'Review Apollo Hospital Cardiac Metabolic Panel',
        status: 'pending',
        dueAt: 'Today · 5 PM',
        priority: 'medium',
        assignedTo: 'Anjali Smith'
      });
      showToast('Scenario: New Lab Report Ingestion activated.');
    } else if (scenario === 'upcoming-appointment') {
      newPeople = newPeople.map((p) => {
        if (p.id === 'dad') {
          return {
            ...p,
            wellbeingStatus: 'doing-well' as const,
            currentStatus: 'Cardiology video visit tomorrow',
            lastCheckIn: 'Today 9:15 AM'
          };
        }
        return p;
      });
      // Add appointment notification
      newNotifs.unshift({
        id: `scen-notif-appt-${Date.now()}`,
        title: 'Telehealth Visit Reminder',
        message:
          'I noticed Dad has a Cardiology telehealth video visit tomorrow at 4:00 PM IST with Dr. Sharma.',
        type: 'reminder',
        time: '1 hour ago',
        read: false,
        recipient: 'coordinator',
        category: 'appointment'
      });
      // Add care task
      newTasks.unshift({
        id: `scen-task-appt-${Date.now()}`,
        personId: 'dad',
        title: 'Prepare consultation summaries and print CMP metrics',
        status: 'pending',
        dueAt: 'Today · 6 PM',
        priority: 'medium',
        assignedTo: 'Anjali Smith'
      });
      showToast('Scenario: Upcoming Appointment activated.');
    } else if (scenario === 'parent-feeling-unwell') {
      newBP = '138/88 mmHg';
      newPeople = newPeople.map((p) => {
        if (p.id === 'dad') {
          return {
            ...p,
            wellbeingStatus: 'attention' as const,
            currentStatus: 'Feeling Unwell',
            lastCheckIn: 'Today 11:15 AM'
          };
        }
        return p;
      });
      // Add checkin notification
      newNotifs.unshift({
        id: `scen-notif-feel-${Date.now()}`,
        title: 'Daily Check-In Alert',
        message:
          'I noticed Dad submitted a check-in feeling Unwell. The data shows this is different from Dad’s usual pattern. You may want to discuss this with his doctor.',
        type: 'alert',
        time: 'Just now',
        read: false,
        recipient: 'coordinator',
        category: 'parent_check-in'
      });
      // Add care task
      newTasks.unshift({
        id: `scen-task-feel-${Date.now()}`,
        personId: 'dad',
        title: 'Call Ramesh sir and perform temperature check',
        status: 'pending',
        dueAt: 'Today · Urgent',
        priority: 'high',
        assignedTo: 'Priya'
      });
      showToast('Scenario: Parent Feeling Unwell activated.');
    } else {
      showToast('Scenario: Calming Normal activated.');
    }

    setMedications(newMeds);
    setNotifications(newNotifs);
    setCareTasks(newTasks);
    setAiInsights(newInsights);
    setCurrentBP(newBP);
    setPeople(newPeople);
  };

  const sendCheckInRequest = () => {
    const checkinNotif: AppNotification = {
      id: `scen-notif-req-${Date.now()}`,
      title: 'Check-in Request 🛡️',
      message: 'Anjali wants to know how you are feeling today. Tap to check-in.',
      type: 'reminder',
      time: 'Just now',
      read: false,
      recipient: 'parent',
      category: 'kinguardian_request'
    };
    setNotifications((prev) => [checkinNotif, ...prev]);
    showToast('Check-in request sent to Dad.');
  };

  return (
    <AppContext.Provider
      value={{
        // --- USER SPECIFIED SHARED STATE SYSTEM ---
        currentUser,
        currentRole: appMode,
        familyMembers: people,
        selectedParent: people.find((p) => p.id === currentPersonId) || people[0],
        medications,
        appointments,
        healthEvents: records,
        documents,
        careTasks,
        notifications,
        aiInsights,
        messages: chatMessages,

        // --- USER SPECIFIED STATE MUTATIONS ---
        markMedicationTaken,
        markMedicationMissed,
        sendMedicationReminder,
        addCheckIn,
        uploadDocument,
        completeCareTask,
        assignCareTask,
        sendFamilyMessage,
        addHealthEvent,
        addParent,

        // --- PROTOTYPE NAVIGATION AND UI HELPERS (For compatibility) ---
        demoUsers: DEMO_USERS,
        switchDemoUser,
        appMode,
        setAppMode,
        currentScreen,
        setCurrentScreen,
        activeTab,
        setActiveTab,
        currentPersonId,
        setCurrentPersonId,
        people,
        setPeople,
        observations,
        records,
        recentSearches,
        setRecentSearches,
        syncLogs,
        chatMessages,
        currentBP,
        currentGlucose,
        isSyncing,
        bpHistory,
        glucoseHistory,
        quickActionsOpen,
        setQuickActionsOpen,
        askAIOpen,
        setAskAIOpen,
        askAIQuery,
        setAskAIQuery,
        checkInOpen,
        setCheckInOpen,
        toastMessage,
        showToast,
        handleManualBPLog,
        handleManualGlucoseLog,
        handleConfirmMedication,
        handleParentCheckIn,
        handleUploadDocument,
        handleAddMedication,
        handleAddAppointment,
        handleAddContextNote,
        handleTriggerSimulation,
        handleWearableSyncRefresh,
        handleSendMessage,
        handleMarkRead,
        handleClearAllNotifications,
        currentLoopStep,
        handleAdvanceLoop,
        handleResetLoop,
        consentApproved,
        setConsentApproved,
        currentScenario,
        switchScenario,
        sendCheckInRequest
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
