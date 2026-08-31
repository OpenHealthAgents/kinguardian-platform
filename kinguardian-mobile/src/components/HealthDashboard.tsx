import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Activity,
  Calendar,
  Pill,
  Upload,
  Sparkles,
  Clock,
  AlertTriangle,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Bell
} from 'lucide-react-native';
import { HealthObservation, Person } from '../types';
import { formatTimeForCoordinator } from '../utils/timezone';

interface HealthDashboardProps {
  observation: HealthObservation;
  people: Person[];
  currentPersonId: string;
  onSelectPerson: (personId: string) => void;
  onViewTransparency: () => void;
  onOpenCheckIn: () => void;
  onAddContext: () => void;
  onTalkToDoctor: () => void;
  onOpenQuickActions: (tab?: 'menu' | 'log_bp' | 'add_med' | 'add_context' | 'add_appt') => void;
  onViewVitalDetail: (type: 'bp' | 'glucose') => void;
  currentBP: string;
  currentGlucose: string;
  isAtorvastatinTaken: boolean;
  onRemindDad: () => void;
  onContactCaregiver: () => void;
  onViewMedication: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  currentScenario?: string;
  onCheckInWithDad?: () => void;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({
  people,
  onViewTransparency,
  onOpenCheckIn,
  onTalkToDoctor,
  onOpenQuickActions,
  onViewVitalDetail,
  currentBP,
  isAtorvastatinTaken,
  onOpenNotifications,
  unreadCount,
  currentScenario = 'normal',
  onCheckInWithDad
}) => {
  const router = useRouter();
  const bpSystolic = parseInt(currentBP.split('/')[0] || '120', 10);
  const needsAttention = bpSystolic >= 140;
  const dad = people.find((p) => p.id === 'dad') || people[0];
  const mom = people.find((p) => p.id === 'mom') || people[1];

  // Dynamic feeling mapping
  let feelingText = 'Good';
  if (dad.currentStatus?.toLowerCase().includes('tired')) {
    feelingText = 'Okay';
  } else if (dad.currentStatus?.toLowerCase().includes('unwell')) {
    feelingText = 'Not well';
  }

  return (
    <View className="flex-1 bg-[#f2f2f7]">
      {/* Header Profile / Timezone translation */}
      <View className="w-full bg-white border-b border-neutral-100 pt-6 pb-5 px-6 space-y-3.5">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Coordinator Portal
            </Text>
            <Text className="text-2xl font-bold text-neutral-900 tracking-tight mt-0.5">
              Good morning, Anjali
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={onOpenNotifications}
              className="w-9 h-9 bg-neutral-100 rounded-full items-center justify-center relative active:scale-95"
            >
              <Bell size={16} color="#007aff" />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-[#ff3b30] w-4.5 h-4.5 rounded-full items-center justify-center border border-white">
                  <Text className="text-white text-[8px] font-bold">{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onOpenQuickActions('menu')}
              className="w-9 h-9 bg-neutral-100 rounded-full items-center justify-center active:scale-95"
            >
              <Clock size={16} color="#007aff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Translation Pills */}
        <View className="flex-row items-center gap-2.5">
          <View className="flex-row items-center gap-1.5 bg-[#eff6ff] px-3.5 py-1.5 rounded-full">
            <MapPin size={10} color="#007aff" />
            <Text className="text-[10px] font-semibold text-[#007aff]">You — London (BST)</Text>
          </View>
          <View className="flex-row items-center gap-1.5 bg-[#eefdf4] px-3.5 py-1.5 rounded-full">
            <MapPin size={10} color="#34c759" />
            <Text className="text-[10px] font-semibold text-[#34c759]">
              Parents — Chennai (IST)
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-4 space-y-5">
        {/* Today's Attention Alert Section */}
        <View className="space-y-2">
          <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wider pl-1">
            Today's Attention
          </Text>

          {currentScenario === 'parent-feeling-unwell' ? (
            /* Parent Feeling Unwell Urgent Card */
            <View className="bg-white rounded-2xl p-5 shadow-sm shadow-neutral-100 space-y-3.5 border-l-4 border-[#ff3b30]">
              <View className="flex-row justify-between items-start">
                <View className="flex-row items-center gap-2">
                  <AlertTriangle size={15} color="#ff3b30" />
                  <Text className="text-xs font-bold text-neutral-800">
                    Dad reported feeling unwell
                  </Text>
                </View>
                <View className="bg-red-50 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[8px] font-bold text-[#ff3b30] uppercase">
                    Urgent Alert
                  </Text>
                </View>
              </View>

              <View className="space-y-1">
                <Text className="text-base font-bold text-neutral-900 tracking-tight">
                  Chest discomfort reported
                </Text>
                <Text className="text-xs text-neutral-500 leading-normal mt-0.5">
                  “Dad logged a check-in feeling Unwell: 'My chest feels uncomfortable.' (Today at
                  11:15 AM). Action advised.”
                </Text>
              </View>

              <View className="space-y-2 pt-1">
                <TouchableOpacity
                  onPress={() => alert('Dialing Chennai Caregiver Priya: +91 98400 12345')}
                  className="w-full bg-[#ff3b30] py-3 rounded-2xl items-center justify-center active:scale-95"
                >
                  <Text className="text-white text-xs font-bold">📞 Call Caregiver Priya</Text>
                </TouchableOpacity>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => router.push('/parent/dad/summary')}
                    className="flex-1 bg-neutral-100 py-3 rounded-2xl items-center justify-center active:scale-95"
                  >
                    <Text className="text-neutral-700 text-[10px] font-bold">
                      Emergency Summary
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push('/family-chat')}
                    className="flex-1 bg-neutral-100 py-3 rounded-2xl items-center justify-center active:scale-95"
                  >
                    <Text className="text-neutral-700 text-[10px] font-bold">Message Suresh</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : currentScenario === 'guardian-moment' ? (
            /* Guardian Moment Alert Card */
            <View className="bg-white rounded-2xl p-5 shadow-sm shadow-neutral-100 space-y-3 border-l-4 border-[#ff9500]">
              <View className="flex-row justify-between items-start">
                <View className="flex-row items-center gap-2">
                  <AlertTriangle size={15} color="#ff9500" />
                  <Text className="text-xs font-bold text-neutral-800">
                    Something changed with Dad
                  </Text>
                </View>
                <View className="bg-orange-50 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[8px] font-bold text-[#ff9500] uppercase">
                    AI Observation
                  </Text>
                </View>
              </View>

              <View className="space-y-1">
                <Text className="text-base font-bold text-neutral-900 tracking-tight">
                  Step activity decrease detected
                </Text>
                <Text className="text-xs text-neutral-500 leading-normal mt-0.5">
                  I noticed Dad's daily step count decreased to 1,200. This is different from Dad's
                  usual pattern. You may want to check in.
                </Text>
              </View>

              <View className="space-y-2 pt-1">
                <TouchableOpacity
                  onPress={onCheckInWithDad}
                  className="w-full bg-[#ff9500] py-3 rounded-2xl items-center justify-center active:scale-95"
                >
                  <Text className="text-white text-xs font-bold uppercase tracking-wider">
                    Check in with Dad
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onViewTransparency}
                  className="w-full bg-neutral-50 py-3 rounded-2xl items-center justify-center border border-neutral-100 active:scale-95"
                >
                  <Text className="text-neutral-600 text-xs font-semibold">
                    Review Activity Trend
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : needsAttention ? (
            /* Traditional BP Alert Card */
            <View className="bg-white rounded-2xl p-5 shadow-sm shadow-neutral-100 space-y-3.5 border-l-4 border-[#ff3b30]">
              <View className="flex-row justify-between items-start">
                <View className="flex-row items-center gap-2">
                  <AlertTriangle size={15} color="#ff3b30" />
                  <Text className="text-xs font-bold text-neutral-800">Vitals threshold alert</Text>
                </View>
                <View className="bg-red-50 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[8px] font-bold text-[#ff3b30] uppercase">Attention</Text>
                </View>
              </View>

              <View className="space-y-1">
                <Text className="text-base font-bold text-neutral-900 tracking-tight">
                  Blood pressure is {currentBP} mmHg
                </Text>
                <Text className="text-xs text-neutral-500 leading-normal">
                  “His recent readings have been above his usual range.”
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => onViewVitalDetail('bp')}
                className="w-full bg-[#ff3b30] py-3 rounded-2xl items-center justify-center active:scale-95"
              >
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Review Vitals
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Anxiety-reducing Calming Reassurance Card */
            <View className="bg-white rounded-2xl p-5 shadow-sm shadow-neutral-100 space-y-3 border-l-4 border-[#34c759]">
              <View className="flex-row items-center gap-2">
                <CheckCircle2 size={15} color="#34c759" />
                <Text className="text-xs font-bold text-[#34c759]">All Statuses Optimal</Text>
              </View>

              <View className="space-y-1">
                <Text className="text-sm font-bold text-neutral-900">
                  “Nothing needs your attention right now.”
                </Text>
                <Text className="text-xs text-neutral-400 leading-normal">
                  Mom and Dad's recent information looks consistent with their usual patterns.
                </Text>
              </View>

              <View className="pt-2 border-t border-neutral-100 flex-row items-center justify-between">
                <Text className="text-[9px] font-bold text-neutral-400">
                  Connected devices synced
                </Text>
                <Text className="text-[9px] font-bold text-neutral-400">
                  Last updated: Just now
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Parents Profiles Focus Switcher */}
        <View className="space-y-2">
          <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wider pl-1">
            Family Members
          </Text>
          <View className="space-y-2">
            {/* Dad Profile Card */}
            <TouchableOpacity
              onPress={() => onViewVitalDetail('bp')}
              className="bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-sm shadow-neutral-100 active:scale-98"
            >
              <View className="flex-row items-center gap-3.5">
                <Image source={{ uri: dad.avatarUrl }} className="w-10 h-10 rounded-full" />
                <View className="space-y-0.5">
                  <Text className="text-sm font-bold text-neutral-900">{dad.name}</Text>
                  <Text
                    className={`text-[10px] font-semibold ${
                      dad.wellbeingStatus === 'attention' ? 'text-[#ff3b30]' : 'text-[#34c759]'
                    }`}
                  >
                    {dad.wellbeingStatus === 'attention'
                      ? 'Needs attention (BP Variance)'
                      : 'Doing well • Vitals stable'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#8e8e93" />
            </TouchableOpacity>

            {/* Mom Profile Card */}
            <TouchableOpacity
              onPress={() => onViewVitalDetail('glucose')}
              className="bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-sm shadow-neutral-100 active:scale-98"
            >
              <View className="flex-row items-center gap-3.5">
                <Image source={{ uri: mom.avatarUrl }} className="w-10 h-10 rounded-full" />
                <View className="space-y-0.5">
                  <Text className="text-sm font-bold text-neutral-900">{mom.name}</Text>
                  <Text
                    className={`text-[10px] font-semibold ${
                      mom.wellbeingStatus === 'attention' ? 'text-[#ff3b30]' : 'text-[#34c759]'
                    }`}
                  >
                    {mom.wellbeingStatus === 'attention'
                      ? 'Needs attention (Glucose Variance)'
                      : 'Doing well • Vitals stable'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#8e8e93" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Care Checklist */}
        <View className="space-y-2">
          <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wider pl-1">
            Today's Care tasks
          </Text>

          <View className="bg-white rounded-2xl p-5 shadow-sm shadow-neutral-100 space-y-4">
            {/* Meds task */}
            <View className="flex-row items-start gap-3">
              <View className="w-8 h-8 rounded-full bg-[#eff6ff] items-center justify-center shrink-0">
                <Pill size={14} color="#007aff" />
              </View>
              <View className="flex-1 space-y-0.5">
                <Text className="text-xs font-bold text-neutral-800">Medication</Text>
                <Text className="text-[10px] text-neutral-400 font-semibold">
                  Atorvastatin 20mg • Evening dosage
                </Text>
              </View>
              <View
                className={`px-2.5 py-0.5 rounded-full ${isAtorvastatinTaken ? 'bg-emerald-50' : 'bg-orange-50'}`}
              >
                <Text
                  className={`text-[8px] font-bold uppercase ${isAtorvastatinTaken ? 'text-[#34c759]' : 'text-[#ff9500]'}`}
                >
                  {isAtorvastatinTaken ? 'Taken' : 'Pending'}
                </Text>
              </View>
            </View>

            {/* Appointment task */}
            <View className="flex-row items-start gap-3 border-t border-neutral-100 pt-3.5">
              <View className="w-8 h-8 rounded-full bg-rose-50 items-center justify-center shrink-0">
                <Calendar size={14} color="#ff3b30" />
              </View>
              <View className="flex-1 space-y-0.5">
                <Text className="text-xs font-bold text-neutral-800">Appointment</Text>
                <Text className="text-[10px] text-neutral-400 font-semibold">
                  Cardiology Video Visit •{' '}
                  {currentScenario === 'upcoming-appointment'
                    ? 'Tomorrow 4:00 PM IST'
                    : 'Tomorrow 10:30 AM'}
                </Text>
                {currentScenario === 'upcoming-appointment' && (
                  <TouchableOpacity
                    onPress={() => router.push('/parent/dad/prepare')}
                    className="bg-[#007aff] px-3.5 py-2 rounded-xl self-start mt-2 active:scale-95"
                  >
                    <Text className="text-white text-[10px] font-bold uppercase">
                      Prepare for appointment
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View className="bg-blue-50 px-2 py-0.5 rounded-full">
                <Text className="text-[8px] font-bold text-[#007aff] uppercase">Scheduled</Text>
              </View>
            </View>

            {/* Care Task item */}
            <View className="flex-row items-start gap-3 border-t border-neutral-100 pt-3.5">
              <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center shrink-0">
                <Activity size={14} color="#34c759" />
              </View>
              <View className="flex-1 space-y-0.5">
                <Text className="text-xs font-bold text-neutral-800">Care task</Text>
                <Text className="text-[10px] text-neutral-400 font-semibold">
                  Verify afternoon hydration checklist
                </Text>
              </View>
              <View className="bg-emerald-50 px-2 py-0.5 rounded-full">
                <Text className="text-[8px] font-bold text-[#34c759] uppercase">Suresh</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Updates History Log */}
        <View className="space-y-2">
          <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wider pl-1">
            Recent updates
          </Text>

          <View className="bg-white rounded-2xl p-5 shadow-sm shadow-neutral-100 space-y-4">
            {/* Update 1: Dad Checked In */}
            <View className="space-y-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-row items-center gap-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-[#007aff] shrink-0" />
                  <Text className="text-xs font-bold text-neutral-850">Dad checked in</Text>
                </View>
                <Text className="text-[10px] text-neutral-400 font-bold uppercase">
                  {formatTimeForCoordinator('2026-08-19T20:05:00+05:30')}
                </Text>
              </View>

              <View className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <Text className="text-xs text-neutral-700">
                  Feeling: <Text className="font-bold text-[#34c759]">{feelingText}</Text>
                </Text>
              </View>

              <View className="flex-row gap-2.5 pt-0.5">
                <TouchableOpacity
                  onPress={onOpenCheckIn}
                  className="flex-1 bg-[#eff6ff] py-2 rounded-xl items-center justify-center active:scale-95"
                >
                  <Text className="text-[10px] font-bold text-[#007aff] uppercase">Call Dad</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/ask')}
                  className="flex-1 bg-[#eff6ff] py-2 rounded-xl items-center justify-center active:scale-95"
                >
                  <Text className="text-[10px] font-bold text-[#007aff] uppercase">Message</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/records')}
                  className="flex-1 bg-[#eff6ff] py-2 rounded-xl items-center justify-center active:scale-95"
                >
                  <Text className="text-[10px] font-bold text-[#007aff] uppercase">History</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Update 2 */}
            <View className="flex-row items-start gap-3 border-t border-neutral-100 pt-3.5">
              <View className="w-1.5 h-1.5 rounded-full bg-[#34c759] mt-1.5 shrink-0" />
              <View className="flex-1 space-y-0.5">
                <Text className="text-xs font-bold text-neutral-850">Mom uploaded report</Text>
                <Text className="text-[10px] text-neutral-400 font-semibold">
                  Fasting metabolic profile panel uploaded • Yesterday
                </Text>
              </View>
            </View>

            {/* Update 3 */}
            <View className="flex-row items-start gap-3 border-t border-neutral-100 pt-3.5">
              <View className="w-1.5 h-1.5 rounded-full bg-[#ff9500] mt-1.5 shrink-0" />
              <View className="flex-1 space-y-0.5">
                <Text className="text-xs font-bold text-neutral-850">
                  Caregiver confirmed appointment
                </Text>
                <Text className="text-[10px] text-neutral-400 font-semibold">
                  Suresh Kumar verified hydration & indoor walking path • Today
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions Action Grid */}
        <View className="space-y-2 mb-12">
          <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wider pl-1">
            Quick Actions
          </Text>

          <View className="flex-row flex-wrap gap-2.5">
            {/* Ask AI */}
            <TouchableOpacity
              onPress={onTalkToDoctor}
              className="bg-white rounded-2xl p-4 items-center justify-center flex-1 min-w-[130px] shadow-sm shadow-neutral-100 active:scale-95 space-y-1.5"
            >
              <Sparkles size={16} color="#af52de" />
              <Text className="text-xs font-bold text-neutral-800 text-center">Ask AI</Text>
            </TouchableOpacity>

            {/* Upload report */}
            <TouchableOpacity
              onPress={() => onOpenQuickActions('menu')}
              className="bg-white rounded-2xl p-4 items-center justify-center flex-1 min-w-[130px] shadow-sm shadow-neutral-100 active:scale-95 space-y-1.5"
            >
              <Upload size={16} color="#34c759" />
              <Text className="text-xs font-bold text-neutral-800 text-center">Upload Lab</Text>
            </TouchableOpacity>

            {/* Add Appt */}
            <TouchableOpacity
              onPress={() => onOpenQuickActions('add_appt')}
              className="bg-white rounded-2xl p-4 items-center justify-center flex-1 min-w-[130px] shadow-sm shadow-neutral-100 active:scale-95 space-y-1.5"
            >
              <Calendar size={16} color="#ff3b30" />
              <Text className="text-xs font-bold text-neutral-800 text-center">Add Appt</Text>
            </TouchableOpacity>

            {/* Add Med */}
            <TouchableOpacity
              onPress={() => onOpenQuickActions('add_med')}
              className="bg-white rounded-2xl p-4 items-center justify-center flex-1 min-w-[130px] shadow-sm shadow-neutral-100 active:scale-95 space-y-1.5"
            >
              <Pill size={16} color="#ff9500" />
              <Text className="text-xs font-bold text-neutral-800 text-center">Add Med</Text>
            </TouchableOpacity>
          </View>
          <View className="h-28" />
        </View>
      </ScrollView>
    </View>
  );
};
