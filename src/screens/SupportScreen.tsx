import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '../context/ThemeContext';

export const SupportScreen = () => {
  const { theme } = useTheme();
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [ticketText, setTicketText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitReview = async () => {
    if (!reviewText.trim()) return Alert.alert("Hold on", "Drop a small text note before submitting your rating.");
    setIsSubmitting(true);
    try {
      const uid = auth().currentUser?.uid || 'anonymous';
      await firestore().collection('reviews').add({
        uid,
        rating,
        text: reviewText.trim(),
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
      Alert.alert("Success", "Your system core review has been registered!");
      setReviewText('');
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Transmission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitTicket = async () => {
    if (!ticketText.trim()) return Alert.alert("Hold on", "Describe the bug layout or feature request first.");
    setIsSubmitting(true);
    try {
      const uid = auth().currentUser?.uid || 'anonymous';
      const email = auth().currentUser?.email || 'Guest';
      await firestore().collection('tickets').add({
        uid,
        email,
        description: ticketText.trim(),
        status: 'OPEN',
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
      Alert.alert("Ticket Logged", "Bug entry filed. The core team has been paged.");
      setTicketText('');
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Ticket sync dropped.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.bg2, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>SUPPORT & FEEDBACK</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollStack} showsVerticalScrollIndicator={false}>
        
        {/* Module A: 5-Star Review Matrix System */}
        <View style={[styles.card, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Rate App Core ⭐</Text>
          <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
            Log your global rating directly into our decentralized main cluster registry.
          </Text>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity  delayPressIn={0} delayPressOut={0} key={num} activeOpacity={0.85} onPress={() => setRating(num)} style={styles.starBtn}>
                <Text style={{ fontSize: 28, color: num <= rating ? theme.accent : theme.textDim }}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
            placeholder="Write your review experience..."
            placeholderTextColor={theme.textDim}
            multiline
            numberOfLines={3}
            value={reviewText}
            onChangeText={setReviewText}
          />

          <TouchableOpacity 
            disabled={isSubmitting} 
             delayPressIn={0} delayPressOut={0}
            activeOpacity={0.85} 
            onPress={submitReview} 
            style={[styles.actionBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={{ color: theme.bg, fontWeight: '800' }}>Transmit Review</Text>
          </TouchableOpacity>
        </View>

        {/* Module B: Technical Bug Ticket Submission Module */}
        <View style={[styles.card, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Log System Bug Ticket 🛠️</Text>
          <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
            Found a UI freeze or broken link? Drop the layout details here to generate a live hotfix ticket.
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
            placeholder="Describe the technical anomaly or feature proposal..."
            placeholderTextColor={theme.textDim}
            multiline
            numberOfLines={4}
            value={ticketText}
            onChangeText={setTicketText}
          />

          <TouchableOpacity 
            disabled={isSubmitting} 
             delayPressIn={0} delayPressOut={0}
            activeOpacity={0.85} 
            onPress={submitTicket} 
            style={[styles.actionBtn, { backgroundColor: theme.accentGlow, borderColor: theme.accent, borderWidth: 1 }]}
          >
            <Text style={{ color: theme.accent, fontWeight: '800' }}>File Core Bug Entry</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { height: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, borderBottomWidth: 1, marginTop: Platform.OS === 'ios' ? 0 : 12 },
  headerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  scrollStack: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100, gap: 24 },
  card: { borderRadius: 20, padding: 20, borderWidth: 1, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardDesc: { fontSize: 12, lineHeight: 16 },
  starRow: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  starBtn: { padding: 2 },
  input: { minHeight: 70, borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, textAlignVertical: 'top' },
  actionBtn: { height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 4 }
});