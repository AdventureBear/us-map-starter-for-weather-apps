'use client';

import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-[600px] bg-white rounded-lg">
      Loading map...
    </div>
  ),
});

interface WeatherEvent {
  lat: string;
  lon: string;
  datetime: string;
  wsr_id: string;
  location: string;
}

interface WeatherMapProps {
  events: WeatherEvent[];
  eventType: string;
  selectedEvent: WeatherEvent | null;
  mapType: 'street' | 'satellite';
  satelliteOpacity: number;
}

export default function WeatherMap(props: WeatherMapProps) {
  return <MapWithNoSSR {...props} />;
} 