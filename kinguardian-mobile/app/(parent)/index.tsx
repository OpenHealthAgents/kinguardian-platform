import { useContext, useState } from 'react';
import { View } from 'react-native';
import { AppContext } from '../../src/store/AppContext';
import { ParentModeDashboard } from '../../src/components/ParentModeDashboard';
import { ParentBottomNavBar } from '../../src/components/Navigation';
import { ParentVoiceModal } from '../../src/components/ParentVoiceModal';
import { ParentCameraModal } from '../../src/components/ParentCameraModal';
import { NotificationCenter } from '../../src/components/NotificationCenter';
import { DeviceFrame } from '../../src/components/DeviceFrame';
import { SimulatorControls } from '../../src/components/SimulatorControls';
import { useRouter } from 'expo-router';

export default function ParentDashboardRoute() {
  const context = useContext(AppContext);
  const router = useRouter();

  const [parentVoiceOpen, setParentVoiceOpen] = useState(false);
  const [parentCameraOpen, setParentCameraOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  if (!context) return null;

  const isAtorvastatinTaken =
    context.records
      .find((r) => r.id === 'rec-5')
      ?.status?.toLowerCase()
      .includes('taken') || false;

  const parentNotifications = context.notifications.filter((n) => n.recipient === 'parent');
  const unreadCount = parentNotifications.filter((n) => !n.read).length;

  return (
    <DeviceFrame>
      <View className="flex-1 relative bg-[#f2f2f7]">
        <ParentModeDashboard
          onSwitchMode={() => {
            context.setAppMode('coordinator');
            router.replace('/(coordinator)');
          }}
          medications={context.records.filter(
            (r) => r.category === 'medications' && r.personId === 'dad'
          )}
          onConfirmMedication={context.handleConfirmMedication}
          onCheckIn={context.handleParentCheckIn}
          onOpenVoice={() => setParentVoiceOpen(true)}
          dadStatus={context.people.find((p) => p.id === 'dad')?.currentStatus || ''}
          isAtorvastatinTaken={isAtorvastatinTaken}
          onOpenNotifications={() => setNotificationsOpen(true)}
          unreadCount={unreadCount}
        />

        <ParentVoiceModal
          isOpen={parentVoiceOpen}
          onClose={() => setParentVoiceOpen(false)}
          onConfirmTimeline={(msg) => {
            context.handleAddContextNote(`Voice Check-in: ${msg}`);
          }}
        />

        <ParentCameraModal
          isOpen={parentCameraOpen}
          onClose={() => setParentCameraOpen(false)}
          onUploadDocument={context.handleUploadDocument}
        />

        <NotificationCenter
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          notifications={parentNotifications}
          onMarkRead={context.handleMarkRead}
          onNavigateScreen={(screen) => {
            if (screen === 'chat_view') {
              router.push('/(parent)/ask');
            } else if (screen === 'care_view') {
              router.push('/(parent)/medicines');
            }
          }}
          onClearAll={context.handleClearAllNotifications}
        />

        <ParentBottomNavBar
          activeTab="home"
          onTabChange={(tab) => {
            if (tab === 'medicines') router.push('/(parent)/medicines');
            else if (tab === 'ask') router.push('/(parent)/ask');
            else if (tab === 'profile') router.push('/(parent)/profile');
          }}
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
