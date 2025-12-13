import { NextResponse } from 'next/server';
import { getUsersProjection } from '@/lib/domain/userManagement/user-projection';

export async function GET() {
  try {
    const users = await getUsersProjection();
    return NextResponse.json(users);
  } catch (error) {
    console.error('[UserProjection] Error:', error);
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 });
  }
}
