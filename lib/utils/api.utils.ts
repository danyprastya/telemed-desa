import { NextResponse } from 'next/server'

/**
 * Returns a standardized success JSON response.
 * @param data - The response payload.
 * @param status - HTTP status code (default 200).
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status })
}

/**
 * Returns a standardized error JSON response.
 * Never expose raw Supabase error objects. Always use a human-readable message.
 * @param message - Human-readable error message.
 * @param status - HTTP status code.
 */
export function apiError(message: string, status = 500) {
  return NextResponse.json({ data: null, error: message }, { status })
}
