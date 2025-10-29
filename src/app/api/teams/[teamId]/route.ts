
import { NextResponse, NextRequest } from 'next/server';
import { getTeamByIdProjection } from '@/lib/db/projections';


// --- Vertical Slice: GET Team by ID ---
export async function GET(request: NextRequest, { params }: { params: { teamId: string } | Promise<{ teamId: string }> }) {
  try {
    const { teamId } = (await params) as { teamId: string };
    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }
    return NextResponse.json(team);
  } catch (error) {
    // params may be a promise; await before using
    const maybeParams = (await params) as { teamId?: string };
    console.error(`Failed to get team ${maybeParams.teamId || 'unknown'}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
