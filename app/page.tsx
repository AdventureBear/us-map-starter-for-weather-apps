'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Settings } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import { weatherReports } from '@/utils/weatherReports';
import { Marker } from '@/types/marker';
import Link from 'next/link';

// Dynamically import MapLibreMap to avoid SSR issues
const MapLibreMap = dynamic(() => import('@/components/MapLibreMap'), {
  ssr: false,
});

interface DamageReport {
  id: number;
  lat: number;
  lng: number;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  type: string;
  date: string;
  state: string;
}

interface Context {
  id: string;
  text: string;
}

// Sample NWS storm damage reports across a swath of the US
const NWS_DAMAGE_REPORTS: DamageReport[] = [
  // ... existing code ...
];

// Sample warning polygons
const SAMPLE_WARNING_POLYGONS = [
  {
    id: 'warning1',
    type: 'warning' as const,
    coordinates: [[
      [-86.99, 31.07],
      [-86.95, 30.93],
      [-87.04, 30.80],
      [-87.43, 30.79],
      [-87.34, 30.90],
      [-87.31, 31.01],
      [-86.99, 31.07]
    ]],
    description: 'Tornado Warning - Radar indicated rotation',
    startTime: '2024-04-06T15:00:00Z',
    endTime: '2024-04-06T16:00:00Z'
  },
  {
    id: 'watch1',
    type: 'watch' as const,
    coordinates: [[
      [-87.5, 31.2],
      [-87.2, 31.0],
      [-87.0, 30.8],
      [-87.3, 30.6],
      [-87.8, 30.7],
      [-87.9, 31.0],
      [-87.5, 31.2]
    ]],
    description: 'Thunderstorm Watch - Conditions favorable for severe thunderstorms',
    startTime: '2024-04-06T14:00:00Z',
    endTime: '2024-04-06T18:00:00Z'
  }
];

export default function Home() {
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [satelliteOpacity, setSatelliteOpacity] = useState(0.7);
  const [showRadar, setShowRadar] = useState(false);
  const [radarOpacity, setRadarOpacity] = useState(0.7);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [centerOnUser, setCenterOnUser] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDemoContent, setShowDemoContent] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const warningPolygons = SAMPLE_WARNING_POLYGONS;

  const handleBoundsChange = () => {
    // Removed console.log
  };

  const handleAddMarker = (lat: number, lng: number) => {
    setMarkers(prev => [...prev, {
      lat,
      lng,
      title: `Marker ${prev.length + 1}`,
      type: 'tornado' as const,
      state: 'Unknown',
      time: new Date().toISOString(),
      comments: 'User added marker',
      county: 'Unknown',
      severity: 'low'
    }]);
  };

  const handleCenterOnUser = () => {
    setCenterOnUser(true);
  };

  const handleCenterComplete = () => {
    setCenterOnUser(false);
  };

  const handleSearch = async (query: string) => {
    try {
      // Use MapTiler's geocoding API
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        // Add a temporary marker for the search result
        const newMarker: Marker = {
          lat,
          lng,
          title: feature.place_name || query,
          type: 'tornado' as const,
          state: feature.context?.find((ctx: Context) => ctx.id.startsWith('region'))?.text || 'Unknown',
          time: new Date().toISOString(),
          comments: `Searched location: ${feature.place_name || query}`,
          county: feature.context?.find((ctx: Context) => ctx.id.startsWith('district'))?.text || 'Unknown',
          severity: 'low'
        };

        // Update markers state
        setMarkers(prev => [...prev, newMarker]);

        // Return the coordinates for the map to center on
        return {
          lat,
          lng,
          name: feature.place_name || query
        };
      }

      // Removed console.log
      return null;
    } catch (error) {
      console.error('Error searching location:', error);
      return null;
    }
  };

  // Toggle demo content and update markers
  const toggleDemoContent = () => {
    setShowDemoContent(!showDemoContent);
    if (showDemoContent) {
      // When checking, show the NWS damage reports
      setMarkers(NWS_DAMAGE_REPORTS.map(report => ({
        lat: report.lat,
        lng: report.lng,
        title: report.title,
        type: report.type as 'tornado' | 'hail' | 'wind',
        state: report.state,
        time: report.date,
        comments: report.description,
        county: 'Unknown',
        severity: report.severity === 'high' ? 'high' : report.severity === 'medium' ? 'medium' : 'low'
      })));
    } else {
      // When unchecking, show the weather reports
      setMarkers(weatherReports);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800">Weather Mapping Starter App</h1>
            <div className="flex items-center space-x-4">
              <Link 
                href="/docs" 
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm">Documentation</span>
              </Link>
              <a 
                href="https://github.com/AdventureBear/us-map-starter-for-weather-apps" 
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
                title="View on GitHub"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span className="text-sm">GitHub</span>
              </a>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            This is a demonstration app showing various weather mapping features that can be implemented. The data shown is not live or accurate - it serves as a template for building weather visualization applications. Features include: location search with markers, street and satellite map layers, radar overlay, sample storm reports with custom icons, simulated weather warnings and watches, and user location centering. Some features may not work exactly as expected, but this app provides a foundation to get you started in building your own weather visualization application. Don&apos;t forget to star our GitHub repository to show your support and stay updated with new features!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Column */}
          <div className="lg:col-span-1">
            {/* Settings Panel */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Settings size={20} className="text-gray-600" />
                  <span className="font-semibold text-gray-700">Settings</span>
                </div>
                <div className={`transform transition-transform ${showSettings ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              <div className={`transition-all duration-200 ease-in-out ${showSettings ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="p-4 border-t border-gray-100">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Map Type
                      </label>
                      <select
                        value={mapType}
                        onChange={(e) => setMapType(e.target.value as 'street' | 'satellite')}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="street">Street</option>
                        <option value="satellite">Satellite</option>
                      </select>
                    </div>
                    
                    {mapType === 'satellite' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Satellite Opacity
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={satelliteOpacity}
                          onChange={(e) => setSatelliteOpacity(parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    )}

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={showRadar}
                          onChange={(e) => setShowRadar(e.target.checked)}
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span className="text-sm font-medium text-slate-700">Radar Overlay</span>
                      </label>
                      
                      {showRadar && (
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Radar Opacity
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={radarOpacity}
                            onChange={(e) => setRadarOpacity(parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={showDemoContent}
                          onChange={toggleDemoContent}
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span className="text-sm font-medium text-slate-700">Show Storm Reports</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={showWarnings}
                          onChange={(e) => setShowWarnings(e.target.checked)}
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span className="text-sm font-medium text-slate-700">Show Warnings & Watches</span>
                      </label>
                    </div>

                    <button
                      onClick={handleCenterOnUser}
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Center on My Location
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Map Column */}
          <div className="lg:col-span-3">
            <MapLibreMap
              mapType={mapType}
              satelliteOpacity={satelliteOpacity}
              onBoundsChange={handleBoundsChange}
              onAddMarker={handleAddMarker}
              markers={markers as Marker[]}
              onCenterOnUser={centerOnUser}
              onCenterComplete={handleCenterComplete}
              showRadar={showRadar}
              radarOpacity={radarOpacity}
              showWarnings={showWarnings}
              warningPolygons={warningPolygons}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
