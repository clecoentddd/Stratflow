import { NextResponse, NextRequest } from 'next/server';
import type { CreateInitiativeCommand, UpdateInitiativeCommand, DeleteInitiativeCommand } from '@/lib/domain/initiatives/commands';
import { InitiativesCommandHandlers } from '@/lib/domain/initiatives/commandHandler';



// --- Vertical Slice: Create Initiative ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const teamId = request.nextUrl.searchParams.get('teamId') ?? body.teamId;
    const command: CreateInitiativeCommand = body;

    if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });

    const result = await InitiativesCommandHandlers.handleCreateInitiative(teamId, command);
    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Failed to create initiative:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = ['required', 'not found'].some(phrase => message.includes(phrase)) ? 
      (message.includes('not found') ? 404 : 400) : 500;
    return NextResponse.json({ message }, { status });
  }
}

// --- Vertical Slice: Update Initiative ---
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const teamId = request.nextUrl.searchParams.get('teamId') ?? body.teamId;
    const command: UpdateInitiativeCommand = body;

    if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });

    const result = await InitiativesCommandHandlers.handleUpdateInitiative(teamId, command);
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Failed to update initiative:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = ['required', 'not found'].some(phrase => message.includes(phrase)) ? 
      (message.includes('not found') ? 404 : 400) : 500;
    return NextResponse.json({ message }, { status });
  }
}

// --- Vertical Slice: Delete Initiative ---
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const teamId = request.nextUrl.searchParams.get('teamId') ?? body.teamId;
    const command: DeleteInitiativeCommand = body;

    if (!teamId) return NextResponse.json({ message: 'teamId is required (query or body)' }, { status: 400 });

    const result = await InitiativesCommandHandlers.handleDeleteInitiative(teamId, command);
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Failed to delete initiative:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = ['required', 'not found'].some(phrase => message.includes(phrase)) ? 
      (message.includes('not found') ? 404 : 400) : 500;
    return NextResponse.json({ message }, { status });
  }
}
