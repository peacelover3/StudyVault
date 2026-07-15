import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export type ThemeMode = 'dark' | 'light';

export const Themes = {
  dark: {
    bg: '#050805',          // Deep Forest
    bg2: '#0a0f0a',         
    text: '#e0e6e0',        
    textMuted: '#8a968a',   
    textDim: '#4a544a',     
    accent: '#3dbd8a',      // Favorite Green
    accentDim: '#2a7a5a',   
    accentGlow: 'rgba(61, 189, 138, 0.12)',
    border: 'rgba(255, 255, 255, 0.05)',
    borderAccent: 'rgba(61, 189, 138, 0.3)',
    cardColors: ['rgba(10, 15, 10, 0.8)', 'rgba(5, 8, 5, 0.5)'],
  },
  light: {
    bg: '#f7f9f7',          // Ivory Grove
    bg2: '#edf1ed',         
    text: '#0d1a14',        // Deep Obsidian Green
    textMuted: '#3d5c4d',   
    textDim: '#708a7e',     
    accent: '#1b4332',      
    accentDim: '#2d6a4f',   
    accentGlow: 'rgba(27, 67, 50, 0.06)',
    border: 'rgba(27, 67, 50, 0.1)',
    borderAccent: 'rgba(27, 67, 50, 0.25)',
    cardColors: ['rgba(237, 241, 243, 0.85)', 'rgba(247, 249, 247, 0.6)'],
  },
};

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  useAccentBorder?: boolean;
  theme: ThemeMode; // Added explicit control
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, useAccentBorder = false, theme }) => {
  const activeTheme = Themes[theme];
  const selectedBorder = useAccentBorder ? activeTheme.borderAccent : activeTheme.border;

  return (
    <LinearGradient
      colors={activeTheme.cardColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor: selectedBorder }, style]}
    >
      <View style={styles.innerBorder}>{children}</View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  innerBorder: { padding: 16 },
});