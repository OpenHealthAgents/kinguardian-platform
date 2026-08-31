import { useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  ChevronRight,
  Activity,
  ShieldAlert
} from 'lucide-react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { AppContext } from '../../../../src/store/AppContext';
import { DeviceFrame } from '../../../../src/components/DeviceFrame';
import { SimulatorControls } from '../../../../src/components/SimulatorControls';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function GuardianMomentRoute() {
  const context = useContext(AppContext);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: 'dad' | 'mom' }>();

  if (!context) return null;

  const personId = id || 'dad';
  const isDad = personId === 'dad';
  const parent = isDad
    ? context.familyMembers.find((p) => p.id === 'dad')
    : context.familyMembers.find((p) => p.id === 'mom');
  if (!parent) return null;

  // Visual activity steps data points (dropping trend)
  const activityData = [5800, 5200, 4100, 3200, 2400, 2100];
  const chartWidth = 340;
  const chartHeight = 110;
  const padding = 15;

  const points = activityData.map((val, idx) => {
    const x = padding + (idx * (chartWidth - padding * 2)) / (activityData.length - 1);
    const minVal = 1000;
    const maxVal = 7000;
    const valRange = maxVal - minVal;
    const y = chartHeight - padding - ((val - minVal) / valRange) * (chartHeight - padding * 2);
    return `${x},${y}`;
  });

  const pathD = points.length > 0 ? `M ${points.map((p) => p).join(' L ')}` : '';
  const areaD = points.length > 0 ? `M 15,95 L ${points.map((p) => p).join(' L ')} L 325,95 Z` : '';

  return (
    <DeviceFrame>
      <View className="flex-1 relative bg-[#fbfaf7]">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-[#e2dfd9] bg-[#fbfaf7]">
          <TouchableOpacity
            onPress={() => router.replace('/(coordinator)')}
            className="p-2 bg-slate-100 rounded-full"
          >
            <ArrowLeft size={16} color="#464554" />
          </TouchableOpacity>
          <Text className="text-sm font-black text-slate-800 uppercase tracking-wider">
            Guardian moment
          </Text>
          <View className="w-9 h-9" />
        </View>

        <ScrollView className="flex-1 p-5 space-y-6">
          {/* Header Title & Slogan */}
          <View className="space-y-2">
            <View className="flex-row items-center gap-2">
              <ShieldAlert size={16} color="#ba1a1a" />
              <Text className="text-xs font-black text-[#ba1a1a] uppercase tracking-wider">
                Telemetry Shift
              </Text>
            </View>
            <Text className="text-xl font-black text-[#121c2a]">Something changed with Dad</Text>
            <Text className="text-xs text-[#708090] font-semibold leading-relaxed">
              “His activity has been below his usual level for five consecutive days.”
            </Text>
          </View>

          {/* Activity Trend Line Chart */}
          <View className="bg-white border border-[#e2dfd9] rounded-3xl p-5 shadow-sm space-y-3.5">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-[10px] font-bold text-slate-400 uppercase">
                  Recent Activity Trend
                </Text>
                <Text className="text-lg font-black text-slate-800 mt-0.5">2,100 steps today</Text>
              </View>
              <View className="bg-[#ffdad6] px-2.5 py-0.5 rounded-full">
                <Text className="text-[8px] font-black text-[#ba1a1a] uppercase">-45% drop</Text>
              </View>
            </View>

            <View className="h-28">
              <Svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                <Defs>
                  <LinearGradient id="grad-activity" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#ba1a1a" stopOpacity={0.25} />
                    <Stop offset="100%" stopColor="#ffffff" stopOpacity={0.0} />
                  </LinearGradient>
                </Defs>
                <Line x1="15" y1="15" x2="325" y2="15" stroke="#eff4ff" strokeWidth="1" />
                <Line x1="15" y1="55" x2="325" y2="55" stroke="#eff4ff" strokeWidth="1" />
                <Line x1="15" y1="95" x2="325" y2="95" stroke="#eff4ff" strokeWidth="1" />
                {areaD ? <Path d={areaD} fill="url(#grad-activity)" /> : null}
                {pathD ? <Path d={pathD} fill="none" stroke="#ba1a1a" strokeWidth="2.5" /> : null}
                {points.map((pt, idx) => {
                  const [x, y] = pt.split(',').map(parseFloat);
                  return (
                    <Circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#ba1a1a"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </Svg>
            </View>
            <View className="flex-row justify-between text-[8px] text-slate-400 font-bold uppercase px-1">
              <Text className="text-[8px] text-slate-400">5 days ago</Text>
              <Text className="text-[8px] text-slate-400 font-black text-[#ba1a1a]">Today</Text>
            </View>
          </View>

          {/* Section: What I noticed */}
          <View className="space-y-2">
            <Text className="text-sm font-black text-slate-800 uppercase tracking-wider">
              What I noticed
            </Text>
            <View className="bg-white border border-[#e2dfd9] rounded-3xl p-5 shadow-sm">
              <Text className="text-xs text-slate-600 leading-relaxed font-semibold">
                Ramesh's smart sensor activity logged a decline from 5,800 steps to 2,100 steps.
                Concurrently, outdoor local temperatures in Chennai peaked at 38°C, indicating he is
                likely resting indoors to avoid heat exhaustion. Adherence checklist remains stable.
              </Text>
            </View>
          </View>

          {/* Section: Data considered */}
          <View className="space-y-2">
            <Text className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Data considered
            </Text>
            <View className="bg-white border border-[#e2dfd9] rounded-3xl p-5 shadow-sm space-y-3.5">
              <View className="flex-row items-center justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs font-bold text-slate-800">
                  Apple Watch Activity Streams
                </Text>
                <Text className="text-xs font-black text-slate-900">17 readings</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-slate-800">Historical Activity Range</Text>
                <Text className="text-xs font-black text-slate-900">30-day baseline</Text>
              </View>
            </View>
          </View>

          {/* Section: What you can do */}
          <View className="space-y-3 mb-12">
            <Text className="text-sm font-black text-slate-800 uppercase tracking-wider">
              What you can do
            </Text>

            {/* Check in */}
            <TouchableOpacity
              onPress={() => {
                context.setCheckInOpen(true);
                router.replace('/(coordinator)');
              }}
              className="bg-white border border-[#e2dfd9] rounded-3xl p-4.5 flex-row items-center justify-between shadow-xs active:scale-99"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-[#f4effc] items-center justify-center">
                  <Phone size={14} color="#2a14b4" fill="#2a14b4" />
                </View>
                <View className="space-y-0.5">
                  <Text className="text-xs font-black text-slate-800">Check in with Dad</Text>
                  <Text className="text-[10px] text-slate-400 font-semibold">
                    Initiate a voice call or wellbeing check
                  </Text>
                </View>
              </View>
              <ChevronRight size={14} color="#708090" />
            </TouchableOpacity>

            {/* Contact caregiver */}
            <TouchableOpacity
              onPress={() => router.push('/care')}
              className="bg-white border border-[#e2dfd9] rounded-3xl p-4.5 flex-row items-center justify-between shadow-xs active:scale-99"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-[#ecfdf5] items-center justify-center">
                  <MessageSquare size={14} color="#059669" />
                </View>
                <View className="space-y-0.5">
                  <Text className="text-xs font-black text-slate-800">Contact caregiver</Text>
                  <Text className="text-[10px] text-slate-400 font-semibold">
                    Ask Suresh or Priya to verify hydration status
                  </Text>
                </View>
              </View>
              <ChevronRight size={14} color="#708090" />
            </TouchableOpacity>

            {/* Review timeline */}
            <TouchableOpacity
              onPress={() => router.push('/records')}
              className="bg-white border border-[#e2dfd9] rounded-3xl p-4.5 flex-row items-center justify-between shadow-xs active:scale-99"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-[#eff4ff] items-center justify-center">
                  <Activity size={14} color="#2a14b4" />
                </View>
                <View className="space-y-0.5">
                  <Text className="text-xs font-black text-slate-800">Review health timeline</Text>
                  <Text className="text-[10px] text-slate-400 font-semibold">
                    Examine prior metabolic panel and BP syncs
                  </Text>
                </View>
              </View>
              <ChevronRight size={14} color="#708090" />
            </TouchableOpacity>
          </View>
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
