import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, darkColors } from '@/constants/colors';
import GlassCard from '@/components/ui/GlassCard';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeProvider';
import { shareContent } from '@/services/sharing';

export type CircleOfLoveLayout = 'horizontal' | 'vertical' | 'hero';

type ParticipationRole = 'Couple Joining Mass Wedding' | 'Guest / Supporter' | 'Media / Press';

type RsvpForm = {
  fullName: string;
  email: string;
  phone: string;
  role: ParticipationRole;
  message: string;
};

const campaign = {
  title: 'Circle of Love',
  host: 'Initiated by Thami Dish',
  date: '1 October 2026',
  location: 'Johannesburg, South Africa',
  image: require('@/imports/rings 2.jpg'),
  tags: ['Queer joy', 'Community', 'Historic', 'South Africa'],
  metrics: [
    { label: 'Couples', value: '160+' },
    { label: 'Supporters', value: '4.2K' },
    { label: 'Goal', value: 'Celebrate love' },
  ],
};

const shareMessage = 'Join or support the historic Circle of Love mass queer wedding campaign in South Africa!';
const roleOptions: ParticipationRole[] = [
  'Couple Joining Mass Wedding',
  'Guest / Supporter',
  'Media / Press',
];

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function CircleOfLoveCard({ layout = 'horizontal' }: { layout?: CircleOfLoveLayout }) {
  const { isDark } = useTheme();
  const [rsvpVisible, setRsvpVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rolePickerVisible, setRolePickerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<RsvpForm>({
    fullName: '',
    email: '',
    phone: '',
    role: 'Guest / Supporter',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RsvpForm, string>>>({});

  const isHero = layout === 'hero';
  const isIOSHero = Platform.OS === 'ios' && isHero;
  const isVertical = layout === 'vertical';

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof RsvpForm, string>> = {};

    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required.';
    if (!form.role) nextErrors.role = 'Please select a participation type.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitted(false);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setRsvpVisible(false);
        setForm({
          fullName: '',
          email: '',
          phone: '',
          role: 'Guest / Supporter',
          message: '',
        });
        setErrors({});
      }, 1200);
    }, 800);
  };

  const openShareLink = async (_channel: 'whatsapp' | 'x' | 'facebook' | 'linkedin') => {
    const didShare = await shareContent({
      title: 'Circle of Love',
      message: shareMessage,
      url: 'https://thepinkplug.app/circle-of-love',
    });

    if (didShare) {
      setShareVisible(false);
    }
  };

  const handleCopyLink = () => {
    setCopied(true);
    Alert.alert('Link copied to clipboard');
    setTimeout(() => setCopied(false), 1200);
  };

  const handleNativeShare = async () => {
    const didShare = await shareContent({
      title: 'Circle of Love',
      message: shareMessage,
      url: 'https://thepinkplug.app/circle-of-love',
    });

    if (didShare) {
      setShareVisible(false);
    }
  };

  return (
    <>
      <GlassCard
        style={[
          styles.card,
          isHero ? styles.heroCard : isVertical ? styles.verticalCard : styles.horizontalCard,
        ]}
        level="hero"
        gradientBorder="emphasized"
      >
        <View style={[isVertical || isHero ? styles.imageWrapStacked : styles.imageWrapRow, isIOSHero && styles.heroImageIOS]}>
          <Image
            source={campaign.image}
            resizeMode="cover"
            style={isVertical || isHero ? styles.imageFull : styles.imageSide}
          />
          <View style={styles.featureBadge}>
            <Ionicons name="sparkles" size={12} color={colors.primary} />
            <Text style={styles.featureBadgeText}>Featured Campaign</Text>
          </View>
        </View>

        <View style={[styles.contentWrap, isDark && styles.contentWrapDark, isIOSHero && styles.heroContentIOS]}>
          <View style={styles.tagRow}>
            {campaign.tags.map((tag) => (
              <View key={tag} style={[styles.tagPill, isDark && styles.tagPillDark]}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={[styles.title, isDark && styles.darkText]}>{campaign.title}</Text>
              <Text style={[styles.host, isDark && styles.darkSecondaryText]}>{campaign.host}</Text>
            </View>
            <Pressable style={[styles.heartButton, isDark && styles.heartButtonDark]} accessibilityRole="button" accessibilityLabel="Save campaign">
              <Ionicons name="heart" size={16} color={colors.primary} />
            </Pressable>
          </View>

          <View style={styles.metaBlock}>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.primary} />
              <Text style={[styles.metaText, isDark && styles.darkSecondaryText, isIOSHero && styles.shrinkIOS]}>{campaign.date}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={colors.primary} />
              <Text style={[styles.metaText, isDark && styles.darkSecondaryText, isIOSHero && styles.shrinkIOS]}>{campaign.location}</Text>
            </View>
          </View>

          <View style={styles.metricGrid}>
            {campaign.metrics.map((metric) => (
              <View key={metric.label} style={[styles.metricCard, isDark && styles.metricCardDark]}>
                <Text style={[styles.metricLabel, isDark && styles.darkSecondaryText]}>{metric.label}</Text>
                <Text style={[styles.metricValue, isDark && styles.darkText]}>{metric.value}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.actionsRow, isIOSHero && styles.actionsRowIOS]}>
            <Pressable className="circle-love-rsvp" style={[styles.primaryAction, isIOSHero && styles.actionIOS]} onPress={() => setRsvpVisible(true)}>
              <Ionicons name="people-outline" size={16} color="#fff" />
              <Text style={[styles.primaryActionText, isIOSHero && styles.actionTextIOS]}>RSVP / Register</Text>
            </Pressable>

            <Pressable className="circle-love-share" style={[styles.secondaryAction, isIOSHero && styles.actionIOS]} onPress={handleNativeShare}>
              <Ionicons name="share-social-outline" size={16} color={isDark ? colors.primary : colors.textPrimary} />
              <Text style={[styles.secondaryActionText, isIOSHero && styles.actionTextIOS]}>Share Campaign</Text>
            </Pressable>
          </View>
        </View>
      </GlassCard>

      <Modal transparent visible={rsvpVisible} animationType="slide" onRequestClose={() => setRsvpVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setRsvpVisible(false)} />
          <View style={[styles.drawer, isDark && styles.drawerDark]}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.drawerEyebrow}>RSVP</Text>
                <Text style={[styles.drawerTitle, isDark && styles.darkText]}>Register your interest</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={() => setRsvpVisible(false)}>
                <Ionicons name="close" size={18} color={isDark ? colors.primary : colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              <Text style={[styles.fieldLabel, isDark && styles.darkText]}>Full name</Text>
              <TextInput
                value={form.fullName}
                onChangeText={(value) => setForm((current) => ({ ...current, fullName: value }))}
                placeholder="Your full name"
                placeholderTextColor={isDark ? '#A895C0' : colors.muted}
                style={[styles.input, isDark && styles.inputDark]}
              />
              {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

              <View style={styles.twoColumnRow}>
                <View style={styles.halfField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkText]}>Email address</Text>
                  <TextInput
                    value={form.email}
                    onChangeText={(value) => setForm((current) => ({ ...current, email: value }))}
                    placeholder="name@email.com"
                    placeholderTextColor={isDark ? '#A895C0' : colors.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.input, isDark && styles.inputDark]}
                  />
                  {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                </View>
                <View style={styles.halfField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkText]}>WhatsApp / Phone</Text>
                  <TextInput
                    value={form.phone}
                    onChangeText={(value) => setForm((current) => ({ ...current, phone: value }))}
                    placeholder="+27 82 000 0000"
                    placeholderTextColor={isDark ? '#A895C0' : colors.muted}
                    keyboardType="phone-pad"
                    style={[styles.input, isDark && styles.inputDark]}
                  />
                  {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
                </View>
              </View>

              <Text style={[styles.fieldLabel, isDark && styles.darkText]}>Participation type</Text>
              <Pressable style={[styles.selectButton, isDark && styles.inputDark]} onPress={() => setRolePickerVisible(true)}>
                <Text style={[styles.selectText, isDark && styles.darkText]}>{form.role}</Text>
                <Ionicons name="chevron-down" size={16} color={isDark ? colors.primary : colors.textSecondary} />
              </Pressable>

              <Text style={[styles.fieldLabel, isDark && styles.darkText]}>Special requests / accessibility needs</Text>
              <TextInput
                value={form.message}
                onChangeText={(value) => setForm((current) => ({ ...current, message: value }))}
                placeholder="Tell us about accessibility needs, seating requests, or anything else"
                placeholderTextColor={isDark ? '#A895C0' : colors.muted}
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textArea, isDark && styles.inputDark]}
              />

              <Pressable
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Sending...' : submitted ? 'Submitted' : 'Submit RSVP'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={rolePickerVisible} animationType="fade" onRequestClose={() => setRolePickerVisible(false)}>
        <Pressable style={styles.roleOverlay} onPress={() => setRolePickerVisible(false)}>
          <View style={[styles.roleSheet, isDark && styles.drawerDark]}>
            {roleOptions.map((role) => (
              <Pressable
                key={role}
                onPress={() => {
                  setForm((current) => ({ ...current, role }));
                  setRolePickerVisible(false);
                }}
                style={[
                  styles.roleOption,
                  isDark && styles.roleOptionDark,
                  form.role === role && styles.roleOptionSelected,
                ]}
              >
                <Text style={[styles.roleOptionText, isDark && styles.darkText, form.role === role && styles.roleOptionTextSelected]}>{role}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={shareVisible} animationType="slide" onRequestClose={() => setShareVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShareVisible(false)} />
          <View style={[styles.drawer, isDark && styles.drawerDark]}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.drawerEyebrow}>Share</Text>
                <Text style={[styles.drawerTitle, isDark && styles.darkText]}>Spread the love</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={() => setShareVisible(false)}>
                <Ionicons name="close" size={18} color={isDark ? colors.primary : colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.shareList}>
              <Pressable style={[styles.shareOption, isDark && styles.shareOptionDark]} onPress={() => openShareLink('whatsapp')}>
                <Text style={[styles.shareOptionText, isDark && styles.darkText]}>WhatsApp</Text>
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              </Pressable>

              <Pressable style={[styles.shareOption, isDark && styles.shareOptionDark]} onPress={() => openShareLink('x')}>
                <Text style={[styles.shareOptionText, isDark && styles.darkText]}>X (Twitter)</Text>
                <Ionicons name="logo-twitter" size={18} color="#1D9BF0" />
              </Pressable>

              <Pressable style={[styles.shareOption, isDark && styles.shareOptionDark]} onPress={() => openShareLink('facebook')}>
                <Text style={[styles.shareOptionText, isDark && styles.darkText]}>Facebook</Text>
                <Ionicons name="logo-facebook" size={18} color="#1877F2" />
              </Pressable>

              <Pressable style={[styles.shareOption, isDark && styles.shareOptionDark]} onPress={() => openShareLink('linkedin')}>
                <Text style={[styles.shareOptionText, isDark && styles.darkText]}>LinkedIn</Text>
                <Ionicons name="logo-linkedin" size={18} color="#0A66C2" />
              </Pressable>

              <Pressable style={styles.copyButton} onPress={handleCopyLink}>
                <Ionicons name="copy-outline" size={16} color={isDark ? colors.primary : '#fff'} />
                <Text style={styles.copyButtonText}>{copied ? 'Link copied to clipboard' : 'Copy Link'}</Text>
              </Pressable>

              <Pressable style={[styles.nativeShareButton, isDark && styles.nativeShareButtonDark]} onPress={handleNativeShare}>
                <Text style={[styles.nativeShareButtonText, isDark && styles.darkText]}>More sharing options</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 0,
    overflow: 'hidden',
  },
  darkText: { color: darkColors.textPrimary },
  darkSecondaryText: { color: darkColors.textSecondary },
  heroCard: {
    width: '100%',
  },
  // The image follows the card's actual inner width; text determines body height.
  heroImageIOS: { height: undefined, aspectRatio: 3 / 2 },
  heroContentIOS: { flex: 0, minWidth: 0 },
  shrinkIOS: { flexShrink: 1 },
  actionsRowIOS: { flexWrap: 'wrap' },
  actionIOS: { flexBasis: 140, flexGrow: 1, flexShrink: 1, paddingHorizontal: 8, paddingVertical: 8 },
  actionTextIOS: { flexShrink: 1, textAlign: 'center' },
  horizontalCard: {
    flexDirection: 'row',
  },
  verticalCard: {
    flexDirection: 'column',
  },
  imageWrapRow: {
    width: 120,
    position: 'relative',
  },
  imageWrapStacked: {
    position: 'relative',
    width: '100%',
    height: 220,
    overflow: 'hidden',
  },
  imageSide: {
    width: 120,
    height: '100%',
  },
  imageFull: {
    width: '100%',
    height: '100%',
  },
  featureBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  featureBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: typography.semiBold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  contentWrap: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  contentWrapDark: { backgroundColor: darkColors.surface },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F2EAFF',
  },
  tagPillDark: {
    backgroundColor: darkColors.softSurface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  tagText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: typography.semiBold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: typography.semiBold,
    letterSpacing: -0.5,
  },
  host: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  heartButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3EBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartButtonDark: { backgroundColor: darkColors.softSurface },
  metaBlock: {
    marginTop: 14,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  metricCard: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F8F5FF',
    borderWidth: 1,
    borderColor: '#EFE5FF',
  },
  metricCardDark: { backgroundColor: darkColors.softSurface, borderColor: darkColors.border },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: typography.semiBold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: typography.semiBold,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: typography.semiBold,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: typography.semiBold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    maxHeight: '88%',
  },
  drawerDark: { backgroundColor: darkColors.surface, borderColor: darkColors.border, borderWidth: 1 },
  shareList: {
    gap: 10,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE2FF',
    backgroundColor: '#F9F5FF',
  },
  shareOptionDark: { backgroundColor: darkColors.softSurface, borderColor: darkColors.border },
  shareOptionText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: typography.semiBold,
  },
  nativeShareButton: {
    marginTop: 4,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E2FF',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  nativeShareButtonText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: typography.semiBold,
  },
  nativeShareButtonDark: { backgroundColor: darkColors.softSurface, borderColor: darkColors.border },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  drawerEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: typography.semiBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  drawerTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: typography.semiBold,
    marginTop: 4,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    paddingBottom: 8,
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: typography.semiBold,
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F5FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE2FF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
  },
  inputDark: { backgroundColor: darkColors.input, borderColor: darkColors.border, color: darkColors.textPrimary },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  halfField: {
    flex: 1,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F5FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE2FF',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    minHeight: 48,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: typography.semiBold,
    fontSize: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 11,
    marginTop: 6,
  },
  roleOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  roleSheet: {
    width: '86%',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EAE2FF',
    padding: 14,
    gap: 8,
  },
  roleOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F7F2FF',
  },
  roleOptionDark: { backgroundColor: darkColors.softSurface },
  roleOptionSelected: {
    backgroundColor: '#E7D9FF',
  },
  roleOptionText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  roleOptionTextSelected: {
    color: colors.primary,
  },
});
