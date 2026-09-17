import { Redirect } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';

export default function Index() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/onboarding'} />;
}
