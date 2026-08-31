import { useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { AppContext } from '../../../../src/store/AppContext';
import { DeviceFrame } from '../../../../src/components/DeviceFrame';
import { SimulatorControls } from '../../../../src/components/SimulatorControls';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, ShieldCheck, Moon, Scale, Sparkles } from 'lucide-react-native';

export default function AppointmentPrepareRoute() {
  const context = useContext(AppContext);
  const router = useRouter();

  if (!context) return null;

  const mockQuestions = [
    "Should we adjust Dad's afternoon diuretic timing on days when Chennai heat peaks above 38°C?",
    'How does the recent 35% steps activity decline correlate with his evening BP spikes?',
    'Are there any specific electrolyte or hydration benchmarks we need to track given his stable weight?'
  ];

  return (
    <DeviceFrame>
      <View className="flex-1 relative bg-[#fbfaf7]">
        {/* Header */}
        <View className="px-6 py-5 border-b border-[#e2dfd9] bg-[#fbfaf7] flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-1 hover:bg-slate-100 rounded-full"
          >
            <ArrowLeft size={20} color="#121c2a" />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-black text-[#121c2a]">Prepare for Dad's appointment</Text>
            <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Cardiology Consultation Prep
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 pt-5 space-y-6">
          {/* Since Last Appointment Stats Grid */}
          <View className="space-y-3">
            <Text className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Since last appointment
            </Text>

            <View className="bg-white border border-[#e2dfd9] rounded-3xl p-5 shadow-sm space-y-4">
              {/* BP Spike */}
              <View className="flex-row items-center justify-between border-b border-slate-50 pb-3">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-rose-50 items-center justify-center">
                    <TrendingUp size={14} color="#ba1a1a" />
                  </View>
                  <Text className="text-xs font-bold text-slate-800">Blood pressure</Text>
                </View>
                <Text className="text-xs font-black text-[#ba1a1a]">↑ Elevated</Text>
              </View>

              {/* Med Adherence */}
              <View className="flex-row items-center justify-between border-b border-slate-50 pb-3">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-[#f4effc] items-center justify-center">
                    <ShieldCheck size={14} color="#2a14b4" />
                  </View>
                  <Text className="text-xs font-bold text-slate-800">Medication adherence</Text>
                </View>
                <Text className="text-xs font-black text-slate-700">92%</Text>
              </View>

              {/* Weight stable */}
              <View className="flex-row items-center justify-between border-b border-slate-50 pb-3">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center">
                    <Scale size={14} color="#059669" />
                  </View>
                  <Text className="text-xs font-bold text-slate-800">Weight</Text>
                </View>
                <Text className="text-xs font-black text-[#059669]">Stable</Text>
              </View>

              {/* Sleep lower */}
              <View className="flex-row items-center justify-between last:border-0 last:pb-0 pb-3">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
                    <Moon size={14} color="#708090" />
                  </View>
                  <Text className="text-xs font-bold text-slate-800">Sleep</Text>
                </View>
                <Text className="text-xs font-black text-slate-500">Slightly lower</Text>
              </View>
            </View>
          </View>

          {/* Questions to Ask */}
          <View className="space-y-3">
            <View className="flex-row items-center gap-1.5">
              <Sparkles size={14} color="#2a14b4" fill="#2a14b4" />
              <Text className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Questions to ask
              </Text>
            </View>

            <View className="space-y-2.5">
              {mockQuestions.map((question, idx) => (
                <View
                  key={idx}
                  className="bg-white border border-[#e2dfd9] rounded-2xl p-4 shadow-xs"
                >
                  <Text className="text-xs font-semibold text-slate-700 leading-relaxed">
                    "{question}"
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* CTA Trigger */}
          <View className="space-y-3.5 pt-2">
            <TouchableOpacity
              onPress={() => router.push('/parent/dad/summary')}
              className="w-full bg-[#2a14b4] py-4.5 rounded-2xl items-center justify-center active:scale-98 shadow-md"
            >
              <Text className="text-white font-black text-sm uppercase tracking-wider">
                Create doctor summary
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                context.showToast('Questions compiled to appointment checklist.');
                router.back();
              }}
              className="w-full bg-slate-100 border border-slate-200 py-4.5 rounded-2xl items-center justify-center active:scale-98"
            >
              <Text className="text-slate-600 font-black text-xs uppercase tracking-wider">
                Save Checklist
              </Text>
            </TouchableOpacity>
          </View>

          <View className="h-24" />
        </ScrollView>
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
