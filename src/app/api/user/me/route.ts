import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUsersProjection } from '@/lib/domain/userManagement/user-projection';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await getUsersProjection();
    const cookieStore = await cookies();
    const userIdFromCookie = cookieStore.get('userId')?.value;

    let user;
    if (userIdFromCookie) {
        user = users.find(u => u.userId === userIdFromCookie);
    }

    if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
