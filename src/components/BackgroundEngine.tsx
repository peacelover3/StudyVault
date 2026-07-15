import React from 'react';
import { StyleSheet, ImageBackground, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const bgImages: { [key: string]: any } = {
  '1': require('../assets/images/1.webp'),
  '2': require('../assets/images/2.webp'),
  '3': require('../assets/images/3.webp'),
  '4': require('../assets/images/4.webp'),
};

export const BackgroundEngine = () => {
  const { currentBg, theme } = useTheme();

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]}>
      {['1', '2', '3', '4'].includes(currentBg) && (
        <ImageBackground 
          source={bgImages[currentBg]} 
          style={StyleSheet.absoluteFill} 
          resizeMode="cover" 
        />
      )}
    </View>
  );
};