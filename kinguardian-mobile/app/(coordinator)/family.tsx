import { useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { AppContext } from '../../src/store/AppContext';
import { BottomNavBar } from '../../src/components/Navigation';
import { DeviceFrame } from '../../src/components/DeviceFrame';
import { SimulatorControls } from '../../src/components/SimulatorControls';
import { useRouter } from 'expo-router';
import { ChevronRight, ArrowLeft, MapPin, Calendar, Pill, Clipboard } from 'lucide-react-native';

export default function FamilyCoordinationRoute() {
  const context = useContext(AppContext);
  const router = useRouter();

  if (!context) return null;

  const familyMembers = [
    {
      name: 'Anjali Sharma',
      location: 'London, UK',
      role: 'Primary Coordinator',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBjb58pDYmLPOvRb2C93qIwVmN3Z3qZ__ljM1T9ZSdVoVI9ovH8x3UkvVX2km1jcc-lJDB8XKVXGhKX0bZL8qDi2s9jgC8eOKs1TubpaykQObp6xTg11e7t9fDFBiO9G_knt_Iu91RQ6oYuQGrd_EwUBKvQprl0XXO1mrgZ2LripRVXQ9ztlZOQr21ScUbgnP5iva9lVWOYFTQ4E6180FpDmnFn1lhIDcG8awhKsT88RjoTEgkPxtmV',
      linkId: 'anjali'
    },
    {
      name: 'Rahul Sharma',
      location: 'Dubai, UAE',
      role: 'Sibling Sponsoring',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
      linkId: 'rahul'
    },
    {
      name: 'Priya',
      location: 'Bengaluru, India',
      role: 'Local Caregiver',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
      linkId: 'priya'
    }
  ];

  const assignments = [
    {
      task: "Dad's appointment",
      assignee: 'Priya',
      icon: Calendar,
      color: '#ff3b30',
      bgColor: '#fff5f5'
    },
    {
      task: 'Medication coordination',
      assignee: 'Anjali Sharma',
      icon: Pill,
      color: '#007aff',
      bgColor: '#eff6ff'
    },
    {
      task: 'Lab report pickup',
      assignee: 'Rahul Sharma',
      icon: Clipboard,
      color: '#ff9500',
      bgColor: '#fff9e6'
    }
  ];

  return (
    <DeviceFrame>
      <View className="flex-1 relative bg-[#f2f2f7]">
        {/* Header */}
        <View className="px-6 py-5 border-b border-neutral-100 bg-white flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-1 bg-neutral-100 rounded-full active:scale-90"
          >
            <ArrowLeft size={18} color="#8e8e93" />
          </TouchableOpacity>
          <View>
            <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Care Task Responsibility Mapping
            </Text>
            <Text className="text-xl font-bold text-neutral-900 tracking-tight mt-0.5">
              Family Coordination
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-5 pt-4 space-y-5">
          {/* Members List Inset Grouped */}
          <View className="space-y-2">
            <Text className="text-xs font-bold uppercase text-neutral-400 tracking-wider pl-1">
              Care Circle Network
            </Text>

            <View className="bg-white border border-neutral-100 rounded-2xl shadow-sm divide-y divide-neutral-200/80 overflow-hidden">
              {familyMembers.map((member) => (
                <TouchableOpacity
                  key={member.name}
                  onPress={() => router.push(`/caregiver/${member.linkId}`)}
                  className="p-4 flex-row items-center justify-between active:bg-neutral-50"
                >
                  <View className="flex-row items-center gap-3">
                    <Image source={{ uri: member.avatar }} className="w-10 h-10 rounded-full" />
                    <View>
                      <Text className="text-xs font-bold text-neutral-800">{member.name}</Text>
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <MapPin size={10} color="#8e8e93" />
                        <Text className="text-[10px] text-neutral-400 font-semibold">
                          {member.location}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="bg-blue-50 px-2.5 py-0.5 rounded-full">
                      <Text className="text-[8px] font-bold text-[#007aff] uppercase">
                        {member.role}
                      </Text>
                    </View>
                    <ChevronRight size={14} color="#8e8e93" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Responsibility matrix Inset Grouped */}
          <View className="space-y-2 mt-5">
            <Text className="text-xs font-bold uppercase text-neutral-400 tracking-wider pl-1">
              Responsibility Mapping
            </Text>

            <View className="bg-white border border-neutral-100 rounded-2xl shadow-sm divide-y divide-neutral-200/80 overflow-hidden">
              {assignments.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <View key={idx} className="p-4 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: item.bgColor }}
                      >
                        <IconComponent size={14} color={item.color} />
                      </View>
                      <Text className="text-xs font-bold text-neutral-800">{item.task}</Text>
                    </View>
                    <View className="bg-neutral-100 px-3 py-1 rounded-full">
                      <Text className="text-[9px] font-bold text-neutral-600">
                        &rarr; {item.assignee}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Chat Launcher CTA */}
          <TouchableOpacity
            onPress={() => router.push('/family-chat')}
            className="w-full bg-[#007aff] py-3.5 rounded-xl flex-row items-center justify-center gap-2 active:opacity-90 shadow-sm mt-3"
          >
            <Text className="text-white font-bold text-sm">Open Family Chat</Text>
          </TouchableOpacity>

          <View className="h-28" />
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
