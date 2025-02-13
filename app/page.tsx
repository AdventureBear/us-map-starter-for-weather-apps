'use client';

import { useState, useEffect, useCallback } from 'react';
import WeatherMap from '@/components/WeatherMap';
import { format, subDays } from 'date-fns';
import EventBrowser from '@/components/EventBrowser';
import SettingsPanel from '@/components/SettingsPanel';

interface WeatherEvent {
  lat: string;
  lng: string;
  datetime: string;
  wsr_id: string;
  location: string;
}

interface RawWeatherEvent {
  SHAPE: string;
  ZTIME: string;
  WSR_ID: string;
}

interface ProcessEvent {
  lat: string;
  lng: string;
  datetime: string;
  wsr_id: string;
  location: string;
  type: string;
  id: string;
}

export default function Home() {
  const [events, setEvents] = useState<WeatherEvent[]>([]);
  const [allEvents, setAllEvents] = useState<Record<string, WeatherEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [activeDataset, setActiveDataset] = useState<string>('nx3tvs');
  const [selectedEvent, setSelectedEvent] = useState<WeatherEvent | null>(null);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('satellite');
  const [satelliteOpacity, setSatelliteOpacity] = useState(0.7);
  const [rawEvents, setRawEvents] = useState<RawWeatherEvent[]>([]);
  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]] | null>(null);

  // 1. Fetch data when dates or dataset changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://www.ncdc.noaa.gov/swdiws/json/${activeDataset}/${format(startDate, 'yyyyMMdd')}:${format(endDate, 'yyyyMMdd')}`
        );
        const data = await response.json();
        if (data.result) {
          setRawEvents(data.result);
        }
      } catch (error) {
        console.error('Error:', error);
        setRawEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeDataset, startDate, endDate]);

  // 2. Process raw events into valid events with initial locations
  useEffect(() => {
    if (!rawEvents.length) {
      console.log('No raw events to process');
      return;
    }

    // Initial transform without locations
    const initialEvents = rawEvents
      .map(event => {
        try {
          const coordinates = event.SHAPE.split(' ');
          const lat = parseFloat(coordinates[2].slice(0, -1));
          const lng = parseFloat(coordinates[1].slice(1));

          // Validate coordinates
          if (isNaN(lat) || isNaN(lng) || 
              lat < -90 || lat > 90 || 
              lng < -180 || lng > 180) {
            console.warn('Invalid coordinates:', { lat, lng, raw: event.SHAPE });
            return null;
          }

          return {
            lat: lat.toString(),
            lng: lng.toString(),
            datetime: event.ZTIME,
            wsr_id: event.WSR_ID,
            location: 'Loading location...',
            type: activeDataset,
            id: event.ID
          };
        } catch (error) {
          console.error('Error parsing event:', error, event);
          return null;
        }
      })
      .filter((event): event is NonNullable<typeof event> => event !== null);

    setAllEvents(prev => ({
      ...prev,
      [activeDataset]: initialEvents
    }));

    // 3. Batch process locations
    const processLocations = async (events: ProcessEvent[]) => {
      const batchSize = 3;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        await Promise.all(batch.map(async (event) => {
          try {
            const locationResponse = await fetch(
              `/api/geocode?lat=${event.lat}&lng=${event.lng}`
            );
            const locationData = await locationResponse.json();
            
            const location = locationData.places?.[0]
              ? `${locationData.places[0].city}, ${locationData.places[0].state}`
              : 'Unknown Location';

            setAllEvents(prev => ({
              ...prev,
              [activeDataset]: prev[activeDataset].map(e => 
                e.lat === event.lat && e.lng === event.lng
                  ? { ...e, location }
                  : e
              )
            }));
          } catch (error) {
            console.error('Error fetching location:', error);
          }
        }));
        // Rate limit between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };

    // Start background location fetching
    processLocations(initialEvents);
  }, [rawEvents, activeDataset]);

  // Add this function to filter events by map bounds
  const filterEventsByBounds = useCallback((events: WeatherEvent[], bounds: [[number, number], [number, number]] | null) => {
    if (!bounds) return events;
    
    const [[southLat, westLng], [northLat, eastLng]] = bounds;
    return events.filter(event => {
      const lat = parseFloat(event.lat);
      const lng = parseFloat(event.lng);
      return lat >= southLat && lat <= northLat && lng >= westLng && lng <= eastLng;
    });
  }, []);

  // 4. Filter events by map bounds
  useEffect(() => {
    const filteredEvents = allEvents[activeDataset] || [];
    const boundsFilteredEvents = filterEventsByBounds(filteredEvents, mapBounds);
    setEvents(boundsFilteredEvents);
  }, [activeDataset, allEvents, mapBounds, filterEventsByBounds]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="space-y-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-xl p-6 text-white">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Severe Weather Explorer
          </h1>
          <p className="text-gray-300 mt-2">
            Track and analyze severe weather events across the United States
          </p>
          <a 
            href="https://www.ncdc.noaa.gov/swdiws/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors mt-2 inline-block"
          >
            Data source: NOAA Storm Events Database
          </a>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            {loading ? (
              <div className="flex justify-center items-center h-[600px] bg-white/10 backdrop-blur-sm rounded-lg text-white">
                Loading...
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden">
                <WeatherMap 
                  events={events}
                  eventType={activeDataset}
                  selectedEvent={selectedEvent}
                  mapType={mapType}
                  satelliteOpacity={satelliteOpacity}
                  onBoundsChange={setMapBounds}
                />
              </div>
            )}
          </div>
          <div className="col-span-1">
            <EventBrowser 
              events={events}
              eventType={activeDataset}
              selectedEvent={selectedEvent}
              onSelectEvent={setSelectedEvent}
            />
          </div>
        </div>
      </div>

      <SettingsPanel
        startDate={startDate}
        endDate={endDate}
        onDateChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
        activeDataset={activeDataset}
        onDatasetChange={setActiveDataset}
        mapType={mapType}
        onMapTypeChange={setMapType}
        satelliteOpacity={satelliteOpacity}
        onOpacityChange={setSatelliteOpacity}
      />
    </div>
  );
}
