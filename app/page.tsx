'use client';

import { useState, useEffect } from 'react';
import WeatherMap from '@/components/WeatherMap';
import { format, subDays } from 'date-fns';
import EventBrowser from '@/components/EventBrowser';
import SettingsPanel from '@/components/SettingsPanel';

interface WeatherEvent {
  lat: string;
  lon: string;
  datetime: string;
  wsr_id: string;
  location: string;
}

interface RawWeatherEvent {
  SHAPE: string;
  ZTIME: string;
  WSR_ID: string;
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

  const fetchAllWeatherData = async () => {
    setLoading(true);
    try {
      const datasets = ['nx3tvs', 'nx3hail', 'nx3meso'];
      const results: Record<string, WeatherEvent[]> = {};
      
      await Promise.all(datasets.map(async (dataset) => {
        const response = await fetch(
          `https://www.ncdc.noaa.gov/swdiws/json/${dataset}/${format(startDate, 'yyyyMMdd')}:${format(endDate, 'yyyyMMdd')}`
        );
        const data = await response.json();
        const events = data.result || [];
        
        // Transform the data
        const transformedEvents = await Promise.all(events.map(async (event: RawWeatherEvent) => {
          const lat = event.SHAPE.split(' ')[2].slice(0, -1);
          const lon = event.SHAPE.split(' ')[1].slice(1);
          
          // Fetch location name
          const locationResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          );
          const locationData = await locationResponse.json();
          
          return {
            lat,
            lon,
            datetime: event.ZTIME,
            wsr_id: event.WSR_ID,
            location: locationData.city 
              ? `${locationData.city}, ${locationData.principalSubdivision}`
              : `${locationData.principalSubdivision}`
          };
        }));
        
        results[dataset] = transformedEvents;
      }));
      
      setAllEvents(results);
      setEvents(results[activeDataset] || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all data once on component mount
  useEffect(() => {
    fetchAllWeatherData();
  }, []); // Empty dependency array - fetch only once

  // Filter events when dates or dataset changes
  useEffect(() => {
    const filteredEvents = allEvents[activeDataset] || [];
    const withinDateRange = filteredEvents.filter(event => {
      const eventDate = new Date(event.datetime);
      return eventDate >= startDate && eventDate <= endDate;
    });
    setEvents(withinDateRange);
  }, [activeDataset, allEvents, startDate, endDate]);

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
