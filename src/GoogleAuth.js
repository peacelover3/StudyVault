import { useEffect } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore'; // Import the database engine

export const useGoogleAuth = () => {
  
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '224314971816-1htfagovdg0j61ump7ur1fko4jbutima.apps.googleusercontent.com',
      offlineAccess: false,
    });
  }, []);

  const signInWithGoogle = async (currentLocalTheme = 'default') => {
    try {
      // Check if Google Play Services are available
      const isAvailable = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      if (!isAvailable) {
        throw new Error('Google Play Services not available on this device');
      }

      // Small delay to ensure activity is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const signInResult = await GoogleSignin.signIn();
      
      const idToken = signInResult.data?.idToken || signInResult.idToken;
      if (!idToken) throw new Error('No ID Token received');

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      const user = userCredential.user;

      // 🔥 DATABASE SYNC: Save them to the "users" collection (non-blocking)
      firestore().collection('users').doc(user.uid).set({
        uid: user.uid,
        name: user.displayName || 'Anonymous Student',
        email: user.email,
        profilePic: user.photoURL || '',
        chosenTheme: currentLocalTheme,
        createdAt: firestore.FieldValue.serverTimestamp(),
      }, { merge: true }).catch((err) => {
        console.warn('⚠️ Firestore sync will retry:', err.message);
      });

      console.log('✅ Google auth successful!');
      return user;

    } catch (error) {
      console.error('❌ Google Auth Error:', {
        code: error.code,
        message: error.message,
        fullError: error
      });
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign-in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign-in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      } else if (error.message && error.message.includes('current activity is null')) {
        throw new Error('App not ready - please try again');
      } else {
        throw new Error(error.message || 'Google authentication failed');
      }
    }
  };

  return { signInWithGoogle };
};