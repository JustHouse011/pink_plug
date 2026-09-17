import { useState } from "react"

import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native"

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router"

import Avatar from '@/components/ui/Avatar';

import NearbyCard from "@/components/home/NearbyCard"

import EventCard from "@/components/home/EventCard"

import SectionHeader from "@/components/ui/SectionHeader"

import Card from "@/components/ui/Card"
import NotificationBar from "@/components/ui/NotificationBar"
import CircleOfLoveCard from "@/components/campaign/CircleOfLoveCard"
import AnimatedCard from "@/components/motion/AnimatedCard"
import AnimatedList from "@/components/motion/AnimatedList"

import { colors } from "@/constants/colors"

import { MOCK_EVENTS, MOCK_PLACES, MOCK_USER } from "@/data/mockData"

import { useAppStore } from "@/store/useAppStore"
import { useTheme } from '@/context/ThemeProvider'

export default function Home() {
  const router = useRouter()
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
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {showNotifications && (
            <View style={styles.overlayCard}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Notifications</Text>
                <Pressable onPress={() => setShowNotifications(false)}>
                  <Text style={styles.closeText}>Close</Text>
                </Pressable>
              </View>
              {notifications.map((item) => (
                <View key={item.id} style={styles.notificationItem}>
                  <View style={styles.notificationDot} />
                  <View style={styles.notificationBody}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationDetail}>{item.detail}</Text>
                    <Text style={styles.notificationTime}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.eyebrow, isDark && styles.darkText]}>SANDTON • FRIDAY 11 SEPT</Text>
          <Text style={[styles.title, isDark && styles.darkText]}>The Pink Plug</Text>
          <Text style={[styles.subtitle, isDark && styles.darkSecondaryText]}>Welcome back, {MOCK_USER.name.split(' ')[0]} 🌈</Text>
        </View>

        <NotificationBar
          title="Emergency updates"
          subtitle="3 trusted contacts are active"
          ctaLabel="SOS"
          onPress={() => router.push('/safety')}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actions}
        >
          {[
            ["map-outline", "Pink Route", "/(tabs)/route"],
            ["location-outline", "Nearby", "/(tabs)/explore"],
            ["calendar-outline", "Events", "/(tabs)/explore"],
            ["book-outline", "Directory", "/directory"],
            ["car-outline", "Travel", "/travel"],
            ["shield-checkmark-outline", "Safety", "/safety"],
          ].map(([icon, label, href]) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() => router.push(href as never)}
              style={styles.action}
            >
              <Ionicons name={icon as any} size={20} color={colors.primary} />
              <Text style={styles.actionLabel}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <SectionHeader
          title="Featured campaign"
          action="View all"
          onAction={() => Alert.alert('Circle of Love', 'Support the community campaign and join the next event.')}
        />
        <View style={styles.featuredWrap}>
          <AnimatedCard>
            <CircleOfLoveCard layout="hero" />
          </AnimatedCard>
        </View>

        <SectionHeader
          title="Nearby Spaces"
          action="See all"
          onAction={() => router.push("/(tabs)/explore")}
        />
        <FlatList
          horizontal
          data={MOCK_PLACES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontal}
          renderItem={({ item }) => (
            <AnimatedCard>
              <NearbyCard
                place={item}
                saved={saved.includes(item.id)}
                onToggleSave={() => toggle(item.id)}
                onPress={() => {
                  selectPlace(item)
                  router.push(`/places/${item.id}` as never)
                }}
              />
            </AnimatedCard>
          )}
        />
        <SectionHeader
          title="Upcoming Events"
          action="See all"
          onAction={() => router.push("/(tabs)/explore")}
        />
        <AnimatedList>
          <View style={styles.stack}>
          {MOCK_EVENTS.slice(0, 3).map((event) => (
            <AnimatedCard key={event.id}>
              <EventCard
                event={event}
                onPress={() => {
                  selectEvent(event)
                  router.push(`/events/${event.id}` as never)
                }}
              />
            </AnimatedCard>
          ))}
          </View>
        </AnimatedList>
        <SectionHeader
          title="Community Updates"
          action="Read all"
          onAction={() => router.push("/(tabs)/community")}
        />
        <AnimatedCard>
          <Card style={styles.communityCard}>
          <View style={styles.postAuthorRow}>
            <Ionicons name="location-outline" size={15} color={colors.primary} />
            <Text style={styles.postAuthor}>Lerato Khumalo • 8h ago</Text>
          </View>
          <Text style={styles.post}>
            Quick safety update: the area around Florida Road has had some
            increased incidents after midnight this week. Stay safe everyone.
          </Text>

          <View style={styles.shareRow}>
            {shareChannels.map((channel) => (
              <Pressable
                key={channel.label}
                onPress={() => Alert.alert('Share', `Sharing via ${channel.label}`)}
                style={styles.shareButton}
              >
                <Ionicons name={channel.icon} size={14} color={colors.primary} />
                <Text style={styles.shareButtonText}>{channel.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.commentTitle}>Comments</Text>
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
  safe: { flex: 1, backgroundColor: colors.background },
  safeDark: { backgroundColor: '#0A0712' },
  darkText: { color: '#F8FAFC' },
  darkSecondaryText: { color: '#C4B5D9' },
  content: { paddingBottom: 110, paddingHorizontal: 16 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    position: "relative",
    zIndex: 20,
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
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    zIndex: 140,
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 20,
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
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 29,
    fontWeight: "600",
    marginTop: 6,
  },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  actions: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 20 },
  action: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.softLavender,
  },
  featuredWrap: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  actionLabel: {
    color: colors.textSecondary,
    width: '100%',
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 11,
    marginTop: 7,
    fontWeight: "600",
  },
  horizontal: { gap: 12, paddingHorizontal: 16, paddingBottom: 24 },
  stack: { gap: 10, marginBottom: 24, paddingHorizontal: 16 },
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

