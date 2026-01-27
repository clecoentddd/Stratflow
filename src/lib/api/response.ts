import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(message: string, status: number = 500, code?: string) {
  return NextResponse.json({ error: { message, code } }, { status });
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    return errorResponse('Validation Error', 400, 'VALIDATION_ERROR');
  }

  if (error instanceof Error) {
    const message = error.message;
    // Simple heuristic for status codes based on message content
    // In a real app, we might want custom error classes with status codes
    const status = 
      message.includes('required') || message.includes('invalid') ? 400 :
      message.includes('not found') ? 404 :
      message.includes('unauthorized') || message.includes('authenticated') ? 401 :
      message.includes('forbidden') ? 403 :
      message.includes('conflict') || message.includes('already exists') || message.includes('Cannot') ? 409 :
      500;
    
    return errorResponse(message, status);
  }

  return errorResponse('Internal Server Error', 500, 'INTERNAL_SERVER_ERROR');
}
