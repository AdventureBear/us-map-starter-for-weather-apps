import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mapType = searchParams.get('type') || 'streets';
  
  // Convert 'street' to 'streets' for MapTiler compatibility
  const maptilerMapType = mapType === 'street' ? 'streets' : mapType;
  
  console.log('Map style request:', { 
    originalType: mapType, 
    maptilerType: maptilerMapType,
    apiKey: process.env.MAPTILER_API_KEY ? 'present' : 'missing' 
  });

  try {
    const url = `https://api.maptiler.com/maps/${maptilerMapType}/style.json?key=${process.env.MAPTILER_API_KEY}`;
    console.log('Requesting URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Map style request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Map style error:', error);
    return NextResponse.json({ 
      error: 'Failed to load map style',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 