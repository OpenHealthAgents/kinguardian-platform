import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import {
  ArrowLeft,
  Watch,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  ShieldCheck
} from 'lucide-react-native';


interface ParentDevicesScreenProps {
  onBack?: () => void;
}

export const ParentDevicesScreen: React.FC<ParentDevicesScreenProps> = ({ onBack }) => {
  const [deviceConnected, setDeviceConnected] = useState(true);
  const [lastUpdatedText, setLastUpdatedText] = useState('8 minutes ago');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectingDeviceName, setConnectingDeviceName] = useState<string | null>(null);

  // ACTION 1: Reconnect / Refresh Device
  const handleReconnect = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdatedText('Just now');
      setDeviceConnected(true);
      Alert.alert(
        'Device updated',
        'Your watch is connected and your latest activity has been updated.'
      );
    }, 1200);
  };

  // ACTION 2: Connect a new device
  const handleSelectDeviceToConnect = (name: string) => {
    setConnectingDeviceName(name);
    setTimeout(() => {
      setConnectingDeviceName(null);
      setShowConnectModal(false);
      setDeviceConnected(true);
      setLastUpdatedText('Just now');
      Alert.alert(
        'Device connected',
        `Your ${name} is now connected. Your daily steps and rest will automatically update.`
      );
    }, 1500);
  };

  return (
    <ScrollView className="flex-1 bg-[#f8f9fa]">
      {/* Friendly, Large Top Header */}
      <View className="bg-white px-6 pt-6 pb-5 border-b border-slate-100">
        {onBack && (
          <TouchableOpacity onPress={onBack} className="flex-row items-center gap-2 mb-3">
            <ArrowLeft size={20} color="#007aff" />
            <Text className="text-sm font-bold text-[#007aff]">Back</Text>
          </TouchableOpacity>
        )}
        <Text className="text-2xl font-black text-slate-900 tracking-tight">
          My health devices
        </Text>
        <Text className="text-sm text-slate-500 font-medium mt-1">
          Your connected watches and health trackers
        </Text>
      </View>

      <View className="p-6 space-y-6">
        {/* ========================================================================= */}
        {/* CONNECTED DEVICE CARD (APPLE WATCH)                                       */}
        {/* ========================================================================= */}
        {deviceConnected ? (
          <View className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            {/* Watch Header & Status */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-4">
                <View className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 items-center justify-center">
                  <Watch size={34} color="#2a14b4" />
                </View>
                <View>
                  <Text className="text-xl font-black text-slate-900">
                    Apple Watch
                  </Text>
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <Text className="text-sm font-bold text-emerald-700">
                      Connected
                    </Text>
                  </View>
                </View>
              </View>

              <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center">
                <CheckCircle2 size={22} color="#059669" />
              </View>
            </View>

            {/* Last Updated Box */}
            <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Last updated
              </Text>
              <Text className="text-base font-black text-slate-800 mt-0.5">
                {lastUpdatedText}
              </Text>
            </View>

            {/* Reconnect Action Button */}
            <TouchableOpacity
              onPress={handleReconnect}
              disabled={isRefreshing}
              className="bg-slate-100 active:bg-slate-200 py-4 rounded-2xl flex-row items-center justify-center gap-2 border border-slate-200"
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#007aff" />
              ) : (
                <>
                  <RefreshCw size={18} color="#007aff" />
                  <Text className="text-base font-bold text-[#007aff]">
                    Reconnect device
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm items-center py-8 space-y-4">
            <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center">
              <Watch size={32} color="#94a3b8" />
            </View>
            <Text className="text-lg font-black text-slate-800">
              No device connected
            </Text>
            <Text className="text-xs text-slate-500 text-center px-4 font-medium">
              Connect your watch to share your daily steps and rest automatically with family.
            </Text>
          </View>
        )}

        {/* ========================================================================= */}
        {/* CONNECT A DEVICE BUTTON                                                   */}
        {/* ========================================================================= */}
        <TouchableOpacity
          onPress={() => setShowConnectModal(true)}
          className="bg-[#007aff] active:bg-[#0062cc] py-4.5 px-6 rounded-2xl shadow-sm flex-row items-center justify-center gap-2.5"
        >
          <PlusCircle size={20} color="#ffffff" />
          <Text className="text-white text-base font-black tracking-wide">
            Connect a device
          </Text>
        </TouchableOpacity>

        {/* Friendly Peace of Mind Note */}
        <View className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 flex-row items-center gap-3">
          <ShieldCheck size={22} color="#059669" />
          <Text className="text-xs text-emerald-900 font-medium flex-1 leading-relaxed">
            Your watch updates automatically in the background. Anjali can view your daily activity from London.
          </Text>
        </View>
      </View>

      {/* ========================================================================= */}
      {/* SIMPLE CONNECT MODAL                                                      */}
      {/* ========================================================================= */}
      <Modal
        visible={showConnectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConnectModal(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl p-6 space-y-5">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-lg font-black text-slate-900">
                Choose your device
              </Text>
              <TouchableOpacity
                onPress={() => setShowConnectModal(false)}
                className="p-2 bg-slate-100 rounded-full"
              >
                <Text className="text-xs font-bold text-slate-600">Cancel</Text>
              </TouchableOpacity>
            </View>

            {connectingDeviceName ? (
              <View className="py-8 items-center space-y-3">
                <ActivityIndicator size="large" color="#007aff" />
                <Text className="text-base font-bold text-slate-800">
                  Connecting to {connectingDeviceName}...
                </Text>
              </View>
            ) : (
              <View className="space-y-3">
                {[
                  { name: 'Apple Watch', desc: 'Works with your iPhone' },
                  { name: 'Garmin Watch', desc: 'Venu, Forerunner & Vivoactive' },
                  { name: 'Fitbit', desc: 'Charge, Inspire & Sense' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => handleSelectDeviceToConnect(item.name)}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex-row items-center justify-between active:bg-slate-100"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-xl bg-white border border-slate-200 items-center justify-center">
                        <Watch size={20} color="#007aff" />
                      </View>
                      <View>
                        <Text className="text-base font-bold text-slate-900">
                          {item.name}
                        </Text>
                        <Text className="text-xs text-slate-500 font-medium">
                          {item.desc}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs font-black text-[#007aff]">Connect</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
