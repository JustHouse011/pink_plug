import { apiCall, apiList } from './api';
import type { Campaign, CommunityPost, Paged, ParticipationRole, PostComment } from '@/types';

/** Community feed (E41-E47) and campaigns (E48-E51). */

export const COMMUNITY_CITIES = ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria'] as const;
export type CommunityCity = (typeof COMMUNITY_CITIES)[number];

/** E41 */
export function getFeed(params: { city?: CommunityCity; page?: number; limit?: number } = {}): Promise<Paged<CommunityPost>> {
  return apiList<CommunityPost>('/community/feed', { query: params });
}

/** E42 */
export function createPost(input: { content: string; city: CommunityCity }): Promise<CommunityPost> {
  return apiCall<CommunityPost>('/community/posts', { method: 'POST', body: input, idempotent: true });
}

/** E44 */
export function listComments(postId: string, params: { page?: number; limit?: number } = {}): Promise<Paged<PostComment>> {
  return apiList<PostComment>(`/community/posts/${encodeURIComponent(postId)}/comments`, { query: { limit: 100, ...params } });
}

/** E45 */
export function addComment(postId: string, text: string): Promise<PostComment> {
  return apiCall<PostComment>(`/community/posts/${encodeURIComponent(postId)}/comments`, { method: 'POST', body: { text }, idempotent: true });
}

/** E46 */
export function likePost(postId: string): Promise<{ postId: string; likedByMe: true; likes: number }> {
  return apiCall(`/community/posts/${encodeURIComponent(postId)}/reactions`, { method: 'POST', body: { reaction: 'like' } });
}

/** E47 */
export function unlikePost(postId: string): Promise<void> {
  return apiCall<void>(`/community/posts/${encodeURIComponent(postId)}/reactions`, { method: 'DELETE' });
}

/** E48 — null when nothing is featured. */
export function getFeaturedCampaign(): Promise<Campaign | null> {
  return apiCall<Campaign | null>('/campaigns/featured');
}

export interface RsvpInput {
  fullName: string;
  email: string;
  phone: string;
  role: ParticipationRole;
  message?: string;
}

/** E51 — one RSVP per member per campaign (409 CONFLICT on repeat). */
export function rsvpCampaign(campaignId: string, input: RsvpInput) {
  return apiCall<{ id: string; campaignId: string; createdAt: string }>(`/campaigns/${encodeURIComponent(campaignId)}/rsvp`, {
    method: 'POST',
    body: input,
    idempotent: true,
  });
}
