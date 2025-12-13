import { NextRequest, NextResponse } from 'next/server';
import { getTeamByIdProjection } from '@/lib/db/projections';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: { teamId: string } | Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const team = await getTeamByIdProjection(teamId);
    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: team.id,
      name: team.name,
      radar: team.radar ?? [],
    });
  } catch (error) {
    const maybeParams = await params;
    console.error(`[api/teams/${maybeParams?.teamId ?? 'unknown'}/radar] failed:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
