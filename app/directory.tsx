import { memo, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, ScrollView, Text, TextInput, Pressable, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, darkColors } from '@/constants/colors';
import { MOCK_USER } from '@/data/mockUser';
import { DIRECTORY_CATEGORIES, DIRECTORY_RESOURCES } from '@/data/directoryData';
import type { DirectoryResource } from '@/types';
import Card from '@/components/ui/Card';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import { useTheme } from '@/context/ThemeProvider';
import { routes } from '@/navigation/routes';

const searchableResources = DIRECTORY_RESOURCES.map((resource) => ({
  resource,
  searchText: `${resource.name} ${resource.category} ${resource.city} ${resource.area} ${resource.description}`.toLowerCase(),
}));

const DirectoryResourceCard = memo(function DirectoryResourceCard({ resource, isDark }: { resource: DirectoryResource; isDark: boolean }) {
  return (
    <Card style={styles.resourceCard}>
      <View style={styles.resourceHeader}>
        <View style={styles.categoryIcon}>
          <Ionicons name="heart-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.resourceInfo}>
          <Text style={[styles.resourceName, isDark && styles.darkText]}>{resource.name}</Text>
          <Text style={[styles.resourceMeta, isDark && styles.darkSecondaryText]}>{resource.category} - {resource.city}, {resource.area}</Text>
        </View>
      </View>
      <Text style={[styles.resourceDescription, isDark && styles.darkSecondaryText]}>{resource.description}</Text>
      <Text style={[styles.resourceDetail, isDark && styles.darkSecondaryText]}>{resource.detail}</Text>
      <Badge label={resource.badge} />
    </Card>
  );
});

export default function Directory() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const filteredResources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return searchableResources
      .filter(({ resource, searchText }) => {
        const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
        return matchesCategory && (!normalizedQuery || searchText.includes(normalizedQuery));
      })
      .map(({ resource }) => resource);
  }, [query, selectedCategory]);

  const header = (
    <>
      <Text style={styles.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>{'<'} Directory</Text>
      <Text accessibilityRole="header" style={[styles.title, isDark && styles.darkText]}>Community Directory</Text>
      <Text style={[styles.subtitle, isDark && styles.darkSecondaryText]}>Trusted queer people and places near you.</Text>
      <GlassCard level="subtle" edge="subtle" style={[styles.searchWrap, isDark && styles.searchDark]}>
        <Ionicons name="search-outline" size={20} color={colors.primary} />
        <TextInput
          accessibilityLabel="Search community directory"
          value={query}
          onChangeText={setQuery}
          placeholder="Search doctors, hospitals, therapists..."
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, isDark && styles.darkText]}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear directory search" onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.muted} />
          </Pressable>
        )}
      </GlassCard>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {DIRECTORY_CATEGORIES.map((category) => (
          <Chip key={category} label={category} active={selectedCategory === category} onPress={() => setSelectedCategory(category)} />
        ))}
      </ScrollView>
      <Card style={styles.summary}>
        <Text style={styles.summaryLabel}>Your community</Text>
        <Text style={[styles.summaryTitle, isDark && styles.darkText]}>{MOCK_USER.city}</Text>
        <Text style={[styles.summaryCopy, isDark && styles.darkSecondaryText]}>{filteredResources.length} resources match your search across healthcare, support, services and social spaces.</Text>
      </Card>
      <View style={styles.resultsHeader}>
        <Text style={[styles.section, isDark && styles.darkText]}>Community resources</Text>
        <Text style={[styles.resultCount, isDark && styles.darkSecondaryText]}>{filteredResources.length} results</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <FlatList
        data={filteredResources}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DirectoryResourceCard resource={item} isDark={isDark} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<Card style={styles.emptyCard}><Ionicons name="search-outline" size={28} color={colors.primary} /><Text style={[styles.emptyTitle, isDark && styles.darkText]}>No matching resources</Text><Text style={[styles.emptyCopy, isDark && styles.darkSecondaryText]}>Try another search term or choose All categories.</Text></Card>}
        ListFooterComponent={<Button label="Explore nearby spaces" onPress={() => router.push(routes.explore)} />}
        contentContainerStyle={styles.content}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' }, safeDark: { backgroundColor: 'transparent' },
  darkText: { color: darkColors.textPrimary }, darkSecondaryText: { color: darkColors.textSecondary },
  content: { padding: 20, paddingBottom: 120 }, back: { color: colors.primary, fontSize: 18, fontWeight: '600', marginBottom: 8 },
  title: { color: colors.textPrimary, fontSize: 29, fontWeight: '600' }, subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 18 },
  searchWrap: { minHeight: 52, borderRadius: 16, paddingVertical: 0, borderWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginBottom: 14 },
  searchDark: {}, searchInput: { flex: 1, minHeight: 50, color: colors.textPrimary, fontSize: 14 }, categoryRow: { gap: 8, paddingBottom: 18 },
  summary: { padding: 16, marginBottom: 18 }, summaryLabel: { color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }, summaryTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '600', marginTop: 8 }, summaryCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, section: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 10, marginTop: 6 }, resultCount: { color: colors.textSecondary, fontSize: 12, marginBottom: 10 },
  resourceCard: { padding: 14 }, resourceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }, categoryIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.softLavender, alignItems: 'center', justifyContent: 'center' }, resourceInfo: { flex: 1 }, resourceName: { color: colors.textPrimary, fontWeight: '600' }, resourceMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 3 }, resourceDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 6 }, resourceDetail: { color: colors.textSecondary, fontSize: 12, marginBottom: 10 }, emptyCard: { alignItems: 'center', padding: 26, gap: 8 }, emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' }, emptyCopy: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' }, separator: { height: 10 },
});
