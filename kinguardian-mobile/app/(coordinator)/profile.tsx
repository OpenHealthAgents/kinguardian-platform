import { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { AppContext } from '../../src/store/AppContext';
import { BottomNavBar } from '../../src/components/Navigation';
import { DeviceFrame } from '../../src/components/DeviceFrame';
import { SimulatorControls } from '../../src/components/SimulatorControls';
import { useRouter } from 'expo-router';
import {
  User,
  Shield,
  Smartphone,
  HeartHandshake,
  Users,
  ChevronRight,
  X
} from 'lucide-react-native';

export default function CoordinatorProfileRoute() {
  const context = useContext(AppContext);
  const router = useRouter();
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [showDevicesModal, setShowDevicesModal] = useState(false);

  if (!context) return null;

  return (
    <DeviceFrame>
      <View className="flex-1 relative bg-[#f2f2f7]">
        {/* Header */}
        <View className="px-6 py-5 border-b border-neutral-100 bg-white">
          <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Configuration
          </Text>
          <Text className="text-2xl font-bold text-neutral-900 tracking-tight mt-0.5">
            Settings
          </Text>
        </View>

        <ScrollView className="flex-1 px-5 pt-4 space-y-4">
          {/* User Profile Card */}
          <View className="p-4 rounded-2xl border border-neutral-100 bg-white flex-row items-center gap-4 shadow-sm">
            <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center">
              <User size={22} color="#007aff" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-neutral-900 leading-none">
                Anjali Sharma
              </Text>
              <Text className="text-xs text-neutral-400 mt-1 font-semibold">
                London, United Kingdom (BST)
              </Text>
            </View>
          </View>

          {/* Switch Persona Box */}
          <View className="p-5 rounded-2xl border border-neutral-100 bg-white shadow-sm space-y-3.5">
            <View className="flex-row items-center gap-2">
              <HeartHandshake size={18} color="#ff9500" />
              <Text className="text-sm font-bold text-neutral-900">Prototype Persona Switcher</Text>
            </View>
            <Text className="text-xs text-neutral-500 leading-normal">
              Test the two-sided product experiences. Switch to Parent Mode to see Dad Ramesh's
              large high-contrast checklist in Chennai.
            </Text>
            <TouchableOpacity
              onPress={() => {
                context.setAppMode('parent');
                context.showToast('Switched persona to Ramesh (Parent Mode)');
                router.replace('/(parent)');
              }}
              activeOpacity={0.8}
              className="w-full bg-[#007aff] py-3 rounded-xl items-center justify-center"
            >
              <Text className="text-xs font-bold text-white">Switch to Parent Mode</Text>
            </TouchableOpacity>
          </View>

          {/* Settings Options Group */}
          <View className="border border-neutral-100 bg-white rounded-2xl divide-y divide-neutral-200/80 overflow-hidden shadow-sm">
            <TouchableOpacity
              onPress={() => router.push('/family')}
              className="p-4 flex-row items-center justify-between active:bg-neutral-50"
            >
              <View className="flex-row items-center gap-3">
                <Users size={16} color="#007aff" />
                <View>
                  <Text className="text-xs font-bold text-neutral-800">Family Coordination</Text>
                  <Text className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                    Map responsibilities & family care assignments
                  </Text>
                </View>
              </View>
              <ChevronRight size={14} color="#8e8e93" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowTrustModal(true)}
              className="p-4 flex-row items-center justify-between active:bg-neutral-50"
            >
              <View className="flex-row items-center gap-3">
                <Shield size={16} color="#34c759" />
                <View>
                  <Text className="text-xs font-bold text-neutral-800">
                    Clinical Ingestion Trust Settings
                  </Text>
                  <Text className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                    Fuzzy logic limits: Spikes flagging configured
                  </Text>
                </View>
              </View>
              <ChevronRight size={14} color="#8e8e93" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDevicesModal(true)}
              className="p-4 flex-row items-center justify-between active:bg-neutral-50"
            >
              <View className="flex-row items-center gap-3">
                <Smartphone size={16} color="#af52de" />
                <View>
                  <Text className="text-xs font-bold text-neutral-800">Connected Devices</Text>
                  <Text className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                    Dexcom G7, Omron 7000, Apple Watch
                  </Text>
                </View>
              </View>
              <ChevronRight size={14} color="#8e8e93" />
            </TouchableOpacity>
          </View>

          <View className="h-24" />
        </ScrollView>

        <BottomNavBar
          activeTab="profile"
          currentScreen="health_dashboard"
          onTabChange={(tab) => {
            if (tab === 'home') router.push('/(coordinator)');
            else if (tab === 'parents') router.push('/parents');
            else if (tab === 'ask') context.setAskAIOpen(true);
            else if (tab === 'care') router.push('/care');
          }}
          onOpenQuickActions={() => context.setQuickActionsOpen(true)}
          onOpenAskAI={() => context.setAskAIOpen(true)}
        />

        {/* Clinical Ingestion Trust Settings Modal */}
        <Modal
          visible={showTrustModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTrustModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-[28px] p-6 pt-3 space-y-4 shadow-xl">
              {/* iOS Grabber Handle */}
              <View className="w-10 h-1.5 bg-neutral-200 rounded-full self-center mb-1.5" />

              <View className="flex-row justify-between items-center pb-2 border-b border-neutral-100">
                <View className="flex-row items-center gap-2">
                  <Shield size={18} color="#34c759" />
                  <Text className="text-lg font-bold text-neutral-900 tracking-tight">
                    Clinical Ingestion
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowTrustModal(false)}
                  className="p-1.5 bg-neutral-100 rounded-full"
                >
                  <X size={16} color="#8e8e93" />
                </TouchableOpacity>
              </View>

              <ScrollView className="space-y-4">
                <View className="bg-neutral-50 p-4 rounded-xl space-y-2 border border-neutral-100">
                  <Text className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Telemetry Spike Flagging
                  </Text>
                  <Text className="text-xs text-neutral-500 font-semibold leading-relaxed">
                    Fuzzy reasoning rules detect anomalies in blood pressure and steps streams.
                    Spikes trigger proactive alerts for the coordinator.
                  </Text>
                </View>

                <View className="bg-white border border-neutral-100 rounded-xl divide-y divide-neutral-200/80 overflow-hidden shadow-xs">
                  <View className="p-4 flex-row justify-between items-center">
                    <Text className="text-xs font-bold text-neutral-700">BP Spike Trigger</Text>
                    <Text className="text-xs font-bold text-[#ff3b30]">&gt;= 140/90 mmHg</Text>
                  </View>
                  <View className="p-4 flex-row justify-between items-center">
                    <Text className="text-xs font-bold text-neutral-700">Activity Drop Flag</Text>
                    <Text className="text-xs font-bold text-[#ff9500]">&gt;= 30% drop (5d)</Text>
                  </View>
                  <View className="p-4 flex-row justify-between items-center">
                    <Text className="text-xs font-bold text-neutral-700">Fuzzy Logic Ingest</Text>
                    <Text className="text-xs font-semibold text-neutral-500">
                      Active (Moderate)
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setShowTrustModal(false)}
                  className="w-full bg-[#007aff] py-3.5 rounded-xl items-center justify-center mt-2 active:opacity-90"
                >
                  <Text className="text-white text-xs font-bold">Save &amp; Close</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Connected Devices Modal */}
        <Modal
          visible={showDevicesModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDevicesModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-[28px] p-6 pt-3 space-y-4 shadow-xl">
              {/* iOS Grabber Handle */}
              <View className="w-10 h-1.5 bg-neutral-200 rounded-full self-center mb-1.5" />

              <View className="flex-row justify-between items-center pb-2 border-b border-neutral-100">
                <View className="flex-row items-center gap-2">
                  <Smartphone size={18} color="#af52de" />
                  <Text className="text-lg font-bold text-neutral-900 tracking-tight">
                    Connected Devices
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowDevicesModal(false)}
                  className="p-1.5 bg-neutral-100 rounded-full"
                >
                  <X size={16} color="#8e8e93" />
                </TouchableOpacity>
              </View>

              <ScrollView className="space-y-4">
                <View className="bg-neutral-50 p-4 rounded-xl space-y-2 border border-neutral-100">
                  <Text className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Device Pairings
                  </Text>
                  <Text className="text-xs text-neutral-500 font-semibold leading-relaxed">
                    Manage external telemetry sensors mapped to Ramesh &amp; Lakshmi's health
                    profiles.
                  </Text>
                </View>

                <View className="bg-white border border-neutral-100 rounded-xl divide-y divide-neutral-200/80 overflow-hidden shadow-xs">
                  <View className="p-4 flex-row justify-between items-center">
                    <View>
                      <Text className="text-xs font-bold text-neutral-800">Omron BP Monitor</Text>
                      <Text className="text-[9px] text-neutral-400 font-semibold mt-0.5">
                        Dad Ramesh · Bluetooth Hub
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-[#34c759]">Connected</Text>
                  </View>

                  <View className="p-4 flex-row justify-between items-center">
                    <View>
                      <Text className="text-xs font-bold text-neutral-800">Dexcom G7 CGM</Text>
                      <Text className="text-[9px] text-neutral-400 font-semibold mt-0.5">
                        Mom Lakshmi · Dexcom Cloud Stream
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-[#34c759]">Connected</Text>
                  </View>

                  <View className="p-4 flex-row justify-between items-center">
                    <View>
                      <Text className="text-xs font-bold text-neutral-800">
                        Apple Health (Steps)
                      </Text>
                      <Text className="text-[9px] text-neutral-400 font-semibold mt-0.5">
                        Ramesh &amp; Lakshmi · Local Sync
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-[#34c759]">Connected</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    context.handleWearableSyncRefresh();
                    setShowDevicesModal(false);
                  }}
                  className="w-full bg-[#007aff] py-3.5 rounded-xl items-center justify-center mt-2 active:opacity-90"
                >
                  <Text className="text-white text-xs font-bold">Sync All Devices</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
