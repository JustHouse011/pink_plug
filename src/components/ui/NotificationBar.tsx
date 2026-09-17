import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeProvider';

interface NotificationBarProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onPress: () => void;
}

export default function NotificationBar({
  title,
  subtitle,
  ctaLabel,
  onPress,
}: NotificationBarProps) {
  const { isDark } = useTheme();
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconWrap}>
        <Ionicons name="notifications-outline" size={18} color={isDark ? colors.primary : '#fff'} />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <Pressable
        onPress={onPress}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={styles.buttonText}>{ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#231A37',
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    marginTop: 3,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonDark: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
