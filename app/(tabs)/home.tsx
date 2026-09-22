import { useState } from "react"

import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabScreenLayout } from '@/layout/tabLayout';

import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from "expo-router"

import Avatar from '@/components/ui/Avatar';

import NearbyCard from "@/components/home/NearbyCard"

import EventCard from "@/components/home/EventCard"

import SectionHeader from "@/components/ui/SectionHeader"

import Card from "@/components/ui/Card"
import NotificationBar from "@/components/ui/NotificationBar"
import GlassCard from "@/components/ui/GlassCard"
import CircleOfLoveCard from "@/components/campaign/CircleOfLoveCard"
import AnimatedCard from "@/components/motion/AnimatedCard"
import AnimatedList from "@/components/motion/AnimatedList"

import { colors, darkColors } from "@/constants/colors"

import { MOCK_EVENTS, MOCK_PLACES } from "@/data/mockData"
import { MOCK_USER } from '@/data/mockUser'
import { eventRoute, placeRoute, routes } from '@/navigation/routes'

import { useAppStore } from "@/store/useAppStore"
import { useTheme } from '@/context/ThemeProvider'
import { shareContent } from '@/services/sharing'
import { radius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

export default function Home() {
  const router = useRouter()
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const tabLayout = useTabScreenLayout()
  const isIOS = Platform.OS === 'ios'
  const [actionsWidth, setActionsWidth] = useState(0)
  // Keep three complete circles visible, including both gutters and the gaps.
  const actionsViewportWidth = actionsWidth || viewportWidth - insets.left - insets.right - spacing.md * 2
  const actionSize = Math.min(96, Math.max(0, (actionsViewportWidth - spacing.md * 2 - spacing.sm * 2) / 3))
  const { isDark } = useTheme()
  const logout = useAppStore((state) => state.logout)
  const selectPlace = useAppStore((state) => state.selectPlace)
  const selectEvent = useAppStore((state) => state.selectEvent)
  const showNotifications = useAppStore((state) => state.showNotifications)
  const setShowNotifications = useAppStore((state) => state.setShowNotifications)
  const [saved, setSaved] = useState<string[]>([])
  const [commentDraft, setCommentDraft] = useState('')
  const [comments, setComments] = useState([
    { id: 'c1', author: 'Aisha', text: 'Thank you for sharing this. So important.' },
  ])

  const initialNotifications = [
    { id: 'n1', title: 'Route update', detail: 'Your safe route is 3 min away from your next stop.', time: '2m ago' },
    { id: 'n2', title: 'New community post', detail: 'Lerato shared a new safety update in Cape Town.', time: '18m ago' },
    { id: 'n3', title: 'Verified contact', detail: 'Your emergency contact has accepted your check-in.', time: '1h ago' },
  ]

  const [notifications, setNotifications] = useState(initialNotifications)

  const toggle = (id: string) =>
    setSaved((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    )

  const shareChannels = [
    { label: 'Email', icon: 'mail-outline' as const },
    { label: 'Facebook', icon: 'logo-facebook' as const },
    { label: 'X', icon: 'logo-twitter' as const },
    { label: 'LinkedIn', icon: 'logo-linkedin' as const },
    { label: 'Instagram', icon: 'logo-instagram' as const },
  ]

  const handleCommunityShare = async () => {
    await shareContent({
      title: 'Pink Plug community update',
      message: 'Quick safety update: the area around Florida Road has had some increased incidents after midnight this week. Stay safe everyone.',
      url: 'https://thepinkplug.app/community',
    })
  }

  const addComment = () => {
    const trimmed = commentDraft.trim()
    if (!trimmed) return

    setComments((current) => [
      ...current,
      { id: `comment-${Date.now()}`, author: 'You', text: trimmed },
    ])
    setCommentDraft('')
  }

  return (
    <SafeAreaView edges={tabLayout.edges} style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView
        {...tabLayout.scrollProps}
        style={isIOS && styles.scrollIOS}
        contentContainerStyle={[styles.content, tabLayout.contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Modal
            visible={showNotifications}
            transparent
            animationType="fade"
            onRequestClose={() => setShowNotifications(false)}
          >
            <View style={styles.notificationModalOverlay}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close notifications"
                onPress={() => setShowNotifications(false)}
                style={styles.notificationBackdrop}
              />
              <GlassCard level="hero" edge="glow" style={styles.overlayCard}>
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, isDark && styles.darkText]}>Notifications</Text>
                  <Pressable onPress={() => setShowNotifications(false)}>
                    <Text style={styles.closeText}>Close</Text>
                  </Pressable>
                </View>
                {notifications.map((item) => (
                  <View key={item.id} style={styles.notificationItem}>
                    <View style={styles.notificationDot} />
                    <View style={styles.notificationBody}>
                      <Text style={[styles.notificationTitle, isDark && styles.darkText]}>{item.title}</Text>
                      <Text style={[styles.notificationDetail, isDark && styles.darkSecondaryText]}>{item.detail}</Text>
                      <Text style={[styles.notificationTime, isDark && styles.darkMutedText]}>{item.time}</Text>
                    </View>
                  </View>
                ))}
              </GlassCard>
            </View>
          </Modal>

          <Text style={[styles.eyebrow, isDark && styles.darkText]}>SANDTON • FRIDAY 11 SEPT</Text>
          <Text style={[styles.title, isDark && styles.darkText]}>The Pink Plug</Text>
          <View style={styles.greetingRow}>
            <Text style={[styles.subtitle, isDark && styles.darkSecondaryText]}>Welcome back, {MOCK_USER.name.split(' ')[0]}</Text>
            <Image
              source={require('@/imports/Fingerprint New_Images/Fingerprint New_ImgID1.png')}
              style={styles.greetingAvatar}
              accessibilityLabel="Fingerprint avatar"
            />
          </View>
        </View>

        <NotificationBar
          title="Emergency updates"
          subtitle="3 trusted contacts are active"
          ctaLabel="SOS"
          onPress={() => router.push(routes.safety)}
        />

        <ScrollView
          horizontal
          style={isIOS && styles.actionsViewportIOS}
          onLayout={isIOS ? (event) => setActionsWidth(event.nativeEvent.layout.width) : undefined}
          contentInsetAdjustmentBehavior={isIOS ? 'never' : undefined}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actions}
        >
          {([
            ["map-outline", "Pink Route", routes.route],
            ["location-outline", "Nearby", routes.explore],
            ["calendar-outline", "Events", routes.explore],
            ["book-outline", "Directory", routes.directory],
            ["car-outline", "Travel", routes.travel],
            ["shield-checkmark-outline", "Safety", routes.safety],
          ] as Array<[string, string, Href]>).map(([icon, label, href]) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() => router.push(href)}
              style={[styles.action, isDark && styles.actionDark, isIOS && { width: actionSize, height: actionSize, flexShrink: 0 }]}
            >
              <Ionicons name={icon as any} size={20} color={colors.primary} />
              <Text style={[styles.actionLabel, isDark && styles.darkSecondaryText]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <SectionHeader
          title="Featured campaign"
          action="View all"
          onAction={() => Alert.alert('Circle of Love', 'Support the community campaign and join the next event.')}
        />
        <View style={styles.featuredWrap}>
          <AnimatedCard viewportHeight={viewportHeight} pressFeedback>
            <CircleOfLoveCard layout="hero" />
          </AnimatedCard>
        </View>

        <SectionHeader
          title="Nearby Spaces"
          action="See all"
          onAction={() => router.push(routes.explore)}
        />
        <FlatList
          horizontal
          data={MOCK_PLACES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontal}
          renderItem={({ item, index }) => (
            <AnimatedCard index={index} style={isIOS ? { width: Math.max(0, actionsViewportWidth - spacing.md * 2) } : undefined}>
              <NearbyCard
                place={item}
                saved={saved.includes(item.id)}
                onToggleSave={() => toggle(item.id)}
                onPress={() => {
                  selectPlace(item)
                  router.push(placeRoute(item.id))
                }}
              />
            </AnimatedCard>
          )}
        />
        <SectionHeader
          title="Upcoming Events"
          action="See all"
          onAction={() => router.push(routes.explore)}
        />
        <View style={styles.stack}>
          {MOCK_EVENTS.slice(0, 3).map((event, index) => (
            <AnimatedCard key={event.id} index={index} viewportHeight={viewportHeight} pressFeedback>
              <EventCard
                event={event}
                onPress={() => {
                  selectEvent(event)
                  router.push(eventRoute(event.id))
                }}
              />
            </AnimatedCard>
          ))}
        </View>
        <SectionHeader
          title="Community Updates"
          action="Read all"
          onAction={() => router.push(routes.community)}
        />
        <AnimatedCard viewportHeight={viewportHeight} pressFeedback>
          <Card style={styles.communityCard}>
          <View style={styles.postAuthorRow}>
            <Ionicons name="location-outline" size={15} color={colors.primary} />
            <Text style={[styles.postAuthor, isDark && styles.darkText]}>Lerato Khumalo • 8h ago</Text>
          </View>
          <Text style={[styles.post, isDark && styles.darkSecondaryText]}>
            Quick safety update: the area around Florida Road has had some
            increased incidents after midnight this week. Stay safe everyone.
          </Text>

          <View style={styles.shareRow}>
            {shareChannels.map((channel) => (
              <Pressable
                key={channel.label}
                onPress={handleCommunityShare}
                style={styles.shareButton}
              >
                <Ionicons name={channel.icon} size={14} color={colors.primary} />
                <Text style={styles.shareButtonText}>{channel.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.commentSection}>
            <Text style={[styles.commentTitle, isDark && styles.darkText]}>Comments</Text>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentRow}>
                <Text style={styles.commentAuthor}>{comment.author}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))}

            <View style={styles.commentComposer}>
              <TextInput
                value={commentDraft}
                onChangeText={setCommentDraft}
                placeholder="Write a comment..."
                placeholderTextColor={colors.muted}
                style={styles.commentInput}
              />
              <Pressable
                onPress={addComment}
                style={[styles.commentButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.commentButtonText}>Post</Text>
              </Pressable>
            </View>
          </View>
          </Card>
        </AnimatedCard>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  scrollIOS: { flex: 1, width: '100%', backgroundColor: 'transparent' },
  actionsViewportIOS: { width: '100%', flexGrow: 0, flexShrink: 0 },
  safeDark: { backgroundColor: 'transparent' },
  darkText: { color: darkColors.textPrimary },
  darkSecondaryText: { color: darkColors.textSecondary },
  darkMutedText: { color: darkColors.muted },
  content: { paddingBottom: 110, paddingHorizontal: spacing.md },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    position: "relative",
    zIndex: 20,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  greetingAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    marginBottom: 18,
    position: "relative",
    zIndex: 60,
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    right: -4,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  avatarMenuWrap: {
    position: "relative",
    marginLeft: 0,
    zIndex: 80,
  },
  avatarButton: {
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
  },
  menuCard: {
    position: "absolute",
    top: 52,
    right: 0,
    width: 190,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 30,
    zIndex: 200,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuItemText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  overlayCard: {
    width: '100%',
    borderRadius: 22,
    padding: 16,
  },
  notificationModalOverlay: {
    flex: 1,
    paddingTop: 96,
    paddingHorizontal: 14,
  },
  notificationBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  closeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notificationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
  notificationBody: {
    flex: 1,
  },
  notificationTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  notificationDetail: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  notificationTime: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 6,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  logoutItem: {
    marginTop: 2,
  },
  logoutText: {
    color: colors.danger,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.label.fontSize,
    lineHeight: typography.label.lineHeight,
    fontWeight: typography.label.fontWeight,
    letterSpacing: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.screenTitle.fontSize,
    lineHeight: typography.screenTitle.lineHeight,
    fontWeight: typography.screenTitle.fontWeight,
    letterSpacing: typography.screenTitle.letterSpacing,
    marginTop: spacing.xxs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall.fontSize,
    lineHeight: typography.bodySmall.lineHeight,
    marginTop: spacing.xxs,
  },
  actions: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xl },
  action: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionDark: {
    backgroundColor: darkColors.surface,
    borderColor: darkColors.border,
  },
  featuredWrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  actionLabel: {
    color: colors.textSecondary,
    width: '100%',
    textAlign: 'center',
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    marginTop: spacing.xs,
    fontWeight: "600",
  },
  horizontal: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  stack: { gap: spacing.sm, marginBottom: spacing.xl, paddingHorizontal: spacing.md },
  communityCard: {
    alignSelf: 'stretch',
    marginHorizontal: 16,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postAuthor: { color: colors.textPrimary, fontWeight: "600", fontSize: 13 },
  post: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  shareRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3EBFF',
    borderWidth: 1,
    borderColor: '#E2D4FF',
  },
  shareButtonText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  commentSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commentTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  commentRow: {
    backgroundColor: '#F9F5FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EDE6FF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  commentAuthor: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  commentText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 12,
  },
  commentButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
})
