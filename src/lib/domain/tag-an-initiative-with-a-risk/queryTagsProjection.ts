import { queryAllTags, getTagsForInitiative } from '@/lib/domain/tag-an-initiative-with-a-risk/tagsProjection';

// Expose the entire tags table as an array of { initiativeId, radarItemIds }
export function getAllTagsProjection() {
  return queryAllTags();
}

// Expose tags for a single initiative
export function getTagsForInitiativeProjection(initiativeId: string) {
  return getTagsForInitiative(initiativeId);
}
