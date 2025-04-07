import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    apiKeyPresent: !!process.env.MAPTILER_API_KEY,
    env: process.env.NODE_ENV
  });
} 