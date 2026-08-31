import { useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { AppContext } from '../../src/store/AppContext';
import { ParentBottomNavBar } from '../../src/components/Navigation';
import { DeviceFrame } from '../../src/components/DeviceFrame';
import { SimulatorControls } from '../../src/components/SimulatorControls';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';

export default function ParentMedicinesRoute() {
  const context = useContext(AppContext);
  const router = useRouter();

  if (!context) return null;

  // Filter for Dad's medicines
  const dadMeds = context.medications.filter((m) => m.personId === 'dad');

  return (
    <DeviceFrame>
      <View className="flex-1 relative bg-[#f2f2f7]">
        {/* Header */}
        <View className="bg-white pt-6 pb-5 px-6 border-b border-neutral-100 space-y-0.5">
          <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Ramesh's Daily Checklist
          </Text>
          <Text className="text-2xl font-bold text-neutral-900 tracking-tight">
            Today's Medicines
          </Text>
        </View>

        <ScrollView className="flex-1 p-5 space-y-5">
          {dadMeds.some((m) => m.id === 'rec-5' && m.status !== 'taken') && (
            <View className="bg-orange-50 border border-orange-100/50 rounded-2xl p-4 mb-1.5 shadow-sm">
              <Text className="text-sm font-bold text-neutral-800">
                {context.notifications.some(
                  (n) => n.recipient === 'parent' && n.category === 'medication_reminder' && !n.read
                )
                  ? 'Anjali sent you a reminder.'
                  : 'Did you take your evening medicine?'}
              </Text>
              <Text className="text-xs text-neutral-500 font-semibold leading-relaxed mt-1">
                {context.notifications.some(
                  (n) => n.recipient === 'parent' && n.category === 'medication_reminder' && !n.read
                )
                  ? 'Anjali wants to make sure you confirm your evening dose of Atorvastatin 20mg.'
                  : 'Please check your medication card below and confirm if you have taken your dinner doses.'}
              </Text>
            </View>
          )}

          <View className="space-y-4">
            {dadMeds.map((med) => {
              const isTaken = med.status === 'taken';
              return (
                <View
                  key={med.id}
                  className={`bg-white rounded-2xl p-5 shadow-sm shadow-neutral-100 space-y-4 border-l-4 ${
                    isTaken ? 'border-[#34c759]' : 'border-[#ff9500]'
                  }`}
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs font-semibold text-neutral-400">
                      {med.scheduledTime}
                    </Text>
                    <View
                      className={`px-3 py-1 rounded-full ${isTaken ? 'bg-[#34c759]' : 'bg-orange-50'}`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${isTaken ? 'text-white' : 'text-[#ff9500]'}`}
                      >
                        {isTaken ? '✓ Taken' : 'Upcoming'}
                      </Text>
                    </View>
                  </View>

                  <View className="space-y-1">
                    <Text className="text-3xl font-bold text-neutral-800 leading-none">
                      {med.name}
                    </Text>
                    <Text className="text-lg font-bold text-neutral-400 mt-1">{med.dose}</Text>
                  </View>

                  {!isTaken ? (
                    <TouchableOpacity
                      onPress={() => {
                        context.markMedicationTaken(med.id);
                        context.showToast(`${med.name} dose checked off successfully.`);
                      }}
                      className="w-full bg-[#007aff] py-3.5 rounded-xl items-center justify-center active:opacity-90 mt-2"
                    >
                      <Text className="text-white font-bold text-sm">Mark as taken</Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="w-full py-3 bg-emerald-50 rounded-xl items-center justify-center flex-row gap-2 mt-2">
                      <CheckCircle2 size={15} color="#34c759" />
                      <Text className="text-[#34c759] text-xs font-bold">
                        Dose logged in Care circle
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          <View className="h-28" />
        </ScrollView>

        <ParentBottomNavBar
          activeTab="medicines"
          onTabChange={(tab) => {
            if (tab === 'home') router.push('/(parent)');
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
