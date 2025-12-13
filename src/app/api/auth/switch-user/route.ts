import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ message: 'userId is required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set('userId', userId, { path: '/' });

  return NextResponse.json({ message: 'User switched', userId });
}
