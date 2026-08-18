import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Copy, 
  Check, 
  Smartphone, 
  Server, 
  Database, 
  UploadCloud, 
  ShieldCheck, 
  FolderDown, 
  Layers, 
  Zap 
} from 'lucide-react';
import { motion } from 'motion/react';
import { haptic } from '../utils/haptics';

interface DeploymentDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export const DeploymentDocsModal: React.FC<DeploymentDocsModalProps> = ({
  isOpen,
  onClose,
  theme
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    haptic.lightTap();
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const projectPath = `C:\\Users\\spuzd\\OneDrive\\Documents\\VS Code\\DoIT`;

  const initCommand = `# 1. Navigate to your project directory
cd "${projectPath}"

# 2. Clone or export DoIT codebase
git init
git branch -M main

# 3. Install core web & mobile dependencies
npm install @google/genai canvas-confetti lucide-react motion react react-dom
npm install -D tailwindcss @tailwindcss/vite typescript @types/node

# 4. Run Vite web app locally
npm run dev`;

  const reactNativeSetupCode = `// React Native / Expo Native Port (App.tsx)
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, StatusBar } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MotiView, AnimatePresence } from 'moti'; // Framer Motion for React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';

// 1. Firebase Config for Cross-Platform Sync
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "doit-suite.firebaseapp.com",
  projectId: "doit-suite",
  storageBucket: "doit-suite.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function DoITApp() {
  const [tasks, setTasks] = useState([]);

  // Native Haptic feedback on task completion
  const handleTaskComplete = (taskId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.headerTitle}>⚡ DoIT Suite</Text>
      {/* Animated Task Cards with Moti/Framer */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b', paddingHorizontal: 20, paddingTop: 50 },
  headerTitle: { color: '#f59e0b', fontSize: 24, fontWeight: '800' }
});`;

  const easBuildCommand = `# Install EAS CLI globally
npm install -g eas-cli

# Log in to your Expo Application Services account
eas login

# Initialize EAS in project
eas build:configure

# 1. Build Android Production Bundle (.AAB for Google Play Store)
eas build --platform android --profile production

# 2. Build iOS Production IPA (for Apple App Store / TestFlight)
eas build --platform ios --profile production

# 3. Submit simultaneously to both stores
eas submit -p android --latest
eas submit -p ios --latest`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full sm:max-w-4xl sm:rounded-3xl rounded-t-3xl border border-white/10 shadow-2xl overflow-hidden mb-0 sm:my-8 bg-[#0a0a0c]/95 backdrop-blur-2xl text-white"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Production Pipeline</div>
              <h2 className="font-light text-lg sm:text-xl text-white tracking-tight">
                Cross-Platform App & Store Deployment
              </h2>
            </div>
          </div>
          <button
            onClick={() => { haptic.lightTap(); onClose(); }}
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Target path banner */}
          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="text-xs text-white/80">
                Designated Local Project Directory: <span className="font-mono text-orange-300 font-bold">{projectPath}</span>
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(projectPath, 'path')}
              className="px-3 py-1 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-[11px] font-bold self-start sm:self-auto cursor-pointer"
            >
              {copiedSection === 'path' ? 'Path Copied' : 'Copy Path'}
            </button>
          </div>

          {/* Section 1: Project Setup */}
          <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderDown className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/70">
                  1. Local Folder Setup & Initialization
                </h3>
              </div>
              <button
                onClick={() => copyToClipboard(initCommand, 'init')}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-orange-400 font-medium cursor-pointer transition-colors"
              >
                {copiedSection === 'init' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'init' ? 'Copied' : 'Copy Commands'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-black/60 font-mono text-xs text-white/80 overflow-x-auto border border-white/10 leading-relaxed">
              {initCommand}
            </pre>
          </div>

          {/* Section 2: React Native + Framer Motion Architecture */}
          <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/70">
                  2. React Native (Expo) + Moti/Framer Motion + Native Haptics
                </h3>
              </div>
              <button
                onClick={() => copyToClipboard(reactNativeSetupCode, 'rn')}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-sky-400 font-medium cursor-pointer transition-colors"
              >
                {copiedSection === 'rn' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'rn' ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-black/60 font-mono text-xs text-white/80 overflow-x-auto border border-white/10 leading-relaxed">
              {reactNativeSetupCode}
            </pre>
          </div>

          {/* Section 3: Firebase Cloud Sync & Authentication Architecture */}
          <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/70">
                3. Firebase Real-Time Firestore & Offline Persistence Schema
              </h3>
            </div>
            <div className="text-xs text-white/60 space-y-2 leading-relaxed">
              <p>
                To enable seamless multi-device synchronization between web, iOS, and Android:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-white/80 ml-2">
                <li><strong className="text-white">Firestore Collections:</strong> <code className="text-orange-400 font-mono px-1.5 py-0.5 rounded bg-white/5">users/{'{userId}'}/tasks/{'{taskId}'}</code> and <code className="text-orange-400 font-mono px-1.5 py-0.5 rounded bg-white/5">users/{'{userId}'}/categories</code></li>
                <li><strong className="text-white">Offline Caching:</strong> Enable <code className="text-sky-400 font-mono px-1.5 py-0.5 rounded bg-white/5">enableIndexedDbPersistence()</code> (Web) and <code className="text-sky-400 font-mono px-1.5 py-0.5 rounded bg-white/5">persistentMultipleTabManager()</code> for zero-latency local optimistic updates.</li>
                <li><strong className="text-white">Recurring Task Worker:</strong> A Firebase Cloud Function (or cron endpoint) triggers every midnight to verify rolled dates and dispatches email notifications.</li>
              </ul>
            </div>
          </div>

          {/* Section 4: Store Deployment Command */}
          <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/70">
                  4. Simultaneous iOS & Android Store Deployment (EAS / Fastlane)
                </h3>
              </div>
              <button
                onClick={() => copyToClipboard(easBuildCommand, 'eas')}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-orange-400 font-medium cursor-pointer transition-colors"
              >
                {copiedSection === 'eas' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'eas' ? 'Copied' : 'Copy Commands'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-black/60 font-mono text-xs text-orange-300/90 overflow-x-auto border border-white/10 leading-relaxed">
              {easBuildCommand}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-t border-white/10 bg-white/[0.02]">
          <span className="text-xs text-white/40">
            Engineered for high performance, zero-latency execution & fluid native feel.
          </span>
          <button
            onClick={() => { haptic.lightTap(); onClose(); }}
            className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-white/90 active:scale-95 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
