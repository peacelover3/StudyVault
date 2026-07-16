import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { requestAppNotificationsPermission } from '../utils/NotificationManager';

export const OnboardingScreen = () => {
  const { theme, themeMode, setThemeMode, completeOnboarding } = useTheme();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [policyRead, setPolicyRead] = useState(false);
  const [error, setError] = useState('');

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 15) {
      setPolicyRead(true);
    }
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!name.trim()) {
        setError('Please enter your name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3); 
    } else if (step === 3) {
      setStep(4); 
    }
  };

  // 🔥 UPDATED FINISH METHOD
  const handleFinish = async () => {
    if (!policyRead) {
      setError('Please scroll to the bottom to accept the privacy agreement.');
      return;
    }
    
    // Smoothly intercept layout here to request permissions stealthily
    await requestAppNotificationsPermission();
    
    // Complete configuration entry point mapping
    completeOnboarding(name.trim(), themeMode);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      
      <View style={styles.indicatorContainer}>
        {[1, 2, 3, 4].map((s) => (
          <View 
            key={s} 
            style={[
              styles.dot, 
              { backgroundColor: step === s ? theme.accent : theme.border, width: step === s ? 16 : 6 }
            ]} 
          />
        ))}
      </View>

      {step === 1 && (
        <View style={styles.stepWrapper}>
          <Text style={[styles.title, { color: theme.text }]}>What's your name?</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Let's personalize your workspace dashboard.</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bg2, color: theme.text, borderColor: theme.borderAccent }]}
            placeholder="Name or nickname..."
            placeholderTextColor={theme.textDim}
            value={name}
            onChangeText={(txt) => { setName(txt); setError(''); }}
            autoFocus
          />
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepWrapper}>
          <Text style={[styles.title, { color: theme.text }]}>Choose your vibe.</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Pick a theme that keeps your eyes fresh during study grinds.</Text>
          <View style={styles.row}>
            {(['dark', 'light', 'system'] as const).map((t) => (
              <TouchableOpacity  delayPressIn={0} delayPressOut={0} activeOpacity={0.85}
                key={t}
                onPress={() => setThemeMode(t)}
                style={[
                  styles.modeBtn,
                  { backgroundColor: 'transparent', borderColor: themeMode === t ? theme.accent : theme.border, borderWidth: themeMode === t ? 2 : 1 }
                ]}
              >
                <Text style={{ color: themeMode === t ? theme.accent : theme.textMuted, textTransform: 'capitalize', fontWeight: 'bold', fontSize: 15 }}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={styles.stepWrapper}>
          <Text style={[styles.title, { color: theme.text }]}>StudyVault, your calm study sidekick.</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>We help you stay focused with a simple workspace, a smart assistant, and a clean place to keep your plans together.</Text>
        </View>
      )}

      {step === 4 && (
        <View style={styles.stepWrapper}>
          <Text style={[styles.title, { color: theme.text }]}>Privacy First.</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>We don't sell or track your usage habits. Period.</Text>
          <ScrollView 
            style={[styles.policyBox, { backgroundColor: theme.bg2, borderColor: theme.border }]}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <Text style={[styles.policyText, { color: theme.textMuted }]}>
              Welcome to StudyVault. Please read these Terms of Service and End User License Agreement carefully. This document is a legally binding contract between you and StudyVault. By accessing, installing, or using this mobile application, you agree to be bound by every provision set forth below. If you do not agree to these terms, you are explicitly prohibited from using the application, and you must uninstall it from your device immediately.

Section 1 Acceptance of Terms and Scope of Agreement
This agreement governs your use of the software application known as StudyVault, including all updates, patches, revisions, and connected features provided through the application interface. Your interaction with the application constitutes an ongoing and irrevocable acceptance of these terms. These terms may be modified, altered, or updated at any time without prior individual notification. It remains your sole responsibility to review these terms periodically for any updates. Continued use of the application after modifications are posted signifies your absolute acceptance of the revised terms.

Section 2 Data Ownership and Local Storage Architecture
StudyVault operates on a localized architectural framework. Your data belongs strictly and exclusively to you. All personal indicators, interface choices, nicknames, custom configurations, data matrices, and visual theme settings are stored locally within your device sandbox environment. The application does not maintain a remote server database to store or track your personal workspace metrics.

Because your data is confined strictly to your local device environment, the security, preservation, integrity, and backup of your stored information depend entirely on your own device maintenance. StudyVault is not liable for any data loss, file corruption, hardware failure, accidental deletion, or unauthorized physical or digital access to your device that results in the destruction or alteration of your local data sandbox.

Section 3 Artificial Intelligence Integration and Session Volatility
The application provides an AI Assistant interface designed to assist with study sessions, resource parsing, and data organization. The network connection pipelines utilized for this integration are direct and transient. This means that data transmissions sent through the connection pipe are processed in real time and are entirely session dependent.

Data logs, input prompts, contextual evaluations, and conversational histories pass through temporary processing pipelines and evaporate completely from active memory immediately after you terminate or close your active context session. No persistent logs are permanently indexed or stored on external infrastructure by StudyVault. You acknowledge that artificial intelligence generation is inherently non-deterministic and that StudyVault does not guarantee the accuracy, completeness, or reliability of any information generated by the AI Assistant.

Section 4 Permitted User Conduct and Prohibited Activities
You are granted a non-exclusive, non-transferable, revocable license to use StudyVault strictly for personal, educational, and non-commercial purposes. You agree to use the application in strict compliance with all applicable local, national, and international laws and regulations.

You are expressly prohibited from engaging in any of the following activities:
Attempting to reverse engineer, decompile, disassemble, or derive the source code of the application or any components therein.
Modifying, adapting, translating, or creating derivative works based on the application layout, styles, or internal logical structures.
Using the AI Assistant integration to generate, transmit, or facilitate harmful, illegal, abusive, or defamatory content.
Bypassing, disabling, or tampering with any security measures, interface gates, or restrictions built into the software layout.
Utilizing automated scripts, bots, or scraping tools to extract interface data or stress the connected infrastructure.

Section 5 Intellectual Property and Proprietary Rights
All right, title, and interest in and to StudyVault, including but not limited to the underlying code, software design architecture, visual interfaces, visual theme palettes, typography configurations, brand names, and original logos, are the exclusive intellectual property of StudyVault.

Except for the limited license explicitly granted in these terms, nothing in this agreement transfers any ownership or proprietary rights to you. All rights not expressly granted are reserved by the intellectual property owners.

Section 6 External Resource Directories and Hyperlinks
The application interface may display structured directories, resource grids, or hyperlinks to third-party web platforms, educational portals, or external websites. These directories are provided solely for educational reference and user convenience. StudyVault does not monitor, endorse, control, or assume any responsibility for the content, functional operations, privacy frameworks, availability, or safety of external third-party websites.

When you trigger an external link or dashboard option, you exit the bounded execution environment of the application. StudyVault is not responsible or liable, directly or indirectly, for any damage, data breach, tracking mechanism, or functional error encountered on external third-party web domains.

Section 7 Disclaimer of Warranties
StudyVault is provided to you on an as-is and as-available basis without any warranties of any kind, either express or implied. To the maximum extent permitted by applicable law, StudyVault disclaims all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, non-infringement, and system stability.

No guarantee is made that the application will meet your specific educational requirements, that the operations will be completely uninterrupted or lightning fast, that the local cache will never experience a micro stutter, or that the software will be entirely free from minor bugs or asset rendering anomalies.

Section 8 Limitation of Liability
To the maximum extent permitted by law, in no event shall StudyVault or its associates be liable for any direct, indirect, incidental, special, consequential, or exemplary damages. This includes, without limitation, damages for loss of personal data, device failures, system downtime, academic outcomes, or any other intangible losses arising out of or related to your use or inability to use the software application. This limitation applies regardless of the legal theory advanced, even if StudyVault has been advised of the possibility of such damages.

Section 9 Termination of Agreement
This agreement remains effective until terminated by either party. You may terminate this contract at any time by permanently deleting and uninstalling the application from your mobile device, which will simultaneously purge your local sandbox cache. Your rights under this license will terminate automatically and instantly without notice if you fail to comply with any provision of these terms. Upon termination, you must cease all use of the application and destroy all copies of the software in your possession.

Section 10 Governing Law and Severability
These terms and conditions are governed by and construed in accordance with the laws governing software licensing agreements, without regard to conflict of law principles. If any provision of this agreement is found to be invalid, unlawful, or unenforceable by a court of competent jurisdiction, that specific provision will be limited or severed to the minimum extent necessary, and the remaining provisions of this agreement will remain in full force and effect.

Section 11 Acknowledgment and Access Unlock
By checking the confirmation box or proceeding past this interface layout, you acknowledge that you have scrolled down completely, read this agreement in its entirety, understood its legal implications, and given your unconditional consent to be bound by every term outlined above.
AGGREEMENT:
By clicking "Get Started" below, you confirm that you have read and understood the terms of this agreement, and you voluntarily accept all conditions outlined herein. You also acknowledge that you have the right to seek legal counsel before agreeing to these terms if you have any questions or concerns about your rights and obligations under this agreement.

            </Text>
          </ScrollView>
          <Text style={[styles.hint, { color: policyRead ? theme.accent : theme.textDim }]}>
            {policyRead ? "✓ Terms acknowledged." : "Scroll down to read and unlock."}
          </Text>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.btnRow}>
        {step > 1 && (
          <TouchableOpacity
            delayPressIn={0}
            delayPressOut={0}
            activeOpacity={0.85}
            onPress={() => setStep(step - 1)}
            style={[styles.backBtn, { borderColor: theme.border }]}
          >
            <Text style={{ color: theme.textMuted, fontWeight: '700' }}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          delayPressIn={0}
          delayPressOut={0}
          activeOpacity={0.85}
          onPress={step === 4 ? handleFinish : nextStep}
          style={[styles.actionBtn, { backgroundColor: theme.accent, flex: step === 1 ? 1 : 2 }]}
        >
          <Text style={[styles.actionText, { color: theme.bg }]}> 
            {step === 4 ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>

      </View>
    );
  };

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, justifyContent: 'space-between', paddingVertical: 60 },
  indicatorContainer: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 6, borderRadius: 3 } as any,
  stepWrapper: { marginTop: 40, flex: 1, justifyContent: 'center' },
  title: { fontSize: 34, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 22, marginBottom: 32 },
  input: { height: 56, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 18, fontSize: 16, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 12, marginTop: 10 },
  modeBtn: { flex: 1, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  authProviderBtn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', width: '100%' },
  authBtnText: { fontSize: 16, fontWeight: '800' },
  policyBox: { maxHeight: 180, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  policyText: { fontSize: 14, lineHeight: 22 },
  hint: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  errorText: { color: '#ff4a4a', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  btnRow: { flexDirection: 'row', gap: 12, height: 56, alignItems: 'center' },
  backBtn: { height: '100%', flex: 1, borderWidth: 1, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  actionBtn: { height: '100%', borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 16, fontWeight: '800' }
});