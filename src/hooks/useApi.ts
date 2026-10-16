import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as catalogue from '@/services/catalogue';
import * as community from '@/services/community';
import * as users from '@/services/users';
import { useAppStore } from '@/store/useAppStore';
import type { CommunityPost, Paged, Place, TrustedContact, User, UserSettings } from '@/types';

/** Query keys for every cached backend resource. */
export const keys = {
  places: (q: catalogue.PlaceQuery = {}) => ['places', q] as const,
  place: (id: string) => ['place', id] as const,
  events: () => ['events'] as const,
  event: (id: string) => ['event', id] as const,
  directory: (q: { search?: string; category?: string }) => ['directory', q] as const,
  directoryCategories: () => ['directory-categories'] as const,
  safety: () => ['safety-resources'] as const,
  feed: (city?: string) => ['feed', city ?? 'all'] as const,
  comments: (postId: string) => ['comments', postId] as const,
  campaign: () => ['campaign-featured'] as const,
  me: () => ['me'] as const,
  settings: () => ['settings'] as const,
  savedPlaces: () => ['saved-places'] as const,
  contacts: () => ['trusted-contacts'] as const,
  notifications: () => ['notifications'] as const,
};

/** Reactive: queries for private data only run while signed in. */
const useSignedIn = () => useAppStore((s) => s.isAuthenticated);

// ─── Catalogue ──────────────────────────────────────────────────────────────

export const usePlaces = (q: catalogue.PlaceQuery = {}) =>
  useQuery({ queryKey: keys.places(q), queryFn: () => catalogue.listPlaces(q), enabled: useSignedIn() });

export const usePlace = (id?: string) =>
  useQuery({ queryKey: keys.place(id ?? ''), queryFn: () => catalogue.getPlace(id!), enabled: Boolean(id) });

export const useEvents = () => useQuery({ queryKey: keys.events(), queryFn: () => catalogue.listEvents(), enabled: useSignedIn() });

export const useEvent = (id?: string) =>
  useQuery({ queryKey: keys.event(id ?? ''), queryFn: () => catalogue.getEvent(id!), enabled: Boolean(id) });

export const useDirectory = (q: { search?: string; category?: string }) =>
  useQuery({ queryKey: keys.directory(q), queryFn: () => catalogue.listDirectoryResources(q), placeholderData: (prev) => prev });

export const useDirectoryCategories = () =>
  useQuery({ queryKey: keys.directoryCategories(), queryFn: catalogue.listDirectoryCategories, staleTime: Infinity });

export const useSafetyResources = () =>
  useQuery({ queryKey: keys.safety(), queryFn: catalogue.listSafetyResources, staleTime: 5 * 60_000 });

export function useCreateReview(target: 'place' | 'event', id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: catalogue.ReviewInput) =>
      target === 'place' ? catalogue.createPlaceReview(id, input) : catalogue.createEventReview(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: target === 'place' ? keys.place(id) : keys.event(id) });
      qc.invalidateQueries({ queryKey: [target === 'place' ? 'places' : 'events'] });
    },
  });
}

export function useRegisterForEvent(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; email: string; phone: string }) => catalogue.registerForEvent(eventId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.event(eventId) });
      qc.invalidateQueries({ queryKey: keys.events() });
    },
  });
}

// ─── Saved places ───────────────────────────────────────────────────────────

export const useSavedPlaces = () =>
  useQuery({ queryKey: keys.savedPlaces(), queryFn: users.listSavedPlaces, enabled: useSignedIn() });

/** Optimistically saves/unsaves a place; rolls back if the server refuses. */
export function useToggleSavedPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ place, saved }: { place: Place; saved: boolean }) =>
      saved ? users.savePlace(place.id).then(() => undefined) : users.unsavePlace(place.id),
    onMutate: async ({ place, saved }) => {
      await qc.cancelQueries({ queryKey: keys.savedPlaces() });
      const previous = qc.getQueryData<Place[]>(keys.savedPlaces());
      qc.setQueryData<Place[]>(keys.savedPlaces(), (list = []) =>
        saved ? (list.some((p) => p.id === place.id) ? list : [...list, place]) : list.filter((p) => p.id !== place.id),
      );
      return { previous };
    },
    onError: (_e, _v, context) => qc.setQueryData(keys.savedPlaces(), context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.savedPlaces() }),
  });
}

// ─── Community ──────────────────────────────────────────────────────────────

export const useFeed = (city?: community.CommunityCity) =>
  useQuery({ queryKey: keys.feed(city), queryFn: () => community.getFeed({ city, limit: 50 }), enabled: useSignedIn() });

export const useComments = (postId?: string) =>
  useQuery({ queryKey: keys.comments(postId ?? ''), queryFn: () => community.listComments(postId!), enabled: Boolean(postId) });

function patchPostInFeeds(qc: QueryClient, postId: string, patch: (post: CommunityPost) => CommunityPost) {
  qc.setQueriesData<Paged<CommunityPost>>({ queryKey: ['feed'] }, (page) =>
    page ? { ...page, items: page.items.map((p) => (p.id === postId ? patch(p) : p)) } : page,
  );
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: community.createPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ post }: { post: CommunityPost }): Promise<{ likes: number } | undefined> => {
      if (post.likedByMe) {
        await community.unlikePost(post.id);
        return undefined;
      }
      return community.likePost(post.id);
    },
    onMutate: ({ post }) =>
      patchPostInFeeds(qc, post.id, (p) => ({ ...p, likedByMe: !post.likedByMe, likes: Math.max(0, p.likes + (post.likedByMe ? -1 : 1)) })),
    onError: (_e, { post }) => patchPostInFeeds(qc, post.id, () => post),
    onSuccess: (result, { post }) => {
      if (result) patchPostInFeeds(qc, post.id, (p) => ({ ...p, likes: result.likes, likedByMe: true }));
    },
  });
}

export function useAddComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => community.addComment(postId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.comments(postId) });
      patchPostInFeeds(qc, postId, (p) => ({ ...p, comments: p.comments + 1 }));
    },
  });
}

export const useFeaturedCampaign = () =>
  useQuery({ queryKey: keys.campaign(), queryFn: community.getFeaturedCampaign, enabled: useSignedIn(), staleTime: 5 * 60_000 });

export function useCampaignRsvp() {
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: community.RsvpInput }) => community.rsvpCampaign(id, input) });
}

// ─── Current user ───────────────────────────────────────────────────────────

/** The signed-in user. Seeded from the store and written back to it so non-query readers stay current. */
export function useMe() {
  const storedUser = useAppStore((s) => s.user);
  const query = useQuery({
    queryKey: keys.me(),
    queryFn: users.getMe,
    enabled: useSignedIn(),
    initialData: storedUser ?? undefined,
    initialDataUpdatedAt: 0,
  });
  useEffect(() => {
    if (query.data && query.data !== useAppStore.getState().user) useAppStore.getState().setUser(query.data);
  }, [query.data]);
  return query;
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: users.updateMe,
    onSuccess: (user: User) => {
      qc.setQueryData(keys.me(), user);
      useAppStore.getState().setUser(user);
    },
  });
}

export const useSettings = () => useQuery({ queryKey: keys.settings(), queryFn: users.getSettings, enabled: useSignedIn() });

/** Optimistic settings toggle; restores the previous value on failure. */
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: users.updateSettings,
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: keys.settings() });
      const previous = qc.getQueryData<UserSettings>(keys.settings());
      if (previous) qc.setQueryData<UserSettings>(keys.settings(), { ...previous, ...patch });
      return { previous };
    },
    onError: (_e, _v, context) => context?.previous && qc.setQueryData(keys.settings(), context.previous),
    onSuccess: (settings) => {
      qc.setQueryData(keys.settings(), settings);
      useAppStore.getState().setLocationSharing(settings.shareLocation);
    },
  });
}

// ─── Trusted contacts ───────────────────────────────────────────────────────

export const useTrustedContacts = () =>
  useQuery({ queryKey: keys.contacts(), queryFn: users.listTrustedContacts, enabled: useSignedIn() });

export function useContactMutations() {
  const qc = useQueryClient();
  const setList = (fn: (list: TrustedContact[]) => TrustedContact[]) =>
    qc.setQueryData<TrustedContact[]>(keys.contacts(), (list = []) => fn(list));
  const refresh = () => qc.invalidateQueries({ queryKey: keys.contacts() });

  const add = useMutation({
    mutationFn: users.addTrustedContact,
    onSuccess: (contact) => setList((list) => [...list, contact]),
    onSettled: refresh,
  });
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<users.ContactInput> }) => users.updateTrustedContact(id, patch),
    onMutate: ({ id, patch }) => {
      const previous = qc.getQueryData<TrustedContact[]>(keys.contacts());
      setList((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      return { previous };
    },
    onError: (_e, _v, context) => qc.setQueryData(keys.contacts(), context?.previous),
    onSuccess: (contact) => setList((list) => list.map((c) => (c.id === contact.id ? contact : c))),
  });
  const remove = useMutation({
    mutationFn: users.removeTrustedContact,
    onMutate: (id) => {
      const previous = qc.getQueryData<TrustedContact[]>(keys.contacts());
      setList((list) => list.filter((c) => c.id !== id));
      return { previous };
    },
    onError: (_e, _v, context) => qc.setQueryData(keys.contacts(), context?.previous),
    onSettled: refresh,
  });
  return { add, update, remove };
}

// ─── Notifications ──────────────────────────────────────────────────────────

export const useNotifications = () =>
  useQuery({ queryKey: keys.notifications(), queryFn: () => users.listNotifications({ limit: 50 }), enabled: useSignedIn() });

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: users.markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifications() }),
  });
}
