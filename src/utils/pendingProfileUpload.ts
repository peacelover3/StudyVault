import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PendingProfileUpload {
  uid: string;
  uri: string;
  fileName?: string | null;
  fileType?: string | null;
}

const PENDING_UPLOAD_KEY = '@pending_profile_upload';

export const savePendingProfileUpload = async (pending: PendingProfileUpload) => {
  await AsyncStorage.setItem(PENDING_UPLOAD_KEY, JSON.stringify(pending));
};

export const getPendingProfileUpload = async (): Promise<PendingProfileUpload | null> => {
  const raw = await AsyncStorage.getItem(PENDING_UPLOAD_KEY);
  return raw ? (JSON.parse(raw) as PendingProfileUpload) : null;
};

export const clearPendingProfileUpload = async () => {
  await AsyncStorage.removeItem(PENDING_UPLOAD_KEY);
};
