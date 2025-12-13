import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  // Also try setting it to empty with immediate expiration to be sure
  cookieStore.set('userId', '', { maxAge: 0, path: '/' });
  
  return NextResponse.json({ message: 'Logged out' });
}
