import { useContext, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { AppContext } from '../../src/store/AppContext';
import { DeviceFrame } from '../../src/components/DeviceFrame';
import { SimulatorControls } from '../../src/components/SimulatorControls';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, Sparkles, FileText, Calendar } from 'lucide-react-native';

export default function FamilyCommunicationRoute() {
  const context = useContext(AppContext);
  const router = useRouter();

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'Anjali',
      role: 'Primary Coordinator',
      avatarColor: '#007aff',
      message: 'Dad has his cardiology appointment tomorrow.',
      time: '10:15 AM'
    },
    {
      sender: 'Priya',
      role: 'Caregiver',
      avatarColor: '#34c759',
      message: "I'll take him.",
      time: '10:18 AM'
    },
    {
      sender: 'KinGuardian',
      role: 'System Copilot',
      avatarColor: '#af52de',
      message: "Dad's latest medication and BP summary is ready.",
      time: '10:20 AM',
      isSystem: true
    }
  ]);

  if (!context) return null;

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        sender: 'Anjali',
        role: 'Primary Coordinator',
        avatarColor: '#007aff',
        message: chatInput,
        time: 'Just now'
      }
    ]);
    setChatInput('');
    context.showToast('Message sent to Family Circle.');
  };

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
              Care Circle Chat Log
            </Text>
            <Text className="text-xl font-bold text-neutral-900 tracking-tight mt-0.5">
              Family Chat
            </Text>
          </View>
        </View>

        {/* Chat Feed */}
        <ScrollView className="flex-1 px-5 pt-4 space-y-4">
          <View className="space-y-4 pb-28">
            {messages.map((msg, idx) => {
              if (msg.isSystem) {
                return (
                  <View
                    key={idx}
                    className="bg-purple-50/70 border border-purple-100/50 rounded-2xl p-5 space-y-3 shadow-xs"
                  >
                    <View className="flex-row items-center gap-2">
                      <Sparkles size={14} color="#af52de" fill="#af52de" />
                      <Text className="text-[10px] font-bold text-[#af52de] uppercase tracking-wider">
                        KinGuardian Copilot
                      </Text>
                    </View>

                    <Text className="text-xs font-semibold text-neutral-700 leading-relaxed">
                      {msg.message}
                    </Text>

                    {/* Special In-bubble CTA Buttons */}
                    <View className="flex-row gap-2 pt-1">
                      <TouchableOpacity
                        onPress={() => router.push('/parent/dad/summary')}
                        className="flex-1 bg-white border border-neutral-200 py-2.5 rounded-xl flex-row items-center justify-center gap-1 active:opacity-90 shadow-xs"
                      >
                        <FileText size={10} color="#af52de" />
                        <Text className="text-[9px] font-bold text-[#af52de] uppercase">
                          View Summary
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => router.push('/parent/dad/prepare')}
                        className="flex-1 bg-white border border-neutral-200 py-2.5 rounded-xl flex-row items-center justify-center gap-1 active:opacity-90 shadow-xs"
                      >
                        <Calendar size={10} color="#af52de" />
                        <Text className="text-[9px] font-bold text-[#af52de] uppercase">
                          Prepare Appointment
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }

              const isMe = msg.sender === 'Anjali';
              return (
                <View
                  key={idx}
                  className={`flex-row gap-3 ${isMe ? 'flex-row-reverse' : ''} items-start`}
                >
                  {/* Avatar Circle */}
                  <View
                    style={{ backgroundColor: msg.avatarColor }}
                    className="w-8 h-8 rounded-full items-center justify-center shrink-0 shadow-xs"
                  >
                    <Text className="text-white text-xs font-bold">{msg.sender.charAt(0)}</Text>
                  </View>

                  <View className={`space-y-1 max-w-[75%] ${isMe ? 'items-end' : ''}`}>
                    <View className="flex-row items-center gap-1.5 px-0.5">
                      <Text className="text-[9px] font-bold text-neutral-800">{msg.sender}</Text>
                      <Text className="text-[8px] text-neutral-400 font-semibold">{msg.time}</Text>
                      {isMe && <Text className="text-[9px] text-[#007aff] font-bold">✓✓</Text>}
                    </View>
                    <View
                      className={`p-3.5 rounded-2xl ${
                        isMe
                          ? 'bg-[#007aff] rounded-tr-none'
                          : 'bg-white border border-neutral-100 rounded-tl-none'
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold leading-relaxed ${
                          isMe ? 'text-white' : 'text-neutral-700'
                        }`}
                      >
                        {msg.message}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Chat input box at the bottom */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200/80 p-4 pb-6 flex-row items-center gap-2">
          <TextInput
            placeholder="Message Care circle..."
            placeholderTextColor="#8e8e93"
            value={chatInput}
            onChangeText={setChatInput}
            className="flex-1 bg-neutral-100 border border-neutral-200/50 rounded-full px-4 py-2.5 text-xs text-neutral-800 font-semibold"
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            className="w-9 h-9 rounded-full bg-[#007aff] items-center justify-center active:scale-95 shadow-sm"
          >
            <Send size={12} color="#ffffff" />
          </TouchableOpacity>
        </View>
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
