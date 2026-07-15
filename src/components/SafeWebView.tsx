import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';

interface SafeWebViewProps {
  url: string;
  onClose: () => void;
}

export const SafeWebView: React.FC<SafeWebViewProps> = ({ url, onClose }) => {
  const { theme } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modern React Native subscription-based hardware back handling
  useEffect(() => {
    const handleBackButton = () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      onClose();
      return true;
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', handleBackButton);
    
    // Clean up using the subscription object method directly
    return () => backSubscription.remove();
  }, [onClose]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      
      {/* Premium Minimal Browser Header Row */}
      <View style={[styles.header, { backgroundColor: theme.bg2, borderColor: theme.borderAccent }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={styles.closeBtn}>
          <Text style={{ color: theme.accent, fontWeight: '800', fontSize: 15 }}>✕ Close Vault</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textMuted }]} numberOfLines={1}>
          {url.replace('https://', '')}
        </Text>
      </View>

      {/* Internal Web View Node */}
      {!isOffline ? (
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={{ flex: 1, backgroundColor: theme.bg }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setIsOffline(true)}
          onHttpError={() => setIsOffline(true)}
        />
      ) : (
        /* The Shield Connection UI Component */
        <View style={[styles.errorContainer, { backgroundColor: theme.bg }]}>
          <Text style={[styles.errorEmoji, { color: theme.accent }]}>📡</Text>
          <Text style={[styles.errorTitle, { color: theme.text }]}>Connection Interrupted</Text>
          <Text style={[styles.errorDesc, { color: theme.textMuted }]}>
            StudyVault could not reach the server portal matrix. Check your local network signals and try again.
          </Text>
          <TouchableOpacity 
            activeOpacity={0.55} 
            onPress={() => setIsOffline(false)} 
            style={[styles.retryBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={{ color: theme.bg, fontWeight: '800' }}>Reconnect Terminal</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Premium Loader Overlay */}
      {loading && !isOffline && (
        <ActivityIndicator 
          size="small" 
          color={theme.accent} 
          style={[styles.loader, { backgroundColor: theme.bg }]} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderWidth: 1, elevation: 4 },
  closeBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  title: { flex: 1, fontSize: 13, textAlign: 'right', fontWeight: '600', opacity: 0.8 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorEmoji: { fontSize: 44, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  errorDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  retryBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24 },
  loader: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' }
});