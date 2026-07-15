import { Platform } from 'react-native';

const IMGBB_API_KEY = process.env.IMGBB_API_KEY ?? '1da22933c14319766e37a882ce163fb8';
const IMGBB_UPLOAD_URL = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;

const normalizeUri = (uri: string) => {
  if (Platform.OS === 'ios') {
    return uri.replace('file://', '');
  }
  return uri;
};

export const uploadImageToImgbb = async (
  uri: string,
  fileName?: string | null,
  fileType?: string | null,
): Promise<string> => {
  if (!uri) {
    throw new Error('Image URI is required for upload.');
  }

  const normalizedUri = normalizeUri(uri);
  const formData = new FormData();
  formData.append('image', {
    uri: normalizedUri,
    type: fileType ?? 'image/jpeg',
    name: fileName ?? 'profile_picture.jpg',
  } as any);

  const response = await fetch(IMGBB_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  const json = await response.json();
  if (!response.ok || !json?.data?.url) {
    const errorMessage = json?.error?.message || json?.status_text || 'Unknown upload error.';
    throw new Error(`ImgBB upload failed: ${errorMessage}`);
  }

  return json.data.url as string;
};
