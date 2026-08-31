import { useContext } from 'react';
import { View } from 'react-native';
import { AppContext } from '../../../../src/store/AppContext';
import { TransparencyInsightScreen } from '../../../../src/components/TransparencyInsightScreen';
import { DeviceFrame } from '../../../../src/components/DeviceFrame';
import { SimulatorControls } from '../../../../src/components/SimulatorControls';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ClinicalInsightsRoute() {
  const context = useContext(AppContext);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: 'dad' | 'mom' }>();

  if (!context) return null;

  const personId = id || 'dad';
  const currentObservation = context.observations[personId] || context.observations.dad;

  return (
    <DeviceFrame>
      <View className="flex-1 relative bg-[#f8f9ff]">
        <TransparencyInsightScreen
          observation={{
            ...currentObservation,
            transparency: {
              ...currentObservation.transparency,
              readingsHistory: personId === 'dad' ? context.bpHistory : context.glucoseHistory
            }
          }}
          onBack={() => router.replace('/(coordinator)')}
          onAskFollowUp={(query) => {
            context.setAskAIQuery(query);
            context.setAskAIOpen(true);
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
