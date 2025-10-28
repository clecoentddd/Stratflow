
import { NextResponse, NextRequest } from 'next/server';
import { getTeamByIdProjection } from '@/lib/db/projections';


// --- Vertical Slice: GET Team by ID ---
export async function GET(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const team = await getTeamByIdProjection(params.teamId);
    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }
    return NextResponse.json(team);
  } catch (error) {
    console.error(`Failed to get team ${params.teamId}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
