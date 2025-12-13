import { NextResponse } from 'next/server';
import { _getAllEvents } from '@/lib/db/event-store';

export async function GET() {
  try {
    const events = await _getAllEvents();
    
    // Create a response with the JSON data
    const response = new NextResponse(JSON.stringify(events, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="events-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
    
    return response;
  } catch (error) {
    console.error('Failed to export events:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
