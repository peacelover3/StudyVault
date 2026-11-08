import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const STUDY_LINKS = [
    { id: '1', title: 'ParhloBhai', desc: 'A Website for all students to study and get notes.', url: 'https://parhlobhai.vercel.app/' },
    { id: '2', title: 'Exametric', desc: 'A resource hub for all NSTC subjects. AI assisted learning with free guides and resources.', url: 'https://exametric.netlify.app' },
    // { id: '3', title: 'MathJack', desc: 'MathJack is a live-grading Olympiad mathematics contest platform. It is a training platform for NMTC and Olympiads including IMO, APMO, BMO, USAMO.', url: 'https://mathjack.org' }, // 🚀 Fixed protocol scheme prefix
    { id: '3', title: 'Islamic Writings', desc: 'Completely un-related to school, but a good resoure to understand about islam and culture.', url: 'https://peaceprojection.org/' },
    { id: '4', title: 'Coming Soon', desc: 'What resources should we add here? Submit your suggestions!', url: null },
];

interface HomeScreenProps {
    onOpenLink: (url: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenLink }) => {
    const { theme } = useTheme();
    const [search, setSearch] = useState('');

    const filteredLinks = STUDY_LINKS.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.desc.toLowerCase().includes(search.toLowerCase())
    );

    const cardOverlayBg = theme.isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.75)';

    return (
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
            {/* Search Header Area */}
            <View style={[styles.headerContainer, { backgroundColor: theme.bg2 , borderBottomColor: theme.border }]}>
                <Text style={[styles.greeting, { color: theme.text }]}>Study Vault</Text>
            </View>

            <View style={{ marginTop: 12, marginBottom: 16 }}>
                <TextInput
                    style={[styles.searchBar, { backgroundColor: theme.bg2, color: theme.textMuted, borderColor: theme.border }]}
                    placeholder="Search tools or portals..."
                    placeholderTextColor={theme.text}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Main Grid Matrix List */}
            <FlatList
                data={filteredLinks}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View style={[styles.glassCard, { backgroundColor: cardOverlayBg, borderColor: theme.borderAccent }]}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                        <Text style={[styles.cardDesc, { color: theme.textMuted }]}>{item.desc}</Text>

                        <TouchableOpacity
                            delayPressIn={0}
                            delayPressOut={0}
                            activeOpacity={0.85}
                            onPress={() => {
                              if (item.id === '4') {
                                Alert.alert('Coming Soon!', 'You can submit your resource request from the Profile tab.');
                              } else {
                                onOpenLink(item.url);
                              }
                            }}
                            style={[styles.openBtn, { backgroundColor: theme.accentGlow, borderColor: theme.accent }]}
                        >
                            <Text style={[styles.btnText, { color: theme.accent }]}>Open Dashboard</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: theme.textDim }]}>No Vault matches your search.</Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    headerContainer: { 
        paddingVertical: 12, 
        paddingHorizontal: 20, 
        borderRadius: 16, 
        marginTop: 24, 
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    greeting: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    searchBar: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
    listContent: { paddingBottom: 100, gap: 16 },
    glassCard: { padding: 18, borderRadius: 16, borderWidth: 1 },
    cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
    cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
    openBtn: { height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    btnText: { fontSize: 14, fontWeight: '700' },
    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 14 }
});