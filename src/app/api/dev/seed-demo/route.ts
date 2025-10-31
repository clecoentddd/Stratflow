import { NextResponse } from 'next/server';
import { seedDemoCompany } from '@/lib/db/event-store';

export const dynamic = 'force-dynamic'; // Ensure this is a dynamic route

export async function POST() {
  try {
    console.log('Seeding demo data...');
    const result = await seedDemoCompany();
    console.log('Seed result:', result);
    
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message || 'Failed to seed demo data', error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: result.message || 'Demo data seeded successfully',
      totalEvents: result.totalEvents 
    });
  } catch (e: any) {
    console.error('Error in seed-demo API:', e);
    return NextResponse.json(
      { 
        ok: false, 
        message: 'Failed to seed demo data',
        error: e?.message || 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
