import { useContext } from 'react';
import { View } from 'react-native';
import { AppContext } from '../../../../src/store/AppContext';
import { WearablesManagementScreen } from '../../../../src/components/WearablesManagementScreen';
import { DeviceFrame } from '../../../../src/components/DeviceFrame';
import { SimulatorControls } from '../../../../src/components/SimulatorControls';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function WearablesRoute() {
  const context = useContext(AppContext);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!context) return null;

  const personId = id || 'dad';
  const parentName = personId === 'dad' ? 'Ramesh Sharma (Dad)' : 'Lakshmi Sharma (Mom)';

  return (
    <DeviceFrame>
      <View className="flex-1 relative bg-[#f8f9ff]">
        <WearablesManagementScreen
          personId={personId}
          parentName={parentName}
          onBack={() => router.back()}
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
