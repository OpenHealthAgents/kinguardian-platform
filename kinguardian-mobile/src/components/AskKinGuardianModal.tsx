import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Sparkles, Send, X, FileText } from 'lucide-react-native';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  senderName: string;
  text: string;
  timestamp: string;
  citations?: string[];
  suggestedFollowUps?: string[];
}

interface AskKinGuardianModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  currentSubject: string;
}

export const AskKinGuardianModal: React.FC<AskKinGuardianModalProps> = ({
  isOpen,
  onClose,
  initialQuery,
  currentSubject
}) => {

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      senderName: 'KinGuardian AI',
      text: "Hello Anjali! I'm KinGuardian, your family's concierge medical AI. I continuously monitor Mom and Dad's vitals, activity data, and care team instructions. What would you like to review today?",
      timestamp: 'Just now',
      citations: ['Connected Devices: Omron BP, Apple Health, Dexcom G7'],
      suggestedFollowUps: [
        "When was Dad's last blood test?",
        "Why is Dad's blood pressure elevated?",
        'Did Mom take her meds today?',
        'Check upcoming doctor appointments'
      ]
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSend(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, isOpen]);

  const handleSend = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      senderName: 'Anjali',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      setTimeout(() => {
        let aiReplyText = '';
        const qLower = text.toLowerCase();

        if (
          qLower.includes('blood test') ||
          qLower.includes('last blood') ||
          qLower.includes('lab')
        ) {
          aiReplyText = `Dad's (Ramesh) last Comprehensive Metabolic Panel (CMP) was completed on **August 3, 2026** via Apollo Diagnostics in Chennai. All key markers were normal:\n\n• **eGFR**: 78 (Optimal)\n• **Creatinine**: 1.1 mg/dL\n• **Potassium**: 4.4 mmol/L\n\nReviewed and signed off by Dr. Ramesh Sharma.`;
        } else if (
          qLower.includes('med') ||
          qLower.includes('pill') ||
          qLower.includes('take') ||
          qLower.includes('today')
        ) {
          aiReplyText = `Here is today's medication status for Ramesh & Lakshmi:\n\n• **Dad (Ramesh)**: Taken morning Amlodipine 5mg at 8:15 AM IST. Evening Atorvastatin 20mg is scheduled for 8:00 PM IST.\n• **Mom (Lakshmi)**: Taken morning Metformin 500mg ER with breakfast. Evening dose is ready with dinner.\n\nAll logs verified by caregiver Suresh.`;
        } else if (
          qLower.includes('bp') ||
          qLower.includes('blood pressure') ||
          qLower.includes('activity')
        ) {
          aiReplyText = `**KinGuardian Clinical Reasoning Insight:**\n\nI noticed Dad's evening systolic readings increased by **12%** (averaging 138/88 mmHg) alongside a **35% drop in step activity** over the last 5 days. The data shows this is different from Dad's usual pattern.\n\n**Possible Contributing Factors:**\n1. Severe Chennai heat wave (39°C) limiting veranda afternoon walks.\n2. Overnight sleep quality variations.\n\n**Recommendations**: Check in with Priya/Suresh to verify hydration levels. You may want to discuss this with his doctor.`;

        } else if (
          qLower.includes('appointment') ||
          qLower.includes('doctor') ||
          qLower.includes('visit')
        ) {
          aiReplyText = `Upcoming Care Network Appointments:\n\n1. **Dad with Dr. Ramesh Sharma (Apollo Chennai)**: Aug 26, 2026 at 10:30 AM IST (Telehealth Video Visit for BP log review).\n2. **Mom with Dr. Sarah Chen**: Sept 5, 2026 at 2:00 PM IST (Diabetic ophthalmoscopy screening).`;
        } else {
          aiReplyText = `Based on Ramesh & Lakshmi's connected wearable streams:\n\n• **Dad's BP**: 138/88 mmHg (Omron Sync).\n• **Mom's Glucose**: 98 mg/dL (Dexcom G7 CGM).\n• **Care Status**: Daily medications marked taken. Suresh logged check-in 2 hrs ago.\n\nIs there a specific lab result, appointment, or symptom checklist you'd like me to analyze?`;
        }

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          senderName: 'KinGuardian AI',
          text: aiReplyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: [
            currentSubject === 'dad'
              ? 'Omron Blood Pressure Hub (12 readings)'
              : 'Dexcom G7 Bluetooth Stream',
            'Apple Health Steps & Activity log',
            'Caregiver Suresh Kumar Manual entries'
          ]
        };

        setMessages((prev) => [...prev, aiMsg]);
        setLoading(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-[28px] max-h-[85%] p-6 pt-3 space-y-4 shadow-xl">
          {/* iOS Grabber Handle */}
          <View className="w-10 h-1.5 bg-neutral-200 rounded-full self-center mb-1.5" />

          {/* Header */}
          <View className="flex-row justify-between items-center pb-2 border-b border-neutral-100">
            <View className="flex-row items-center gap-2">
              <Sparkles size={18} color="#af52de" fill="#af52de" />
              <Text className="text-lg font-bold text-neutral-900 tracking-tight">
                Ask KinGuardian AI
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="p-1.5 bg-neutral-100 rounded-full active:scale-90"
            >
              <X size={16} color="#8e8e93" />
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          <ScrollView
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            className="flex-1 space-y-4"
          >
            {messages.map((m) => {
              const isAi = m.sender === 'ai';
              return (
                <View
                  key={m.id}
                  className={`flex-row gap-2.5 max-w-[85%] ${isAi ? 'self-start' : 'self-end flex-row-reverse'}`}
                >
                  <View
                    className={`p-4 rounded-2xl space-y-1.5 ${
                      isAi ? 'bg-neutral-100 border border-neutral-200/50' : 'bg-[#007aff]'
                    }`}
                  >
                    <Text
                      className={`text-[9px] font-bold uppercase ${isAi ? 'text-[#af52de]' : 'text-blue-200'}`}
                    >
                      {m.senderName} • {m.timestamp}
                    </Text>
                    <Text
                      className={`text-xs md:text-sm leading-relaxed ${isAi ? 'text-neutral-800' : 'text-white'}`}
                    >
                      {m.text}
                    </Text>

                    {/* Citations */}
                    {isAi && m.citations && m.citations.length > 0 && (
                      <View className="pt-2 border-t border-neutral-200 mt-1.5 space-y-1">
                        <View className="flex-row items-center gap-1">
                          <FileText size={10} color="#8e8e93" />
                          <Text className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                            Citations &amp; Grounding
                          </Text>
                        </View>
                        {m.citations.map((cit, idx) => (
                          <Text key={idx} className="text-[9px] text-neutral-500 font-semibold">
                            &#8226; {cit}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {loading && (
              <View className="self-start bg-neutral-100 border border-neutral-200/50 p-4 rounded-2xl flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#af52de" />
                <Text className="text-xs font-semibold text-neutral-500">
                  KinGuardian is analyzing clinical logs...
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Suggested follow-up chips */}
          {!loading && messages[messages.length - 1]?.suggestedFollowUps && (
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} className="py-1">
              <View className="flex-row gap-2">
                {messages[messages.length - 1].suggestedFollowUps?.map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    onPress={() => handleSend(chip)}
                    className="bg-neutral-50 border border-neutral-200 rounded-full px-3.5 py-1.5 active:bg-neutral-100"
                  >
                    <Text className="text-[10px] font-semibold text-[#007aff]">{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Input Bar */}
          <View className="flex-row items-center bg-neutral-50 rounded-full p-1.5 gap-2 border border-neutral-200">
            <TextInput
              value={inputQuery}
              onChangeText={setInputQuery}
              placeholder="Ask KinGuardian medical questions..."
              placeholderTextColor="#8e8e93"
              className="flex-1 px-4 py-2.5 text-xs text-neutral-800 outline-none"
            />
            <TouchableOpacity
              onPress={() => handleSend(inputQuery)}
              className="w-9 h-9 rounded-full bg-[#007aff] items-center justify-center active:scale-95 shadow-sm"
            >
              <Send size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};


