import { useContext, useState } from 'react';
import { View } from 'react-native';
import { AppContext } from '../../src/store/AppContext';
import { HealthDashboard } from '../../src/components/HealthDashboard';
import { BottomNavBar } from '../../src/components/Navigation';
import { QuickActionsModal } from '../../src/components/QuickActionsModal';
import { AskKinGuardianModal } from '../../src/components/AskKinGuardianModal';
import { CheckInModal } from '../../src/components/CheckInModal';

import { NotificationCenter } from '../../src/components/NotificationCenter';
import { DeviceFrame } from '../../src/components/DeviceFrame';
import { SimulatorControls } from '../../src/components/SimulatorControls';
import { useRouter } from 'expo-router';

export default function CoordinatorDashboardRoute() {
  const context = useContext(AppContext);
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickActionsTab, setQuickActionsTab] = useState<
    'menu' | 'log_bp' | 'add_med' | 'add_context' | 'add_appt'
  >('menu');

  if (!context) return null;

  const openQuickActionsWithTab = (
    tab: 'menu' | 'log_bp' | 'add_med' | 'add_context' | 'add_appt'
  ) => {
    setQuickActionsTab(tab);
    context.setQuickActionsOpen(true);
  };

  const currentObservation =
    context.observations[context.currentPersonId] || context.observations.dad;
  const currentPerson =
    context.people.find((p) => p.id === context.currentPersonId) || context.people[0];
  const isAtorvastatinTaken = context.medications.find((m) => m.id === 'rec-5')?.status === 'taken';

  const coordinatorNotifications = context.notifications.filter((n) => n.recipient !== 'parent');
  const unreadCount = coordinatorNotifications.filter((n) => !n.read).length;

  return (
    <DeviceFrame>
      <View className="flex-1 relative bg-[#f8f9ff]">
        <HealthDashboard
          observation={currentObservation}
          people={context.people}
          currentPersonId={context.currentPersonId}
          onSelectPerson={context.setCurrentPersonId}
          onViewTransparency={() => router.push(`/parent/${context.currentPersonId}/insights`)}
          onOpenCheckIn={() => context.setCheckInOpen(true)}
          onAddContext={() => openQuickActionsWithTab('add_context')}
          onTalkToDoctor={() => {
            context.setAskAIQuery(
              `I'd like to consult with Dr. Sharma regarding Dad's BP pattern of ${context.currentBP} and active steps drop.`
            );
            context.setAskAIOpen(true);
          }}
          onOpenQuickActions={(tab) => openQuickActionsWithTab(tab || 'menu')}
          onViewVitalDetail={(type) => {
            context.setCurrentPersonId(type === 'bp' ? 'dad' : 'mom');
            router.push(`/parent/${type === 'bp' ? 'dad' : 'mom'}`);
          }}
          currentBP={context.currentBP}
          currentGlucose={context.currentGlucose}
          isAtorvastatinTaken={isAtorvastatinTaken}
          onRemindDad={() => {
            context.sendMedicationReminder('rec-5');
          }}
          onContactCaregiver={() => router.push('/care')}
          onViewMedication={() => router.push('/care')}
          onOpenNotifications={() => setNotificationsOpen(true)}
          unreadCount={unreadCount}
          currentScenario={context.currentScenario}
          onCheckInWithDad={context.sendCheckInRequest}
        />

        <BottomNavBar
          activeTab="home"
          currentScreen="health_dashboard"
          onTabChange={(tab) => {
            if (tab === 'home') router.push('/(coordinator)');
            else if (tab === 'parents') router.push('/parents');
            else if (tab === 'ask') context.setAskAIOpen(true);
            else if (tab === 'care') router.push('/care');
            else if (tab === 'profile') router.push('/profile');
          }}
          onOpenQuickActions={() => openQuickActionsWithTab('menu')}
          onOpenAskAI={() => context.setAskAIOpen(true)}
        />

        {/* Overlays */}
        <QuickActionsModal
          isOpen={context.quickActionsOpen}
          initialTab={quickActionsTab}
          onClose={() => context.setQuickActionsOpen(false)}
          onSelectAction={(actionType) => {
            if (actionType === 'ask') context.setAskAIOpen(true);
            else if (actionType === 'family') router.push('/chat');
            else if (actionType === 'report') router.push('/records');
          }}
          onLogVitalSuccess={context.handleManualBPLog}
          onAddMedicationSuccess={context.handleAddMedication}
          onAddAppointmentSuccess={context.handleAddAppointment}
          onAddContextSuccess={context.handleAddContextNote}
        />

        <AskKinGuardianModal
          isOpen={context.askAIOpen}
          onClose={() => context.setAskAIOpen(false)}
          initialQuery={context.askAIQuery}
          currentSubject={context.currentPersonId}
        />


        <CheckInModal
          isOpen={context.checkInOpen}
          person={currentPerson}
          onClose={() => context.setCheckInOpen(false)}
          onSendCheckIn={(msg) => context.showToast(`Delivered message: "${msg}"`)}
        />

        <NotificationCenter
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          notifications={coordinatorNotifications}
          onMarkRead={context.handleMarkRead}
          onNavigateScreen={(screen) => {
            if (screen === 'vitals_detail') {
              router.push('/(coordinator)/parent/dad');
            } else if (screen === 'chat_view') {
              router.push('/(coordinator)/family-chat');
            } else if (screen === 'search_records') {
              router.push('/(coordinator)/records');
            } else if (screen === 'care_view') {
              router.push('/(coordinator)/care');
            } else if (screen === 'transparency_insight') {
              router.push('/(coordinator)/parent/dad/insights');
            }
          }}
          onClearAll={context.handleClearAllNotifications}
        />
      </View>
      <SimulatorControls
        onTriggerNotification={context.handleTriggerSimulation}
        onRefreshData={context.handleWearableSyncRefresh}
        isSyncing={context.isSyncing}
        currentLoopStep={context.currentLoopStep}
        onAdvanceLoop={context.handleAdvanceLoop}
        onResetLoop={context.handleResetLoop}
      />
    </DeviceFrame>
  );
}
