import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, StyleSheet, TouchableOpacity, Platform, Text, Modal, Image } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SafeWebView } from './src/components/SafeWebView';
import firestore from '@react-native-firebase/firestore';
import { scheduleInvisibleSalahReminders } from './src/utils/NotificationManager';
import notifee, { EventType } from '@notifee/react-native';
import { BackgroundEngine } from './src/components/BackgroundEngine';

const MainAppGateway = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  React.useEffect(() => { setTimeout(() => setIsLoading(false), 2500); }, []);

  const { isOnboarded, theme } = useTheme();
  const [currentTab, setCurrentTab] = useState<'Home' | 'Chat' | 'Profile'>('Home');
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [overlayData, setOverlayData] = useState<{ type: string; prayerName: string } | null>(null);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((userState) => {
      setUser(userState);
    });
    return subscriber;
  }, []);

  useEffect(() => {
    if (user && user.uid) {
      console.log("Auth state verified, firing sync tracker...");
      scheduleInvisibleSalahReminders(user);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const payload = detail.notification?.data;
        if (payload?.type === 'salah_alert') {
          setOverlayData({
            type: payload.type,
            prayerName: String(payload.prayerName),
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isOnboarded) {
    return (
      <SafeAreaView style={[styles.rootContainer, { backgroundColor: theme.bg }]}>
        <OnboardingScreen />
      </SafeAreaView>
    );
  }
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        {/* Glow backdrop tailored to the text width */}
        <View style={{ position: 'absolute', width: 180, height: 60, borderRadius: 30, backgroundColor: '#00ffcc00', opacity: 0.12 }} />

        {/* Premium Dual-Tone Text */}
        <Text style={{ fontSize: 36, fontWeight: '900', letterSpacing: 1.5, }}>
          <Text style={{ color: theme.text }}>Study</Text>
          <Text style={{ color: theme.accent }}>Vault</Text>
        </Text>
      </View>
    );
  }

  return (
    // Changed root to transparent so the rendering engine is completely visible
    <SafeAreaView style={[styles.rootContainer, { backgroundColor: 'transparent' }]}>

      {/* SAFE WEB VIEW FULLSCREEN OVERLAY */}
      {activeUrl ? (
        <SafeWebView
          url={activeUrl}
          onClose={() => setActiveUrl(null)}
        />
      ) : (
        <>
          {/* 🚀 Mounts the wallpaper overlay behind everything */}
          <BackgroundEngine />

          {/* Content Canvas */}
          <View style={styles.mainContent}>
            {currentTab === 'Home' && <HomeScreen onOpenLink={(url) => setActiveUrl(url)} />}
            {currentTab === 'Chat' && <ChatScreen />}
            {currentTab === 'Profile' && <ProfileScreen />}
          </View>

          {/* PRAYER HUB OVERLAY */}
          <Modal visible={!!overlayData} animationType="slide" transparent={false}>
            <SafeAreaView style={[styles.overlayContainer, { backgroundColor: 'transparent' }]}>
              <View style={styles.overlayContent}>
                <Text style={styles.emojiArt}>🕌</Text>
                <Text style={[styles.overlayTitle, { color: theme.text }]}>
                  Time for {overlayData?.prayerName}
                </Text>
                <Text style={[styles.overlaySubtitle, { color: theme.textMuted }]}>
                  "Success is found in the prayer, not on the glowing screen."
                </Text>

                <View style={[styles.quoteCard, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
                  <Text style={[styles.quoteText, { color: theme.text }]}>
                    Take a deep breath. leave whatever you're doing, perform Wudu, and go offer your prayers. Your code can wait; your spiritual anchor cannot.
                  </Text>
                </View>

                <TouchableOpacity delayPressIn={0} delayPressOut={0} activeOpacity={0.85}
                  style={[styles.dismissBtn, { backgroundColor: theme.accent }]}
                  onPress={() => setOverlayData(null)}
                >
                  <Text style={[styles.dismissBtnText, { color: theme.bg }]}>I'm going to pray</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>

          {/* Glassmorphic Nav Menu Bar */}
          <View style={[styles.navBar, { backgroundColor: theme.bg2, borderTopColor: theme.border }]}>
            {(['Home', 'Chat', 'Profile'] as const).map((tab) => {
              const isActive = currentTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  delayPressIn={0} delayPressOut={0}
                  activeOpacity={0.85}
                  onPress={() => setCurrentTab(tab)}
                  style={styles.navItem}
                >
                  <Text style={[styles.navText, { color: isActive ? theme.accent : theme.textMuted }]}>
                    {tab}
                  </Text>
                  {isActive && <View style={[styles.activeDot, { backgroundColor: theme.accent }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Configure GoogleSignin
        GoogleSignin.configure({
          webClientId: '224314971816-1htfagovdg0j61ump7ur1fko4jbutima.apps.googleusercontent.com',
          offlineAccess: true,
          forceCodeForRefreshToken: true,
          scopes: ['profile', 'email'],
        });

        // Enable Firestore persistence
        await firestore().settings({ persistence: true });
        console.log("✓ Services initialized: GoogleSignin & Firestore");
      } catch (error) {
        console.log("Initialization error:", error);
      }
    };
    initializeServices();
  }, []);

  return (
    <ThemeProvider>
      <MainAppGateway />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: { flex: 1 },
  mainContent: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 8 : 0,
    elevation: 0, // Stripping heavy shadow out for premium look
  },
  navItem: { alignItems: 'center', justifyContent: 'center', height: '100%', flex: 1 },
  navText: { fontSize: 13, fontWeight: '700' },
  activeDot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
  overlayContainer: { flex: 1 },
  overlayContent: { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center' },
  emojiArt: { fontSize: 80, marginBottom: 20 },
  overlayTitle: { fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 },
  overlaySubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, fontStyle: 'italic', paddingHorizontal: 16 },
  quoteCard: { padding: 24, borderRadius: 16, borderWidth: 1, width: '100%', marginBottom: 40 },
  quoteText: { fontSize: 15, lineHeight: 24, textAlign: 'center', fontWeight: '500' },
  dismissBtn: { height: 56, borderRadius: 28, width: '100%', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  dismissBtnText: { fontSize: 16, fontWeight: '800' }
});