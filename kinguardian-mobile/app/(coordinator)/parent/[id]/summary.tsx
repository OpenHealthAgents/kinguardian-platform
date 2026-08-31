import { useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { AppContext } from '../../../../src/store/AppContext';
import { DeviceFrame } from '../../../../src/components/DeviceFrame';
import { SimulatorControls } from '../../../../src/components/SimulatorControls';
import { useRouter } from 'expo-router';
import { ArrowLeft, Share2, Copy } from 'lucide-react-native';

export default function DoctorSummaryRoute() {
  const context = useContext(AppContext);
  const router = useRouter();

  if (!context) return null;

  const currentBP = context.currentBP;

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
            <Text className="text-lg font-black text-[#121c2a]">Doctor Summary</Text>
            <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Shareable Health Handout
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 pt-5 space-y-6">
          {/* Card Summary Ingest */}
          <View className="bg-white border border-[#e2dfd9] rounded-[32px] p-6 shadow-sm space-y-5">
            {/* Patient Demographic */}
            <View className="space-y-1">
              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Patient & Provider
              </Text>
              <Text className="text-xl font-black text-slate-900">Ramesh (Dad)</Text>
              <Text className="text-xs text-slate-500 font-bold">
                68 Years · Chennai, India · Apollo Hospital (Fee: ₹800)
              </Text>
            </View>

            {/* Current Medications */}
            <View className="border-t border-slate-100 pt-4 space-y-2">
              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Current medications
              </Text>
              <View className="space-y-1.5">
                <Text className="text-xs text-slate-800 font-bold">
                  💊 Amlodipine 5mg{' '}
                  <Text className="text-slate-400 font-semibold">(Daily Morning)</Text>
                </Text>
                <Text className="text-xs text-slate-800 font-bold">
                  💊 Atorvastatin 20mg{' '}
                  <Text className="text-slate-400 font-semibold">(Daily Evening)</Text>
                </Text>
              </View>
            </View>

            {/* Recent Vitals */}
            <View className="border-t border-slate-100 pt-4 space-y-2">
              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Recent vitals
              </Text>
              <View className="space-y-1.5">
                <Text className="text-xs text-slate-800 font-bold">
                  🩺 Blood Pressure: <Text className="font-black text-[#ba1a1a]">{currentBP}</Text>
                </Text>
                <Text className="text-xs text-slate-800 font-bold">
                  🩺 Fasting Sugar: <Text className="font-black text-[#059669]">98 mg/dL</Text>
                </Text>
              </View>
            </View>

            {/* Important Trends */}
            <View className="border-t border-slate-100 pt-4 space-y-2">
              <Text className="text-[9px] font-black text-[#ba1a1a] uppercase tracking-widest">
                Important trends
              </Text>
              <Text className="text-xs text-slate-700 font-bold leading-relaxed">
                📈 Midday step activity decreased by 35% over the last 5 days during a 39°C Chennai
                temperature spike (Ramesh resting indoors).
              </Text>
            </View>

            {/* Recent Labs */}
            <View className="border-t border-slate-100 pt-4 space-y-2">
              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Recent labs
              </Text>
              <Text className="text-xs text-slate-700 font-bold">
                🧪 HbA1c: <Text className="font-black text-[#059669]">6.4%</Text> (Fasting Metabolic
                panel - Aug 14)
              </Text>
            </View>

            {/* Symptoms */}
            <View className="border-t border-slate-100 pt-4 space-y-2">
              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Symptoms
              </Text>
              <Text className="text-xs text-slate-700 font-bold leading-relaxed">
                😴 Mild fatigue registered during Chennai afternoon heat peaks. Verified staying
                indoors in AC with hydration checklists.
              </Text>
            </View>

            {/* Questions to Ask */}
            <View className="border-t border-slate-100 pt-4 space-y-2">
              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Questions for physician
              </Text>
              <View className="space-y-1.5">
                <Text className="text-xs text-slate-700 font-semibold italic">
                  "1. Should we adjust Dad's afternoon diuretic timing on days when Chennai heat
                  peaks above 38°C?"
                </Text>
                <Text className="text-xs text-slate-700 font-semibold italic">
                  "2. How does the recent 35% steps activity decline correlate with his evening BP
                  spikes?"
                </Text>
              </View>
            </View>
          </View>

          {/* Action CTAs */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={() =>
                context.showToast("Summary shared successfully with Dr. Sharma's registry!")
              }
              className="w-full bg-[#2a14b4] py-4.5 rounded-2xl flex-row items-center justify-center gap-2 active:scale-98 shadow-md"
            >
              <Share2 size={16} color="#ffffff" />
              <Text className="text-white font-black text-sm uppercase tracking-wider">
                Share with doctor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => context.showToast('Summary copied to mobile clipboard.')}
              className="w-full bg-white border border-[#dee9fc] py-4.5 rounded-2xl flex-row items-center justify-center gap-2 active:scale-98"
            >
              <Copy size={16} color="#708090" />
              <Text className="text-slate-600 font-black text-xs uppercase tracking-wider">
                Copy summary
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
