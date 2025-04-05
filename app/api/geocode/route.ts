import { NextResponse } from 'next/server';
const apiBaseURL = 'http://localhost:8000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lon parameters' }, { status: 400 });
  }

  // const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
  const suzyQUrl = `${apiBaseURL}/find-place?lat=${lat}&lng=${lng}`;
  // http://localhost:3000/find-place?lat=61.2181&lng=-149.9003
  const url = suzyQUrl;

  console.log('Fetching:', url);

  try {
    // Rate limiting
    // await new Promise(resolve => setTimeout(resolve, 10)); 
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WeatherExplorer/1.0 (https://weather-explorer.vercel.app/)',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    
    if (!response.ok) {
      console.error('Geocoding error:', response.status, await response.text());
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Geocode response:', data);

    // Transform the response to match what the frontend expects
    return NextResponse.json({
      places: data.places || [{
        city: "Unknown",
        state: "Unknown"
      }]
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({
      places: [{
        city: "Unknown",
        state: "Unknown"
      }]
    });
  }
}