import { NextResponse } from 'next/server';
import { getTagsForInitiative } from '@/lib/domain/tag-an-initiative-with-a-risk/tagsProjection';
import { getAllTagsProjection } from '@/lib/domain/tag-an-initiative-with-a-risk/queryTagsProjection';

// Example: /monitoring/projection/tags?initiativeId=xyz
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const initiativeId = searchParams.get('initiativeId');
  if (initiativeId) {
    const tags = getTagsForInitiative(initiativeId);
    return NextResponse.json({ initiativeId, tags });
  } else {
    // Return all tags projection data as an array
    const allTags = getAllTagsProjection();
    return NextResponse.json({ tagsProjection: allTags });
  }
}
