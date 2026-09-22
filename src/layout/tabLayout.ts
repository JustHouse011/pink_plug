import { Platform, type ScrollViewProps } from 'react-native';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { spacing } from '@/constants/spacing';

// This is the existing bar's design height, not a device or viewport height.
export const FLOATING_TAB_HEIGHT = 100;

export function getTabLayout(bottomInset: number, platform: string, barHeight = FLOATING_TAB_HEIGHT) {
  // Insets must be relative to the tab viewport, not the full-window provider.
  const barBottom = platform === 'ios'
    ? bottomInset + spacing.xs
    : Math.max(bottomInset + 10, 24);

  return {
    barBottom,
    contentBottomPadding: barHeight + barBottom + spacing.md,
  };
}

const screenEdges: Edge[] = ['left', 'right'];
const managedScrollInsets: ScrollViewProps = {
  contentInsetAdjustmentBehavior: 'never',
  automaticallyAdjustContentInsets: false,
  automaticallyAdjustsScrollIndicatorInsets: false,
};

export function useTabScreenLayout() {
  const insets = useSafeAreaInsets();
  const barHeight = useBottomTabBarHeight();
  const { contentBottomPadding } = getTabLayout(insets.bottom, Platform.OS, barHeight);
  const isIOS = Platform.OS === 'ios';

  return {
    // Header owns the top; the bar and scroll clearance own the bottom.
    edges: isIOS ? screenEdges : undefined,
    contentStyle: isIOS ? { paddingBottom: contentBottomPadding } : undefined,
    scrollProps: isIOS ? {
      ...managedScrollInsets,
      scrollIndicatorInsets: { bottom: contentBottomPadding },
    } : {},
  };
}
