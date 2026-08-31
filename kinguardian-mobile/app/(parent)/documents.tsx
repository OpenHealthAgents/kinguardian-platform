import { useContext, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { AppContext } from '../../src/store/AppContext';
import { ParentBottomNavBar } from '../../src/components/Navigation';
import { DeviceFrame } from '../../src/components/DeviceFrame';
import { SimulatorControls } from '../../src/components/SimulatorControls';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, Mic, Send, Eye, Ban } from 'lucide-react-native';

export default function ParentDocumentsRoute() {
  const context = useContext(AppContext);
  const router = useRouter();

  const [documentSource, setDocumentSource] = useState<'camera' | 'library' | 'voice' | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [showReview, setShowReview] = useState(false);

  if (!context) return null;

  const handleUpload = (source: 'camera' | 'library' | 'voice') => {
    setDocumentSource(source);
    setIsUploaded(true);
    setShowReview(false);
    context.showToast('Document scan uploaded. Ready to share.');
  };

  const handleSend = () => {
    let title = 'Health Paper';
    let summary = 'Document shared by Dad Ramesh.';
    if (documentSource === 'camera') {
      title = 'Prescription Snapshot';
      summary = 'Dad snapped a new prescription list image.';
    } else if (documentSource === 'library') {
      title = 'Lab Report Scan';
      summary = 'Dad shared a report copy from his library.';
    } else if (documentSource === 'voice') {
      title = 'Voice Consultation Memo';
      summary = 'Dad recorded doctor instructions voice note.';
    }

    // Insert doc to state
    context.handleUploadDocument({
      id: `doc-${Date.now()}`,
      name: title,
      category: 'Parent Upload',
      date: 'Today',
      status: 'parsed',
      summary: summary,
      uploader: 'Ramesh (Parent)',
      fileSize: '1.4 MB'
    });

    context.showToast('Sent! Anjali has been updated.');

    // Reset state
    setDocumentSource(null);
    setIsUploaded(false);
    setShowReview(false);

    // Redirect to home dashboard
    router.push('/(parent)');
  };

  const handleCancel = () => {
    setDocumentSource(null);
    setIsUploaded(false);
    setShowReview(false);
    context.showToast('Upload cancelled.');
  };

  return (
    <DeviceFrame>
      <View className="flex-1 relative bg-[#fffbeb]">
        {/* Header */}
        <View className="bg-[#d97706] pt-6 pb-5 px-6 border-b-4 border-[#b45309] space-y-1">
          <Text className="text-2xl font-black text-white uppercase tracking-wider">
            Send a health document
          </Text>
          <Text className="text-xs font-bold text-[#fef3c7] uppercase tracking-widest">
            Share records with Anjali
          </Text>
        </View>

        <ScrollView className="flex-1 p-6 space-y-6">
          {!isUploaded ? (
            <View className="space-y-4">
              <Text className="text-sm font-black text-slate-500 uppercase tracking-wide">
                Choose document to send:
              </Text>

              {/* Take a Photo */}
              <TouchableOpacity
                onPress={() => handleUpload('camera')}
                className="w-full bg-white border-4 border-amber-300 rounded-[32px] p-6 flex-row items-center gap-5 shadow-xs active:scale-98"
              >
                <View className="w-14 h-14 bg-rose-50 rounded-2xl items-center justify-center border-2 border-rose-100 shrink-0">
                  <Camera size={26} color="#ba1a1a" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-black text-slate-900">Take a photo</Text>
                  <Text className="text-xs font-bold text-slate-400 mt-0.5 leading-snug">
                    Use camera to snap prescriptions or receipts
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Choose a Photo */}
              <TouchableOpacity
                onPress={() => handleUpload('library')}
                className="w-full bg-white border-4 border-amber-300 rounded-[32px] p-6 flex-row items-center gap-5 shadow-xs active:scale-98"
              >
                <View className="w-14 h-14 bg-emerald-50 rounded-2xl items-center justify-center border-2 border-emerald-100 shrink-0">
                  <ImageIcon size={26} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-black text-slate-900">Choose a photo</Text>
                  <Text className="text-xs font-bold text-slate-400 mt-0.5 leading-snug">
                    Pick a photo or document from your gallery
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Record a Voice Note */}
              <TouchableOpacity
                onPress={() => handleUpload('voice')}
                className="w-full bg-white border-4 border-amber-300 rounded-[32px] p-6 flex-row items-center gap-5 shadow-xs active:scale-98"
              >
                <View className="w-14 h-14 bg-[#f4effc] rounded-2xl items-center justify-center border-2 border-[#dee9fc] shrink-0">
                  <Mic size={26} color="#2a14b4" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-black text-slate-900">Record a voice note</Text>
                  <Text className="text-xs font-bold text-slate-400 mt-0.5 leading-snug">
                    Speak clearly to describe what the doctor said
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            /* Uploaded Confirmation Block */
            <View className="bg-white border-4 border-amber-300 rounded-[32px] p-6 shadow-sm space-y-6">
              <View className="items-center text-center space-y-1">
                <Text className="text-base font-black text-slate-500 uppercase tracking-widest">
                  Upload Complete
                </Text>
                <Text className="text-xl font-black text-slate-900 text-center px-2">
                  “Would you like to send this to Anjali?”
                </Text>
              </View>

              {/* Preview Block if Review clicked */}
              {showReview && (
                <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Preview Ingest
                  </Text>
                  {documentSource === 'voice' ? (
                    <Text className="text-xs font-bold text-slate-700 italic">
                      🎙️ Audio transcription file ready to transmit.
                    </Text>
                  ) : (
                    <Text className="text-xs font-bold text-slate-700 italic">
                      📷 Document snapshot image ready to transmit.
                    </Text>
                  )}
                </View>
              )}

              {/* Core Actions list */}
              <View className="space-y-3">
                <TouchableOpacity
                  onPress={handleSend}
                  className="w-full bg-[#059669] py-4 rounded-2xl flex-row items-center justify-center gap-2 active:scale-95 shadow-md"
                >
                  <Send size={16} color="#ffffff" />
                  <Text className="text-white font-black text-sm uppercase tracking-widest">
                    Send
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowReview(!showReview)}
                  className="w-full bg-slate-100 border border-slate-200 py-4 rounded-2xl flex-row items-center justify-center gap-2 active:scale-95"
                >
                  <Eye size={16} color="#708090" />
                  <Text className="text-slate-600 font-black text-xs uppercase tracking-wider">
                    {showReview ? 'Hide preview' : 'Review'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCancel}
                  className="w-full bg-white border border-rose-200 py-4 rounded-2xl flex-row items-center justify-center gap-2 active:scale-95"
                >
                  <Ban size={16} color="#ba1a1a" />
                  <Text className="text-[#ba1a1a] font-black text-xs uppercase tracking-wider">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View className="h-28" />
        </ScrollView>

        <ParentBottomNavBar
          activeTab="home"
          onTabChange={(tab) => {
            if (tab === 'home') router.push('/(parent)');
            else if (tab === 'medicines') router.push('/(parent)/medicines');
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
