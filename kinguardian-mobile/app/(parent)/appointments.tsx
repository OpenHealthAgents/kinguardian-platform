import { useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { AppContext } from '../../src/store/AppContext';
import { ParentBottomNavBar } from '../../src/components/Navigation';
import { DeviceFrame } from '../../src/components/DeviceFrame';
import { SimulatorControls } from '../../src/components/SimulatorControls';
import { useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, Stethoscope } from 'lucide-react-native';

export default function AppointmentsRoute() {
  const context = useContext(AppContext);
  const router = useRouter();

  if (!context) return null;

  return (
    <DeviceFrame>
      <View className="flex-1 relative bg-[#f2f2f7]">
        {/* Header */}
        <View className="bg-white pt-6 pb-5 px-6 border-b border-neutral-100 space-y-0.5">
          <Text className="text-2xl font-bold text-neutral-900 tracking-tight">
            My next appointment
          </Text>
          <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Ramesh's Clinic Schedule
          </Text>
        </View>

        <ScrollView className="flex-1 p-5 space-y-5">
          <View className="bg-white rounded-2xl p-5 shadow-sm shadow-neutral-100 space-y-5">
            <View className="space-y-1">
              <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Department
              </Text>
              <Text className="text-2xl font-bold text-neutral-900 tracking-tight">Cardiology</Text>
            </View>

            <View className="space-y-4 pt-2 border-t border-neutral-100">
              <View className="flex-row items-center gap-3.5">
                <View className="w-9 h-9 rounded-full bg-rose-50 items-center justify-center shrink-0">
                  <Calendar size={16} color="#ff3b30" />
                </View>
                <View>
                  <Text className="text-[9px] font-bold text-neutral-400 uppercase">Date</Text>
                  <Text className="text-sm font-semibold text-neutral-800">Tomorrow</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3.5">
                <View className="w-9 h-9 rounded-full bg-[#eff6ff] items-center justify-center shrink-0">
                  <Clock size={16} color="#007aff" />
                </View>
                <View>
                  <Text className="text-[9px] font-bold text-neutral-400 uppercase">Time</Text>
                  <Text className="text-sm font-semibold text-neutral-800">4:00 PM</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3.5">
                <View className="w-9 h-9 rounded-full bg-emerald-50 items-center justify-center shrink-0">
                  <Stethoscope size={16} color="#34c759" />
                </View>
                <View>
                  <Text className="text-[9px] font-bold text-neutral-400 uppercase">Physician</Text>
                  <Text className="text-sm font-semibold text-neutral-800">Dr. Sharma</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3.5">
                <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center shrink-0">
                  <MapPin size={16} color="#007aff" />
                </View>
                <View>
                  <Text className="text-[9px] font-bold text-neutral-400 uppercase">
                    Clinic location
                  </Text>
                  <Text className="text-xs font-semibold text-neutral-800 leading-snug">
                    Apollo Hospital Chennai
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => context.showToast('Opening clinic directions & preparations...')}
              className="w-full bg-[#007aff] py-3.5 rounded-2xl items-center justify-center active:scale-95 shadow-sm mt-2"
            >
              <Text className="text-white font-bold text-sm">View appointment</Text>
            </TouchableOpacity>
          </View>
          <View className="h-28" />
        </ScrollView>

        <ParentBottomNavBar
          activeTab="home"
          onTabChange={(tab) => {
            if (tab === 'home') router.push('/(parent)');
            else if (tab === 'medicines') router.push('/(parent)/medicines');
            else if (tab === 'profile') router.push('/(parent)/profile');
            else if (tab === 'ask') router.push('/(parent)/ask');
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
