'use client';

import { useState, useEffect } from 'react';
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

  // First fetch the raw weather data
  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      try {
        console.log('Fetching weather data for:', activeDataset);
        console.log('Date range:', format(startDate, 'yyyyMMdd'), 'to', format(endDate, 'yyyyMMdd'));
        
        const response = await fetch(
          `https://www.ncdc.noaa.gov/swdiws/json/${activeDataset}/${format(startDate, 'yyyyMMdd')}:${format(endDate, 'yyyyMMdd')}`
        );
        const data = await response.json();
        console.log('Raw weather data:', data);
        
        if (!data.result) {
          console.error('No results in weather data');
          setRawEvents([]);
          return;
        }

        setRawEvents(data.result);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setRawEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [activeDataset, startDate, endDate]);

  // Then transform events and fetch locations
  useEffect(() => {
    if (rawEvents.length === 0) {
      console.log('No raw events to process');
      return;
    }

    console.log('Processing raw events:', rawEvents);
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
            const lng = event.SHAPE.split(' ')[1].slice(1);
            
            // Fetch location name
            const locationResponse = await fetch(
              `/api/geocode?lat=${lat}&lng=${lng}`
            );
            const locationData = await locationResponse.json();

            console.log("locationData", locationData)
            console.log("locationData.places.city", locationData.places.city)
            console.log("locationData.places.state", locationData.places.state)
            return {
              lat,
              lng,
              datetime: event.ZTIME,
              wsr_id: event.WSR_ID,
              location: locationData ?
                  `${locationData .places.city}, ${locationData .places.state}`
                  : "unknown location",
              // location: locationData.address
              //   ? `${locationData.address.city || locationData.address.town || locationData.address.village || locationData.address.county}, ${locationData.address.state}`
              //   : 'Unknown Location',
              type: dataset,
              // id: event.ID
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

    fetchAllWeatherData();
  }, []); // Empty dependency array since we want to fetch only once

  // Filter events when dates or dataset changes
  useEffect(() => {
      // console.log('Filtering events for dataset:', activeDataset);
      // console.log('All events:', allEvents);
    const filteredEvents = allEvents[activeDataset] || [];
    // console.log('Filtered events:', filteredEvents);
    setEvents(filteredEvents);
  }, [activeDataset, allEvents]);

  // Transform raw events into display events
  useEffect(() => {
    if (rawEvents.length === 0) {
      console.log('No raw events to process');
      return;
    }

    setLoading(true); // Set loading when starting transformation
    console.log('Processing raw events:', rawEvents);
    const recentEvents = rawEvents
      .sort((a, b) => new Date(b.ZTIME).getTime() - new Date(a.ZTIME).getTime())
      .slice(0, 10);

    // Initial transform without locations
    const initialEvents = recentEvents.map(event => ({
      lat: event.SHAPE.split(' ')[2].slice(0, -1),
      lng: event.SHAPE.split(' ')[1].slice(1),
      datetime: event.ZTIME,
      wsr_id: event.WSR_ID,
      location: 'Loading location...',
      type: activeDataset,
    }));

    console.log('Setting initial events:', initialEvents);
    setAllEvents(prev => ({
      ...prev,
      [activeDataset]: initialEvents
    }));
    setLoading(false); // Set loading false after initial transform

    // Background location fetching
    initialEvents.forEach(async (event, index) => {
      try {
        await new Promise(resolve => setTimeout(resolve, index * 10));//set this to 1000 for commercial APIs
        const locationResponse = await fetch(
          `/api/geocode?lat=${event.lat}&lng=${event.lng}`
        );
        const locationData = await locationResponse.json();
        
        const location = locationData.places?.[0]
          ? `${locationData.places[0].city}, ${locationData.places[0].state}`
          : 'Unknown Location';
        
        console.log("Parsed location:", location);

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
    });
  }, [rawEvents, activeDataset]);

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
