import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, darkColors } from '@/constants/colors';
import GlassCard from '@/components/ui/GlassCard';
import type { Place } from '@/types';

export type SheetState = 'collapsed' | 'partial' | 'expanded';

type PlaceMapSheetProps = {
  place: Place | null;
  isDark: boolean;
  sheetState: SheetState;
  onStateChange: (state: SheetState) => void;
  onClose: () => void;
  onAddRoute: () => void;
  onOpenDetails: () => void;
  onShare: () => void;
  onCheckIn: () => void;
};

const verificationLabels: Record<string, string> = {
  queer_owned: 'Queer owned',
  queer_friendly: 'Queer friendly',
  community_verified: 'Community verified',
};

export default function PlaceMapSheet({
  place,
  isDark,
  sheetState,
  onStateChange,
  onClose,
  onAddRoute,
  onOpenDetails,
  onShare,
  onCheckIn,
}: PlaceMapSheetProps) {
  if (!place) return null;

  const nextState: Record<SheetState, SheetState> = {
    collapsed: 'partial',
    partial: 'expanded',
    expanded: 'collapsed',
  };

  const headerRow = (
    <Pressable style={styles.headerRow} onPress={() => onStateChange(nextState[sheetState])}>
      <View style={styles.headerTextWrap}>
        <Text style={[styles.placeName, isDark && styles.darkText]}>{place.name}</Text>
        <Text style={[styles.placeMeta, isDark && styles.darkSecondaryText]}>
          {place.category} • {place.distance}
        </Text>
      </View>
      <Pressable onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeText}>Close</Text>
      </Pressable>
    </Pressable>
  );

  const showPartial = sheetState === 'partial' || sheetState === 'expanded';
  const showExpanded = sheetState === 'expanded';

  return (
    <GlassCard
      level="strong"
      edge="subtle"
      intensity={isDark ? 48 : 32}
      style={[styles.sheet, isDark && styles.sheetDark]}
    >
      {headerRow}

      {showPartial && (
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Text style={[styles.metaLabel, isDark && styles.darkSecondaryText]}>★</Text>
            <Text style={[styles.metaValue, isDark && styles.darkText]}>{place.rating}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={[styles.metaLabel, isDark && styles.darkSecondaryText]}>Verified</Text>
            <Text style={[styles.metaValue, isDark && styles.darkText]}>
              {place.verifications.includes('community_verified') ? 'Community' : 'Queer'}
            </Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={[styles.metaLabel, isDark && styles.darkSecondaryText]}>Safety</Text>
            <Text style={[styles.metaValue, isDark && styles.darkText]}>{place.safetyScore}%</Text>
          </View>
        </View>
      )}

      {showPartial && (
        <View style={styles.actionRow}>
          <Pressable style={styles.primaryAction} onPress={onAddRoute}>
            <Text style={styles.primaryActionText}>Add to Route</Text>
          </Pressable>
          <Pressable style={[styles.secondaryAction, isDark && styles.secondaryActionDark]} onPress={onOpenDetails}>
            <Text style={[styles.secondaryText, isDark && styles.darkText]}>Details</Text>
          </Pressable>
          <Pressable style={[styles.secondaryAction, isDark && styles.secondaryActionDark]} onPress={onShare}>
            <Text style={[styles.secondaryText, isDark && styles.darkText]}>Share</Text>
          </Pressable>
        </View>
      )}

      {showExpanded && (
        <View style={styles.footer}>
          <Text style={[styles.address, isDark && styles.darkSecondaryText]}>{place.address}</Text>
          <Text style={[styles.summary, isDark && styles.darkText]}>
            {place.description}
          </Text>
          <View style={styles.badgeRow}>
            {place.verifications.map((verification) => (
              <Text key={verification} style={[styles.badge, isDark && styles.badgeDark]}>
                {verificationLabels[verification]}
              </Text>
            ))}
          </View>
          <Pressable style={[styles.checkInAction, isDark && styles.checkInActionDark]} onPress={onCheckIn}>
            <Text style={styles.checkInActionText}>Check In</Text>
          </Pressable>
        </View>
      )}

      {!showExpanded && (
        <Pressable style={[styles.checkInAction, isDark && styles.checkInActionDark]} onPress={onCheckIn}>
          <Text style={styles.checkInActionText}>Check In</Text>
        </Pressable>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 160,
    borderRadius: 28,
    padding: 16,
    zIndex: 30,
    elevation: 30,
  },
  sheetDark: {
    borderColor: darkColors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  placeName: {
    color: colors.textPrimary,
    fontSize: 23,
    fontWeight: '700',
  },
  placeMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  darkText: { color: darkColors.textPrimary },
  darkSecondaryText: { color: darkColors.textSecondary },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  closeText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(236,72,153,0.08)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.12)',
  },
  metaLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginRight: 5,
  },
  metaValue: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#E63CD8',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  secondaryAction: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.32)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  secondaryText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  footer: {
    paddingTop: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  address: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summary: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    backgroundColor: 'rgba(236,72,153,0.08)',
    color: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '600',
  },
  badgeDark: {
    backgroundColor: 'rgba(236,72,153,0.10)',
    color: '#F7C7F1',
  },
  checkInAction: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,196,140,0.12)',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,196,140,0.2)',
  },
  checkInActionDark: {
    backgroundColor: 'rgba(0,196,140,0.10)',
    borderColor: 'rgba(0,196,140,0.18)',
  },
  checkInActionText: {
    color: '#0A8A4F',
    fontWeight: '700',
    fontSize: 12,
  },
});
