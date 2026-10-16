import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Button from '@/components/ui/Button';
import { colors, darkColors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeProvider';
import { errorMessage } from '@/services/api';

interface LoadStateProps {
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyText?: string;
  style?: StyleProp<ViewStyle>;
}

/** Inline loading spinner, error message with retry, or empty-state text for API-backed lists. */
export default function LoadState({ loading, error, onRetry, emptyText, style }: LoadStateProps) {
  const { isDark } = useTheme();
  const textStyle = [styles.text, isDark && styles.darkText];

  if (loading) {
    return (
      <View style={[styles.wrap, style]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.wrap, style]}>
        <Text style={textStyle}>{errorMessage(error)}</Text>
        {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
      </View>
    );
  }
  if (emptyText) {
    return (
      <View style={[styles.wrap, style]}>
        <Text style={textStyle}>{emptyText}</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 24 },
  text: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  darkText: { color: darkColors.textSecondary },
});
