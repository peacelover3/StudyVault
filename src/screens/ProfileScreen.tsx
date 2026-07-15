import React, { useState, useRef, useEffect } from 'react';
import { AppState, AppStateStatus, View, Text, TouchableOpacity, TextInput, Image, Alert, StyleSheet, ScrollView, Modal, Platform, Linking, FlatList, Animated } from 'react-native';
import auth from '@react-native-firebase/auth'; 
import { GoogleSignin } from '@react-native-google-signin/google-signin'; 
import firestore from '@react-native-firebase/firestore'; 
import { useTheme, BgStyle } from '../context/ThemeContext';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadImageToImgbb } from '../utils/imbbUploader';
import { getPendingProfileUpload, savePendingProfileUpload, clearPendingProfileUpload } from '../utils/pendingProfileUpload';

export const ProfileScreen = () => {

  const { 
    theme, resetAllData, 
    studentName, setStudentName, avatarUri, setAvatarUri,
    currentBg, setCurrentBg
  } = useTheme();
  const [reviewText, setReviewText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(studentName);
  const [showSettings, setShowSettings] = useState(false);
  const [showBgDropdown, setShowBgDropdown] = useState(false);
  const dropdownHeightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(dropdownHeightAnim, {
      toValue: showBgDropdown ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showBgDropdown]);

  const bgOptions: { id: BgStyle; label: string; desc: string; icon: string }[] = [
    // { id: 'solid', label: 'Light', desc: 'Auto Light/Dark', icon: '🌗' },
    { id: 'dark', label: 'Midnight Black', desc: 'Absolute darkness', icon: '⬛' },
    { id: 'desert', label: 'Warm Desert', desc: 'Sandstone mix', icon: '🏜️' },
    { id: 'greenishBlack', label: 'Emerald Void', desc: 'Deep matrix dark', icon: '🟢' },
    { id: 'greenishYellow', label: 'Acid Lime', desc: 'Yellow-green pop', icon: '🍋' },
    { id: '1', label: 'SunSet', desc: 'Wallpaper 01', icon: '☁️' },
    { id: '2', label: 'Mountain View', desc: 'Wallpaper 02', icon: '🌌' },
    { id: '3', label: 'Study Place', desc: 'Wallpaper 03', icon: '⚡' },
    { id: '4', label: 'Moon View', desc: 'Wallpaper 04', icon: '🧊' },
  ];

  const currentUser = auth().currentUser;
  const isGuest = !currentUser || currentUser.isAnonymous;
  const userEmail = isGuest ? 'Guest Identity Active' : (currentUser?.email || 'No link verified');

  const tryPendingUpload = async () => {
    const pending = await getPendingProfileUpload();
    if (!pending) return;

    try {
      const imageUrl = await uploadImageToImgbb(pending.uri, pending.fileName, pending.fileType);
      await firestore().collection('users').doc(pending.uid).set({ customPic: imageUrl }, { merge: true });
      setAvatarUri(imageUrl);
      await clearPendingProfileUpload();
      console.log('Pending profile upload completed after reconnect.');
    } catch (pendingError) {
      console.warn('Pending profile upload retry failed:', pendingError);
    }
  };

  useEffect(() => {
    tryPendingUpload();
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        tryPendingUpload();
      }
    });
    return () => subscription.remove();
  }, []);

  const handlePickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.6 }, async (response) => {
      if (response.didCancel || response.errorCode || !response.assets) return;
      const asset = response.assets[0];
      if (!asset.uri) return;

      setAvatarUri(asset.uri);
      const uid = currentUser?.uid;
      if (!uid) return;

      try {
        const imageUrl = await uploadImageToImgbb(asset.uri, asset.fileName, asset.type);
        await firestore().collection('users').doc(uid).set({ customPic: imageUrl }, { merge: true });
        setAvatarUri(imageUrl);
        await clearPendingProfileUpload();
      } catch (error: any) {
        console.warn('Avatar upload failed, queuing retry:', error);
        await savePendingProfileUpload({
          uid,
          uri: asset.uri,
          fileName: asset.fileName,
          fileType: asset.type,
        });
        Alert.alert(
          'Upload pending',
          'Your profile image will be uploaded when a connection becomes available.',
        );
      }
    });
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    const trimmedName = editName.trim();
    setStudentName(trimmedName);
    setIsEditing(false);

    const uid = currentUser?.uid;
    if (uid) {
      try {
        await firestore().collection('users').doc(uid).set({ customName: trimmedName }, { merge: true });
      } catch (e) { 
        // Silent fail - Firestore sync will happen later
        console.warn('Name sync pending:', e); 
      }
    }
  };

  const handleLinkAccount = async () => {
    try {
      // Save current anonymous user's uid and data
      const anonUid = currentUser?.uid;
      let anonData: any = {};
      
      if (anonUid) {
        try {
          const anonDoc = await firestore().collection('users').doc(anonUid).get();
          if (anonDoc.exists) {
            anonData = anonDoc.data() || {};
          }
        } catch (e) { 
          console.warn("Couldn't fetch anonymous user data, continuing:", e); 
        }
      }

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      
      if (idToken) {
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        const firebaseUserCredential = await auth().signInWithCredential(googleCredential);
        const newUid = firebaseUserCredential.user.uid;
        
        // Merge anonymous data with authenticated user document (Google data takes priority)
        const userData = {
          ...anonData,
          email: firebaseUserCredential.user.email,
          lastSyncedAt: new Date().toISOString()
        };

        // Set merged data to new authenticated user document
        try {
          await firestore().collection('users').doc(newUid).set(userData, { merge: true });
        } catch (e) { 
          console.warn("Couldn't save user data immediately, will sync later:", e); 
        }

        // Clean up anonymous user document (non-critical, don't fail on this)
        if (anonUid && anonUid !== newUid) {
          try {
            await firestore().collection('users').doc(anonUid).delete();
          } catch (e) { 
            console.warn("Cleanup pending:", e); 
          }
        }

        Alert.alert("Success!", "Google account verified and linked securely.");
        setShowSettings(false);
      }
    } catch (error: any) {
      if (error.code === GoogleSignin.SIGN_IN_CANCELLED) {
        Alert.alert("Cancelled", "Sign-in was cancelled.");
      } else if (error.code === GoogleSignin.IN_PROGRESS) {
        Alert.alert("In Progress", "Sign-in is already in progress.");
      } else {
        Alert.alert("Error", error.message || "Failed to link account. Please try again.");
      }
    }
  };

  const handleLogoutAndReset = async () => {
    try {
      setShowSettings(false);
      if (auth().currentUser) await auth().signOut();
      try { await GoogleSignin.signOut(); } catch (gErr) {}
      await resetAllData();
    } catch (error) { console.error(error); }
  };

  //  GEMINI CODE 
const ReviewLink = async () => {
  if (!reviewText.trim()) return;
  try {
    // The true, full destination URL bypasses the redirect bug completely
    const formUrl = `https://docs.google.com/forms/d/e/1FAIpQLSePuOoiRHJVRD30B-wUyw5ATp6KqmODryVeBq1XAxLr2Y9RLQ/viewform`;
    await Linking.openURL(formUrl);
    setReviewText('');
  } catch (e) { console.log(e); }
};

const NSTC = () => {
  Alert.alert("Coming Soon...", "The cammunity portal is currently under construction. Please check back later!");
};

// GEMINI CODE END
  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.bg2, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>STUDENT PROFILE</Text>
        <TouchableOpacity  delayPressIn={0} delayPressOut={0}
          activeOpacity={0.85} onPress={() => setShowSettings(true)} style={[styles.gearBtn, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
          <Text style={{ fontSize: 16 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollStack} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
          <TouchableOpacity  delayPressIn={0} delayPressOut={0}
            activeOpacity={0.85} onPress={handlePickImage} style={[styles.avatarFrame, { borderColor: theme.accent, backgroundColor: theme.bg }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <Text style={[styles.avatarInitials, { color: theme.accent }]}>
                {studentName ? studentName.slice(0, 2).toUpperCase() : 'OP'}
              </Text>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: theme.accent, borderColor: theme.bg }]}>
              <Text style={{ fontSize: 10 }}>📸</Text>
            </View>
          </TouchableOpacity>

          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput
                style={[styles.inputField, { color: theme.text, borderColor: theme.accent, backgroundColor: theme.bg }]}
                value={editName}
                onChangeText={setEditName}
                autoFocus
                maxLength={20}
              />
              <TouchableOpacity  delayPressIn={0} delayPressOut={0}
                activeOpacity={0.85} onPress={handleSaveName} style={[styles.checkBtn, { backgroundColor: theme.accent }]}>
                <Text style={{ color: theme.bg, fontWeight: '900' }}>✓</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: theme.text }]}>{studentName || 'Set Signature'}</Text>
              <TouchableOpacity  delayPressIn={0} delayPressOut={0}
                activeOpacity={0.85 } onPress={() => { setEditName(studentName); setIsEditing(true); }} style={styles.editBtn}>
                <Text style={{ fontSize: 14, opacity: 0.6 }}>✏️</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={[styles.subTitle, { color: theme.textMuted }]}>{userEmail}</Text>
        </View>

        {/* Master Active Status Control Widget */}
        <View style={[styles.sectionTitleRow, {backgroundColor: theme.bg2, borderColor: theme.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10}]}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>More from StudyVault</Text>
          <View style={[styles.accentLine, { backgroundColor: theme.accent, opacity: 0.3 }]} />
        </View>
{/* // GEMINI CODE  */}

<View style={[styles.functionalCard, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
  <Text style={{ color: theme.text, fontSize: 13, fontWeight: '800' }}>Contribute to StudyVault</Text>
 
  <TouchableOpacity  delayPressIn={0} delayPressOut={0}
    activeOpacity={0.85} style={[styles.actionBtn, { borderColor: theme.accent, borderWidth: 1 }]} onPress={() => Linking.openURL(`https://docs.google.com/forms/d/e/1FAIpQLSd1-BzTlfkjrUq4k7S3jS4eoSIujuVVj3if71pNcEoel442eA/viewform?usp=header`)}>
    <Text style={{ color: theme.accent, fontWeight: '800' }}>Submit Review?</Text>
  </TouchableOpacity> 
  <TouchableOpacity  delayPressIn={0} delayPressOut={0}
    activeOpacity={0.85} onPress={NSTC} style={[styles.actionBtn, { borderColor: theme.accent, borderWidth: 1 }]}>
    <Text style={{ color: theme.accent, fontWeight: '800' }}>Join Cammunity</Text>
  </TouchableOpacity>
</View>
{/*  GEMINI CODE END  */}
      
      </ScrollView>

      {/* Unified Configurations Master Modal */}
      <Modal 
        visible={showSettings} 
        animationType="slide" 
        transparent={true} 
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={[styles.modalBlurOverlay, { backgroundColor: `rgba(0, 0, 0, ${theme.isDark ? 0.7 : 0.5})` }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border, backgroundColor: theme.bg2 }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>CONFIGURATIONS SYSTEM</Text>
              <TouchableOpacity activeOpacity={0.85} onPress={() => setShowSettings(false)} style={[styles.closeBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Text style={[styles.closeIcon, { color: theme.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollStack} showsVerticalScrollIndicator={false}>
              
              {/* Conditional Auth Gateway Module */}
              {isGuest ? (
                <View style={[styles.settingBlock, { backgroundColor: theme.bg, borderColor: theme.accent }]}>
                  <View style={styles.settingHeader}>
                    <Text style={{ fontSize: 16 }}>🔒</Text>
                    <Text style={[styles.settingText, { color: theme.text }]}>Guest Mode Core</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>
                    Sync your database assets across remote portals to protect your cloud storage space.
                  </Text>
                  <TouchableOpacity activeOpacity={0.85} onPress={handleLinkAccount} style={[styles.linkBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                    <Text style={{ color: theme.bg2, fontWeight: '800', fontSize: 13 }}>Verify Google Profile</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.settingBlock, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <View style={styles.settingHeader}>
                    <Text style={{ fontSize: 16 }}>🛡️</Text>
                    <Text style={[styles.settingText, { color: theme.text }]}>Verified Cloud Account</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>
                    Secure core connected as: <Text style={{ color: theme.accent, fontWeight: '600' }}>{currentUser?.email}</Text>
                  </Text>
                </View>
              )}

              {/* Dynamic Theme Environment Matrix List Grid Grid Layout */}
              <View style={[styles.settingBlock, { backgroundColor: 'transparent', borderColor: theme.border }]}>
                <View style={styles.settingHeader}>
                  <Text style={{ fontSize: 16 }}></Text>
                  <Text style={[styles.settingText, { color: theme.text }]}>App Core Backgrounds</Text>
                </View>
                
                <TouchableOpacity 
                  activeOpacity={0.85} 
                  onPress={() => setShowBgDropdown(!showBgDropdown)}
                  style={[styles.dropdownButton, { backgroundColor: theme.bg2, borderColor: theme.border }]}
                >
                  <Text style={[styles.dropdownText, { color: theme.text }]}>
                    {bgOptions.find(opt => opt.id === currentBg)?.label || 'Select Background'}
                  </Text>
                  <Animated.Text style={{ fontSize: 12, color: theme.textMuted, transform: [{ rotate: dropdownHeightAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
                    ▼
                  </Animated.Text>
                </TouchableOpacity>

                <Animated.View style={[{ opacity: dropdownHeightAnim, maxHeight: dropdownHeightAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 400] }) }, styles.dropdownListContainer]}>
                  <View style={[styles.dropdownList, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
                    {bgOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        activeOpacity={0.85}
                        onPress={() => {
                          setCurrentBg(opt.id);
                          setShowBgDropdown(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          { borderBottomColor: theme.border, backgroundColor: currentBg === opt.id ? theme.accentGlow : 'transparent' }
                        ]}
                      >
                        <Text style={[styles.dropdownItemText, { color: currentBg === opt.id ? theme.accent : theme.text }]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>
              </View>

              <TouchableOpacity 
                activeOpacity={0.85} 
                onPress={() => {
                  Alert.alert("Logout & Reset", "Remove local cache and reset profile?", [
                    { text: "Back", style: "cancel" },
                    { text: "Logout", style: "destructive", onPress: handleLogoutAndReset }
                  ]);
                }} 
                style={[styles.dangerBtn, { borderColor: theme.textDim, backgroundColor: theme.bg2 }]}
              >
                <Text style={[styles.dangerText, { color: theme.text }]}>Logout & Reset</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { height: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, borderBottomWidth: 1, marginTop: Platform.OS === 'ios' ? 0 : 12 },
  headerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  gearBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  scrollStack: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, gap: 24 },
  profileCard: { borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1 },
  avatarFrame: { width: 90, height: 90, borderRadius: 45, borderWidth: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 45 },
  avatarInitials: { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 },
  displayName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  editBtn: { padding: 4 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', marginTop: 12 },
  inputField: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 40, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  checkBtn: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  subTitle: { fontSize: 12, marginTop: 4, letterSpacing: 0.3, opacity: 0.8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  accentLine: { flex: 1, height: 1 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginTop: 8 },
  bgBox: { borderRadius: 16, borderWidth: 1 },
  subBgBox: { width: '48%', height: 100, borderRadius: 12, borderWidth: 1, padding: 12, justifyContent: 'space-between' },
  boxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  indicatorDot: { width: 8, height: 8, borderRadius: 4 },
  boxMeta: { gap: 2 },
  bgText: { fontSize: 12, fontWeight: '800', letterSpacing: -0.2 },
  bgDesc: { fontSize: 9, lineHeight: 11, fontWeight: '500' },
  dropdownButton: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  dropdownText: { fontSize: 14, fontWeight: '600' },
  dropdownListContainer: { marginTop: 8, overflow: 'hidden', borderRadius: 12 },
  dropdownList: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  dropdownItemText: { fontSize: 14, fontWeight: '600' },
  modalBlurOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, maxHeight: '85%' },
  modalHeader: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, borderBottomWidth: 1 },
  modalTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  closeBtn: { width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  closeIcon: { fontSize: 12, fontWeight: 'bold' },
  modalScrollStack: { padding: 24, gap: 16, paddingBottom: 40 },
  settingBlock: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  settingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingText: { fontSize: 14, fontWeight: '700' },
  linkBtn: { height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 4, borderWidth: 1 },
  dangerBtn: { padding: 14, borderWidth: 1, borderRadius: 14, alignItems: 'center' },
  dangerText: { fontWeight: '800', fontSize: 13, letterSpacing: 0.3 },
  functionalCard: { borderRadius: 16, padding: 18, borderWidth: 1, gap: 12 },
textArea: { height: 68, borderRadius: 12, borderWidth: 1, padding: 12, textAlignVertical: 'top', fontSize: 14 },
actionBtn: { height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 2 }
});