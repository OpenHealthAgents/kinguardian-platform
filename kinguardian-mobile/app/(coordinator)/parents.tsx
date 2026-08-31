import { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, TextInput } from 'react-native';
import { AppContext } from '../../src/store/AppContext';
import { BottomNavBar } from '../../src/components/Navigation';
import { DeviceFrame } from '../../src/components/DeviceFrame';
import { SimulatorControls } from '../../src/components/SimulatorControls';
import { useRouter } from 'expo-router';
import { ChevronRight, Clock, Pill, Calendar, Plus, X, UserPlus } from 'lucide-react-native';

export default function CoordinatorParentsRoute() {
  const context = useContext(AppContext);
  const router = useRouter();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState('Father');
  const [newCity, setNewCity] = useState('Chennai');
  const [newAge, setNewAge] = useState('68');

  if (!context) return null;

  const handleCreateParent = async () => {
    if (!newName.trim()) return;
    await context.addParent({
      name: newName.trim(),
      relationship: newRelationship,
      city: newCity.trim() || 'Chennai',
      age: parseInt(newAge, 10) || 65
    });
    setNewName('');
    setAddModalOpen(false);
  };

  return (
    <DeviceFrame>
      <View className="flex-1 relative bg-[#f2f2f7]">
        {/* Header */}
        <View className="px-6 py-5 border-b border-neutral-100 bg-white flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Connected Profiles
            </Text>
            <Text className="text-2xl font-bold text-neutral-900 tracking-tight mt-0.5">Parents</Text>
          </View>

          <TouchableOpacity
            onPress={() => setAddModalOpen(true)}
            activeOpacity={0.8}
            className="flex-row items-center gap-1.5 bg-[#007aff] px-3.5 py-2 rounded-xl shadow-xs"
          >
            <Plus size={14} color="#ffffff" strokeWidth={2.5} />
            <Text className="text-white text-xs font-bold">Add Parent</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-4 space-y-4">
          {context.people.map((p) => {
            const isActive = context.currentPersonId === p.id;
            const isDad = p.id === 'dad' || p.relation?.toLowerCase() === 'father';

              // Vitals check for alert status
              const bpSystolic = parseInt(context.currentBP.split('/')[0] || '120', 10);
              const isDadSpiked = bpSystolic >= 140;
              const statusText = isDad
                ? isDadSpiked
                  ? 'Needs attention'
                  : 'Doing well'
                : 'Doing well';
              const statusColor =
                statusText === 'Needs attention'
                  ? 'text-[#ff3b30] bg-red-50'
                  : 'text-[#34c759] bg-emerald-50';

              // Meds check
              const isAtorvastatinTaken =
                context.records
                  .find((r) => r.id === 'rec-5')
                  ?.status?.toLowerCase()
                  .includes('taken') || false;
              const medStatus = isDad ? (isAtorvastatinTaken ? 'Taken' : '1 pending') : 'Taken';

              // Appointment check
              const nextAppt = isDad
                ? 'Cardiology, Tomorrow 10:30 AM'
                : 'Endocrinology, Next Monday 4:00 PM';

              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => {
                    context.setCurrentPersonId(p.id);
                    context.showToast(`Switched active focus to ${p.name}`);
                    router.push('/(coordinator)');
                  }}
                  activeOpacity={0.8}
                  className={`bg-white rounded-2xl p-5 border ${
                    isActive ? 'border-[#007aff]' : 'border-neutral-100'
                  } shadow-sm flex-row items-start gap-4`}
                >
                  <View className="relative">
                    <Image source={{ uri: p.avatarUrl }} className="w-12 h-12 rounded-full" />
                    <View
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        isDad ? (isDadSpiked ? 'bg-[#ff3b30]' : 'bg-[#34c759]') : 'bg-[#34c759]'
                      }`}
                    />
                  </View>

                  <View className="flex-1 space-y-2">
                    <View className="flex-row items-center justify-between flex-wrap gap-1">
                      <View className="space-y-0.5">
                        <Text className="text-base font-bold text-neutral-900 leading-none">
                          {p.name}
                        </Text>
                        <Text className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                          {p.age} • {isDad ? 'Dad' : 'Mom'} • Chennai
                        </Text>
                      </View>

                      <View className={`px-2 py-0.5 rounded-full ${statusColor}`}>
                        <Text className="text-[8px] font-bold uppercase">{statusText}</Text>
                      </View>
                    </View>

                    {/* Vitals detail list stubs */}
                    <View className="space-y-1.5 pt-2 border-t border-neutral-100">
                      <View className="flex-row items-center gap-1.5">
                        <Clock size={11} color="#8e8e93" />
                        <Text className="text-[10px] text-neutral-500 font-semibold">
                          Last check-in: {isDad ? '1 hour ago' : 'Yesterday 6:30 PM'}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1.5">
                        <Pill size={11} color="#8e8e93" />
                        <Text className="text-[10px] text-neutral-500 font-semibold">
                          Medication status:{' '}
                          <Text
                            className={
                              medStatus === 'Taken'
                                ? 'text-[#34c759] font-bold'
                                : 'text-[#ff9500] font-bold'
                            }
                          >
                            {medStatus}
                          </Text>
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1.5">
                        <Calendar size={11} color="#8e8e93" />
                        <Text className="text-[10px] text-neutral-500 font-semibold">
                          Next: {nextAppt}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="self-center pl-1">
                    <ChevronRight size={16} color={isActive ? '#007aff' : '#8e8e93'} />
                  </View>
                </TouchableOpacity>
              );
            })}

          <View className="h-24" />
        </ScrollView>

        <BottomNavBar
          activeTab="parents"
          currentScreen="health_dashboard"
          onTabChange={(tab) => {
            if (tab === 'home') router.push('/(coordinator)');
            else if (tab === 'parents') router.push('/parents');
            else if (tab === 'ask') context.setAskAIOpen(true);
            else if (tab === 'care') router.push('/care');
            else if (tab === 'profile') router.push('/profile');
          }}
          onOpenQuickActions={() => context.setQuickActionsOpen(true)}
          onOpenAskAI={() => context.setAskAIOpen(true)}
        />

        {/* Add Parent Modal */}
        <Modal
          visible={addModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAddModalOpen(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/60 px-6">
            <View className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-neutral-100 space-y-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <UserPlus size={18} color="#007aff" />
                  <Text className="text-base font-bold text-neutral-900">Add Parent Profile</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAddModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-neutral-100 items-center justify-center"
                >
                  <X size={14} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View className="space-y-3">
                <View className="space-y-1">
                  <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Full Name
                  </Text>
                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="e.g. Ramesh Kumar"
                    placeholderTextColor="#8e8e93"
                    className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-800 focus:border-[#007aff]"
                  />
                </View>

                <View className="space-y-1">
                  <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Relationship
                  </Text>
                  <View className="flex-row gap-2">
                    {['Father', 'Mother', 'Grandparent'].map((rel) => (
                      <TouchableOpacity
                        key={rel}
                        onPress={() => setNewRelationship(rel)}
                        className={`flex-1 py-2 rounded-xl items-center border ${
                          newRelationship === rel
                            ? 'bg-[#eff6ff] border-[#007aff]'
                            : 'bg-neutral-50 border-neutral-200'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            newRelationship === rel ? 'text-[#007aff]' : 'text-neutral-600'
                          }`}
                        >
                          {rel}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1 space-y-1">
                    <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      Age
                    </Text>
                    <TextInput
                      value={newAge}
                      onChangeText={setNewAge}
                      placeholder="68"
                      keyboardType="numeric"
                      placeholderTextColor="#8e8e93"
                      className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-800 focus:border-[#007aff]"
                    />
                  </View>

                  <View className="flex-1 space-y-1">
                    <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      City (India)
                    </Text>
                    <TextInput
                      value={newCity}
                      onChangeText={setNewCity}
                      placeholder="Chennai"
                      placeholderTextColor="#8e8e93"
                      className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-800 focus:border-[#007aff]"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleCreateParent}
                  className="w-full bg-[#007aff] py-3 rounded-xl items-center justify-center mt-2 active:scale-95 shadow-sm"
                >
                  <Text className="text-white font-bold text-xs">Save & Connect to Database</Text>
                </TouchableOpacity>
              </View>
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
