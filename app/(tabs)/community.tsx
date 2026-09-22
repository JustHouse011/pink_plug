import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTabScreenLayout } from '@/layout/tabLayout';
import { Ionicons } from '@expo/vector-icons';
import { colors, darkColors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeProvider';
import { MOCK_POSTS } from '@/data/mockData';
import type { CommunityPost } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { shareContent } from '@/services/sharing';

export default function Community() {
  const tabLayout = useTabScreenLayout();
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<CommunityPost[]>(MOCK_POSTS);
  const [liked, setLiked] = useState<string[]>([]);
  const [commenting, setCommenting] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [shared, setShared] = useState<string[]>([]);
  const [sharePost, setSharePost] = useState<{ id: string; author: string; content: string } | null>(null);
  const [composeVisible, setComposeVisible] = useState(false);
  const [postDraft, setPostDraft] = useState('');
  const [city, setCity] = useState('Cape Town');
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const handleComment = (postId: string) => {
    const comment = commentDrafts[postId]?.trim();
    if (!comment) return;

    setCommentCounts((current) => ({ ...current, [postId]: (current[postId] ?? 0) + 1 }));
    setCommentDrafts((current) => ({ ...current, [postId]: '' }));
    setCommenting(null);
  };

  const handleShare = async (postId: string, author: string, content: string) => {
    const didShare = await shareContent({
      title: 'Pink Plug community post',
      message: `${author}: ${content}`,
      url: 'https://thepinkplug.app/community',
    });

    if (didShare) {
      setShared((current) => (current.includes(postId) ? current : [...current, postId]));
      setShareNotice('Post shared successfully.');
      return;
    }

    setShareNotice('Share is unavailable on this device. The post remains in the community feed.');
  };

  const publishPost = async () => {
    const content = postDraft.trim();
    if (!content) return;

    const newPost: CommunityPost = {
      id: `local-${Date.now()}`,
      author: 'Bongani Nombamba',
      avatar: '🌈',
      handle: '@bonganinombamba',
      content,
      likes: 0,
      comments: 0,
      shares: 0,
      timeAgo: 'just now',
      city,
      tags: [],
    };

    setPosts((current) => [newPost, ...current]);
    setPostDraft('');
    setComposeVisible(false);
    setShareNotice('Post published locally. Share is available from the post actions.');
  };

  const handleSocialShare = async (_channel: 'whatsapp' | 'facebook' | 'x' | 'linkedin') => {
    if (!sharePost) return;

    const didShare = await shareContent({
      title: 'Pink Plug community post',
      message: `${sharePost.author}: ${sharePost.content}`,
      url: 'https://thepinkplug.app/community',
    });

    if (didShare) {
      setShared((current) => (current.includes(sharePost.id) ? current : [...current, sharePost.id]));
      setShareNotice('Post shared successfully.');
      setSharePost(null);
      return;
    }

    setShareNotice('Share is unavailable on this device. The post remains in the community feed.');
    setSharePost(null);
  };

  return (
    <SafeAreaView edges={tabLayout.edges} style={[styles.safe, isDark && styles.safeDark]}>
      <FlatList
        {...tabLayout.scrollProps}
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.content, tabLayout.contentStyle]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Text accessibilityRole="header" style={[styles.title, isDark && styles.darkText]}>Community</Text>
            <View style={styles.chips}>
              {['Cape Town', 'Johannesburg', 'Durban', 'Pretoria'].map((item) => (
                <Chip key={item} label={item} active={item === city} onPress={() => setCity(item)} />
              ))}
            </View>

            <Pressable onPress={() => setComposeVisible(true)} accessibilityRole="button" accessibilityLabel="Write a community post">
              <Card style={styles.composer}>
                <Avatar value={'🌈'} size={36} />
                <Text style={styles.placeholder}>Share with the {city} community...</Text>
                <Ionicons name="pencil-outline" size={18} color={isDark ? colors.primary : colors.muted} />
              </Card>
            </Pressable>
          </>
        }
        renderItem={({ item }) => {
          const isLiked = liked.includes(item.id);

          return (
            <Card style={styles.post}>
              <View style={styles.author}>
                <Avatar value={item.avatar} size={42} />
                <View style={styles.authorText}>
                  <Text style={[styles.name, isDark && styles.darkText]}>{item.author}</Text>
                  <Text style={[styles.meta, isDark && styles.darkSecondaryText]}>{item.handle} · {item.timeAgo} · {item.city}</Text>
                </View>
                <Ionicons name="ellipsis-horizontal" size={18} color={isDark ? colors.primary : colors.muted} />
              </View>

              <Text style={[styles.copy, isDark && styles.darkSecondaryText]}>{item.content}</Text>

              <View style={styles.tags}>
                {item.tags.map((tag) => (
                  <Text key={tag} style={styles.tag}>#{tag}</Text>
                ))}
              </View>

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Like post"
                  onPress={() =>
                    setLiked((current) =>
                      isLiked ? current.filter((id) => id !== item.id) : [...current, item.id]
                    )
                  }
                >
                  <Text style={[styles.actionText, isDark && styles.darkSecondaryText]}>
                    <Ionicons
                      name={isLiked ? 'heart' : 'heart-outline'}
                      size={15}
                      color={isLiked ? colors.danger : colors.textSecondary}
                    />{' '}
                    {item.likes + (isLiked ? 1 : 0)}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Comment on post"
                  onPress={() => setCommenting((current) => current === item.id ? null : item.id)}
                >
                  <Text style={[styles.actionText, isDark && styles.darkSecondaryText]}>
                    <Ionicons name="chatbubble-outline" size={15} color={isDark ? colors.primary : colors.textSecondary} />{' '}
                    {item.comments + (commentCounts[item.id] ?? 0)}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Share post"
                  onPress={() => handleShare(item.id, item.author, item.content)}
                >
                  <Text style={[styles.actionText, isDark && styles.darkSecondaryText]}>
                    <Ionicons name="share-social-outline" size={15} color={isDark ? colors.primary : colors.textSecondary} />{' '}
                    {item.shares + (shared.includes(item.id) ? 1 : 0)}
                  </Text>
                </Pressable>
              </View>

              {commenting === item.id && (
                <View style={styles.commentComposer}>
                  <TextInput
                    autoFocus
                    value={commentDrafts[item.id] ?? ''}
                    onChangeText={(value) => setCommentDrafts((current) => ({ ...current, [item.id]: value }))}
                    placeholder="Write a comment..."
                    placeholderTextColor={isDark ? darkColors.muted : colors.muted}
                    style={[styles.commentInput, isDark && styles.commentInputDark]}
                    returnKeyType="send"
                    onSubmitEditing={() => handleComment(item.id)}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Post comment"
                    onPress={() => handleComment(item.id)}
                    style={styles.commentButton}
                  >
                    <Text style={styles.commentButtonText}>Post</Text>
                  </Pressable>
                </View>
              )}
            </Card>
          );
        }}
      />
      <Modal visible={sharePost !== null} transparent animationType="fade" onRequestClose={() => setSharePost(null)}>
        <View style={styles.shareOverlay}>
          <View style={[styles.shareSheet, isDark && styles.shareSheetDark]}>
            <Text style={[styles.shareTitle, isDark && styles.darkText]}>Share post</Text>
            <Text style={[styles.shareSubtitle, isDark && styles.darkSecondaryText]}>Choose where to share this community update.</Text>
            <View style={styles.shareOptions}>
              <Pressable style={styles.shareOption} onPress={() => handleSocialShare('whatsapp')}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                <Text style={[styles.shareOptionText, isDark && styles.darkText]}>WhatsApp</Text>
              </Pressable>
              <Pressable style={styles.shareOption} onPress={() => handleSocialShare('facebook')}>
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                <Text style={[styles.shareOptionText, isDark && styles.darkText]}>Facebook</Text>
              </Pressable>
              <Pressable style={styles.shareOption} onPress={() => handleSocialShare('x')}>
                <Ionicons name="logo-twitter" size={20} color={isDark ? '#F8FAFC' : '#111827'} />
                <Text style={[styles.shareOptionText, isDark && styles.darkText]}>X</Text>
              </Pressable>
              <Pressable style={styles.shareOption} onPress={() => handleSocialShare('linkedin')}>
                <Ionicons name="logo-linkedin" size={20} color="#0A66C2" />
                <Text style={[styles.shareOptionText, isDark && styles.darkText]}>LinkedIn</Text>
              </Pressable>
            </View>
            <Pressable style={styles.cancelShareButton} onPress={() => setSharePost(null)}>
              <Text style={styles.cancelShareText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={composeVisible} transparent animationType="slide" onRequestClose={() => setComposeVisible(false)}>
        <View style={styles.composeOverlay}>
          <View style={[styles.composeSheet, isDark && styles.composeSheetDark]}>
            <View style={styles.composeHeader}>
              <Text style={[styles.composeTitle, isDark && styles.darkText]}>Create a post</Text>
              <Pressable onPress={() => setComposeVisible(false)} accessibilityLabel="Close composer">
                <Ionicons name="close" size={22} color={colors.primary} />
              </Pressable>
            </View>
            <TextInput
              autoFocus
              multiline
              value={postDraft}
              onChangeText={setPostDraft}
              placeholder={`Share something with the ${city} community...`}
              placeholderTextColor={isDark ? darkColors.muted : colors.muted}
              style={[styles.postInput, isDark && styles.postInputDark]}
            />
            <Pressable
              onPress={publishPost}
              disabled={!postDraft.trim()}
              style={[styles.publishButton, !postDraft.trim() && styles.publishButtonDisabled]}
            >
              <Text style={styles.publishButtonText}>Post and share</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  safeDark: { backgroundColor: 'transparent' },
  darkText: { color: darkColors.textPrimary },
  darkSecondaryText: { color: darkColors.textSecondary },
  content: { padding: 20, paddingBottom: 120 },
  title: { color: colors.textPrimary, fontSize: 29, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 14 },
  placeholder: { color: colors.muted, flex: 1, fontSize: 13 },
  post: { marginBottom: 12 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorText: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  copy: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 14 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: { color: colors.primary, backgroundColor: '#EEE7FF', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 11 },
  actions: { flexDirection: 'row', gap: 26, borderTopWidth: 1, borderColor: colors.border, marginTop: 14, paddingTop: 12 },
  actionText: { color: colors.textSecondary, fontSize: 13 },
  likedAction: { color: colors.danger },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  commentInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 12,
  },
  commentInputDark: {
    backgroundColor: darkColors.input,
    borderColor: darkColors.border,
    color: darkColors.textPrimary,
  },
  commentButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  shareOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 7, 18, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  shareSheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  shareSheetDark: {
    backgroundColor: darkColors.softSurface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  shareTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  shareSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 5,
    marginBottom: 16,
  },
  shareOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  shareOption: {
    flexGrow: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  shareOptionText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  cancelShareButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelShareText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  composeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 7, 18, 0.58)',
    justifyContent: 'flex-end',
  },
  composeSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },
  composeSheetDark: {
    backgroundColor: darkColors.softSurface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  composeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  composeTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  postInput: {
    minHeight: 130,
    backgroundColor: '#F9F5FF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    color: colors.textPrimary,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  postInputDark: {
    backgroundColor: darkColors.input,
    borderColor: darkColors.border,
    color: darkColors.textPrimary,
  },
  publishButton: {
    marginTop: 14,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
  },
  publishButtonDisabled: {
    opacity: 0.45,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

