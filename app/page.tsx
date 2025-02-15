'use client';

import { useState, useEffect, useCallback } from 'react';
import WeatherMap from '@/components/WeatherMap';
import { format, subDays } from 'date-fns';
import EventBrowser from '@/components/EventBrowser';
import SettingsPanel from '@/components/SettingsPanel';


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
  // id: string;
}

export default function Home() {
  // const [events, setEvents] = useState<WeatherEvent[]>([]);
  const [allEvents, setAllEvents] = useState<Record<string, ProcessEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 3));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [activeDataset, setActiveDataset] = useState<string>('nx3tvs');
  const [selectedEvent, setSelectedEvent] = useState<ProcessEvent | null>(null);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('satellite');
  const [satelliteOpacity, setSatelliteOpacity] = useState(0.7);
  const [rawEvents, setRawEvents] = useState<RawWeatherEvent[]>([]);
  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [visibleEvents, setVisibleEvents] = useState<ProcessEvent[]>([]);

  // Extract processLocations as a useCallback at the component level
  const processLocations = useCallback(async (events: ProcessEvent[]) => {
    const batchSize = 3;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await Promise.all(batch.map(async (event) => {
        try {
          // Validate coordinates before making the request
          if (!event.lat || !event.lng) {
            console.warn('Invalid coordinates:', event);
            return;
          }

          const locationResponse = await fetch(
            `/api/geocode?lat=${event.lat}&lng=${event.lng}`
          );
          
          if (!locationResponse.ok) {
            throw new Error(`Geocoding failed: ${locationResponse.status}`);
          }

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
          console.error('Error fetching location for:', event, error);
        }
      }));
      // await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, [activeDataset]);

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
            // id: event.ID
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

    // Use the callback for location processing
    processLocations(initialEvents);
  }, [rawEvents, activeDataset, processLocations]);

  // This effect filters events for the list when map bounds change
  useEffect(() => {
    const currentEvents = allEvents[activeDataset] || [];
    if (!mapBounds) {
      setVisibleEvents(currentEvents);
      return;
    }
    
    const [[southLat, westLng], [northLat, eastLng]] = mapBounds;
    console.log('Map bounds:', { southLat, westLng, northLat, eastLng });
    
    const filtered = currentEvents.filter(event => {
      const lat = parseFloat(event.lat);
      const lng = parseFloat(event.lng);
      
      // Debug log for filtering
      console.log('Checking event:', {
        location: event.location,
        lat,
        lng,
        inBounds: (
          lat >= southLat && 
          lat <= northLat && 
          lng >= westLng && 
          lng <= eastLng
        )
      });
      
      return (
        lat >= southLat && 
        lat <= northLat && 
        lng >= westLng && 
        lng <= eastLng
      );
    });
    
    console.log('Filtered events:', filtered.length);
    setVisibleEvents(filtered);
  }, [activeDataset, allEvents, mapBounds]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 pr-16">
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
          </a> <a 
            href="https://www.ncei.noaa.gov/products/severe-weather-data-inventory" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors mt-2 inline-block"
          >Documentation
          </a>
        </div>

        <div className="grid grid-cols-3 gap-6 ">
          <div className="col-span-2">
            {loading ? (
              <div className="flex justify-center items-center h-[600px] bg-white/10 backdrop-blur-sm rounded-lg text-white">
                Loading...
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden">
                <WeatherMap 
                  events={allEvents[activeDataset] || []}
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
              events={visibleEvents}
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
