import { Platform, Share } from 'react-native';

type ShareContent = {
  title: string;
  message: string;
  url?: string;
};

export async function shareContent({ title, message, url }: ShareContent): Promise<boolean> {
  const fullMessage = url ? `${message}\n${url}` : message;

  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title, text: message, url });
      return true;
    }

    await Share.share({ title, message: fullMessage });
    return true;
  } catch {
    return false;
  }
}
