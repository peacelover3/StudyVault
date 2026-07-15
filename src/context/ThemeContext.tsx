import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  time: string;
}

export const Themes = {
  light: {
    isDark: false,
    bg: '#f7f9f7',
    bg2: 'rgba(237, 241, 243, 0.65)',
    text: '#0d1a14',
    textMuted: '#3d5c4d',
    textDim: '#708a7e',
    accent: '#1b4332',
    accentDim: '#2d6a4f',
    accentGlow: 'rgba(27, 67, 50, 0.06)',
    border: 'rgba(27, 67, 50, 0.15)',
    borderAccent: 'rgba(27, 67, 50, 0.25)',
    cardColors: ['rgba(237, 241, 243, 0.85)', 'rgba(247, 249, 247, 0.6)'] as const
  },
  dark: {
    isDark: true,
    bg: '#050805',
    bg2: 'rgba(10, 15, 10, 0.65)',
    text: '#e0e6e0',
    textMuted: '#8a968a',
    textDim: '#4a544a',
    accent: '#3dbd8a',
    accentDim: '#2a7a5a',
    accentGlow: 'rgba(61, 189, 138, 0.12)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderAccent: 'rgba(61, 189, 138, 0.3)',
    cardColors: ['rgba(10, 15, 10, 0.8)', 'rgba(5, 8, 5, 0.5)'] as const
  },
  desert: {
    isDark: false,
    bg: '#fbf6ec',
    bg2: 'rgba(243, 230, 211, 0.7)',
    text: '#4a3b2c',
    textMuted: '#7c654e',
    textDim: '#a68e74',
    accent: '#c08242',
    accentDim: '#965f2b',
    accentGlow: 'rgba(192, 130, 66, 0.08)',
    border: 'rgba(74, 59, 44, 0.12)',
    borderAccent: 'rgba(192, 130, 66, 0.25)',
    cardColors: ['rgba(243, 230, 211, 0.8)', 'rgba(251, 246, 236, 0.6)'] as const
  },
  greenishBlack: {
    isDark: true,
    bg: '#020d06',
    bg2: 'rgba(6, 26, 12, 0.65)',
    text: '#d2f1dc',
    textMuted: '#7fa389',
    textDim: '#47634f',
    accent: '#10b981',
    accentDim: '#047857',
    accentGlow: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(20, 184, 166, 0.1)',
    borderAccent: 'rgba(16, 185, 129, 0.3)',
    cardColors: ['rgba(6, 26, 12, 0.8)', 'rgba(2, 13, 6, 0.5)'] as const
  },
  greenishYellow: {
    isDark: false,
    bg: '#f9fbe7',
    bg2: 'rgba(240, 244, 195, 0.7)',
    text: '#33691e',
    textMuted: '#558b2f',
    textDim: '#827717',
    accent: '#afb42b',
    accentDim: '#9e9d24',
    accentGlow: 'rgba(175, 180, 43, 0.1)',
    border: 'rgba(51, 105, 30, 0.15)',
    borderAccent: 'rgba(175, 180, 43, 0.3)',
    cardColors: ['rgba(240, 244, 195, 0.85)', 'rgba(249, 24b, 231, 0.6)'] as const
  }
};

export interface ThemeType {
  isDark: boolean;
  bg: string;
  bg2: string;
  text: string;
  textMuted: string;
  textDim: string;
  accent: string;
  accentDim: string;
  accentGlow: string;
  border: string;
  borderAccent: string;
  cardColors: readonly [string, string];
}

type ThemeMode = 'dark' | 'light' | 'system';
export type BgStyle = 'solid' | 'matrix' | 'glassGrid' | 'cyberGlow' | '1' | '2' | '3' | '4' | 'dark' | 'desert' | 'greenishBlack' | 'greenishYellow';

interface ThemeContextProps {
  currentSubject: string;
  setCurrentSubject: (subject: string) => void;
  subjectOptions: string[];
  addNewSubject: (subject: string) => Promise<void>;
  studyDuration: string;
  setStudyDuration: (duration: string) => void;
  themeMode: ThemeMode;
  theme: ThemeType;
  setThemeMode: (mode: ThemeMode) => void;
  currentBg: BgStyle;
  setCurrentBg: (bg: BgStyle) => void;
  studentName: string;
  setStudentName: (name: string) => void;
  avatarUri: string | null;
  setAvatarUri: (uri: string | null) => void;
  isOnboarded: boolean;
  completeOnboarding: (name: string, mode: ThemeMode) => Promise<void>;
  resetAllData: () => Promise<void>;
  globalMessages: Message[];
  setGlobalMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const defaultSubjects = ['CS: Matrices', 'CS: Logic Gates', 'Math: Analytical Geometry'];
  
  const [subjectOptions, setSubjectOptions] = useState<string[]>(defaultSubjects);
  const [currentSubject, setCurrentSubjectState] = useState<string>(defaultSubjects[0]);
  const [studyDuration, setStudyDurationState] = useState<string>('45m');
  const [currentBg, setCurrentBgState] = useState<BgStyle>('solid');
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [studentName, setStudentNameState] = useState<string>('');
  const [avatarUri, setAvatarUriState] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [globalMessages, setGlobalMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: "This is Peace AI, Tell me about your class, boards and goals and ask for help. I don't like anything but to study.", 
      isUser: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedName = await AsyncStorage.getItem('@student_name');
        const storedTheme = await AsyncStorage.getItem('@theme_mode');
        const storedAvatar = await AsyncStorage.getItem('@avatar_uri');
        const onboardedStatus = await AsyncStorage.getItem('@is_onboarded');
        const storedSubject = await AsyncStorage.getItem('@current_subject');
        const storedDuration = await AsyncStorage.getItem('@study_duration');
        const storedSubjectsList = await AsyncStorage.getItem('@subjects_list');
        const storedBg = await AsyncStorage.getItem('@current_bg');

        if (storedName) setStudentNameState(storedName);
        if (storedTheme) setThemeModeState(storedTheme as ThemeMode);
        if (storedAvatar) setAvatarUriState(storedAvatar);
        if (onboardedStatus === 'true') setIsOnboarded(true);
        if (storedBg) setCurrentBgState(storedBg as BgStyle);
        if (storedDuration) setStudyDurationState(storedDuration);
        
        if (storedSubjectsList) {
          setSubjectOptions(JSON.parse(storedSubjectsList));
        }
        if (storedSubject) setCurrentSubjectState(storedSubject);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStoredData();
  }, []);

  const setCurrentBg = async (bg: BgStyle) => {
    setCurrentBgState(bg);
    await AsyncStorage.setItem('@current_bg', bg);
  };

  const addNewSubject = async (newSub: string) => {
    if (!newSub.trim() || subjectOptions.includes(newSub.trim())) return;
    const updatedList = [...subjectOptions, newSub.trim()];
    setSubjectOptions(updatedList);
    await AsyncStorage.setItem('@subjects_list', JSON.stringify(updatedList));
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem('@theme_mode', mode);
  };

  const setStudentName = async (name: string) => {
    setStudentNameState(name);
    await AsyncStorage.setItem('@student_name', name);
  };

  const setAvatarUri = async (uri: string | null) => {
    setAvatarUriState(uri);
    if (uri) await AsyncStorage.setItem('@avatar_uri', uri);
    else await AsyncStorage.removeItem('@avatar_uri');
  };

  const completeOnboarding = async (name: string, mode: ThemeMode) => {
    setStudentNameState(name);
    setThemeModeState(mode);
    setIsOnboarded(true);
    await AsyncStorage.setItem('@student_name', name);
    await AsyncStorage.setItem('@theme_mode', mode);
    await AsyncStorage.setItem('@is_onboarded', 'true');
  };

  const resetAllData = async () => {
    await AsyncStorage.clear();
    setStudentNameState('');
    setThemeModeState('system');
    setAvatarUriState(null);
    setIsOnboarded(false);
    setSubjectOptions(defaultSubjects);
    setCurrentSubjectState(defaultSubjects[0]);
    setStudyDurationState('45m');
    setCurrentBgState('solid');
  };

  const setCurrentSubject = async (subject: string) => {
    setCurrentSubjectState(subject);
    await AsyncStorage.setItem('@current_subject', subject);
  };

  const setStudyDuration = async (duration: string) => {
    setStudyDurationState(duration);
    await AsyncStorage.setItem('@study_duration', duration);
  };

  // Dynamically map active styles directly over layout selections
  const getComputedTheme = (): ThemeType => {
    if (currentBg === 'desert') return Themes.desert;
    if (currentBg === 'greenishBlack') return Themes.greenishBlack;
    if (currentBg === 'greenishYellow') return Themes.greenishYellow;
    if (currentBg === 'dark') return Themes.dark;
    if (currentBg === 'solid') {
      if (themeMode === 'system') {
        return systemScheme === 'dark' ? Themes.dark : Themes.light;
      }
      return themeMode === 'dark' ? Themes.dark : Themes.light;
    }
    // Fallback theme schema layout for image assets
    return Themes.dark;
  };

  if (loading) return null;

  return (
    <ThemeContext.Provider value={{
      currentSubject,
      setCurrentSubject,
      subjectOptions,
      addNewSubject,
      studyDuration,
      setStudyDuration,
      themeMode,
      theme: getComputedTheme(),
      setThemeMode,
      currentBg,
      setCurrentBg,
      studentName,
      setStudentName,
      avatarUri,
      setAvatarUri,
      isOnboarded,
      completeOnboarding,
      resetAllData,
      globalMessages,
      setGlobalMessages,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};