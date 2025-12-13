import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { handleAddUserCommand } from '@/lib/domain/userManagement/add-user/CommandHandler';
import type { Command } from '@/lib/domain/userManagement/add-user/Command';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = uuidv4();
    const command: Command = {
      ...body,
      userId,
    };
    await handleAddUserCommand(command);
    return NextResponse.json({ message: 'UserAdded', userId });
  } catch (error) {
    console.error('[AddUser] Error:', error);
    return NextResponse.json({ error: 'Failed to add user' }, { status: 500 });
  }
}
