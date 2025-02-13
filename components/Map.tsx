'use client'

import { MapContainer, TileLayer, CircleMarker, Popup, useMap, LayersControl } from 'react-leaflet'
import { Icon } from 'leaflet'
import { Marker } from 'react-leaflet'
// import { useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { useEffect, useCallback } from 'react'
import { format } from 'date-fns';


interface WeatherEvent {
  lat: string
  lng: string
  datetime: string
  wsr_id: string
  location: string
}

interface WeatherMapProps {
  events: WeatherEvent[];
  eventType: string;
  selectedEvent: WeatherEvent | null;
  mapType: 'street' | 'satellite';
  satelliteOpacity: number;
  onBoundsChange?: (bounds: [[number, number], [number, number]]) => void;
}


const selectedHailIcon = new Icon({
  iconUrl: '/marker-icon-red.png',  // Keep default for hail for now
  iconRetinaUrl: '/marker-icon-2x-red.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowAnchor: [12, 41]
})

// Create a component to handle map updates
function MapUpdater({ center, zoom, selectedEvent }: { 
  center: [number, number], 
  zoom: number, 
  selectedEvent: WeatherEvent | null 
}) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedEvent) {
      const eventCenter = [parseFloat(selectedEvent.lat), parseFloat(selectedEvent.lng)] as [number, number];
      if (map.getCenter().distanceTo(eventCenter) > 1000) {
        map.setView(eventCenter, 8, { animate: true });
      }
    }
  }, [selectedEvent, map]);

  return null;
}

// Add this new component at the top level of the file
function DynamicMarker({ position, icon, children }: { 
  position: [number, number], 
  icon: Icon, 
  children: React.ReactNode
}) {
  const map = useMap()
  const currentZoom = map.getZoom()
  
  // Scale factor based on zoom level
  const scale = Math.min(2, Math.max(1, currentZoom / 7))
  const scaledIcon = new Icon({
    ...icon.options,
    iconSize: Array.isArray(icon.options.iconSize) 
      ? [icon.options.iconSize[0] * scale, icon.options.iconSize[1] * scale] 
      : icon.options.iconSize,
    iconAnchor: Array.isArray(icon.options.iconAnchor)
      ? [icon.options.iconAnchor[0] * scale, icon.options.iconAnchor[1] * scale]
      : icon.options.iconAnchor,
    popupAnchor: icon.options.popupAnchor
  })

  return (
    <Marker position={position} icon={scaledIcon}>
      {children}
    </Marker>
  )
}

// Update the icon configuration
const baseIcon = new Icon({
  iconUrl: '/tornado-marker.svg',
  iconSize: [48, 48],     // Increased from 32 to 48
  iconAnchor: [24, 24],   // Half of iconSize
  popupAnchor: [0, -24],  // Adjusted for larger size
})

export default function Map({ events, eventType, selectedEvent, mapType, satelliteOpacity, onBoundsChange }: WeatherMapProps) {
  // console.log('Map received events:', events)  // Log events received by Map
  // console.log('Map received eventType:', eventType)  // Log eventType received by Map
  // console.log('Events is array?', Array.isArray(events))  // Check if events is an array
  

  // Ensure events is an array
  const weatherEvents = Array.isArray(events) ? events : []
  // console.log('Weather events after check:', weatherEvents)  // Log processed events

  // If there's a selected event, center and zoom the map on it
  const mapCenter = selectedEvent 
    ? [parseFloat(selectedEvent.lat), parseFloat(selectedEvent.lng)]
    : [39.8283, -98.5795]
  
  const mapZoom = selectedEvent ? 7 : 3

  // Map bounds change handler
  const handleBoundsChange = useCallback((map: L.Map) => {
    const bounds = map.getBounds();
    const boundsArray: [[number, number], [number, number]] = [
      [bounds.getSouth(), bounds.getWest()],
      [bounds.getNorth(), bounds.getEast()]
    ];
    onBoundsChange?.(boundsArray);
  }, [onBoundsChange]);

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6">
        <div className="h-[600px] w-full rounded-lg overflow-hidden">
          <MapContainer
            center={mapCenter as [number, number]}
            zoom={mapZoom}
            className="h-[600px] w-full"
            scrollWheelZoom={true}
            whenReady={(map) => handleBoundsChange(map.target)}
          >
            <MapUpdater 
              center={mapCenter as [number, number]} 
              zoom={mapZoom} 
              selectedEvent={selectedEvent}
            />
            
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Street Map">
                {mapType === 'street' ? (
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                ) : (
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                    opacity={satelliteOpacity}
                  />
                )}
              </LayersControl.BaseLayer>
              
              <LayersControl.BaseLayer name="Satellite">
                <div>
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                    opacity={satelliteOpacity}
                  />
                </div>
              </LayersControl.BaseLayer>
            </LayersControl>

            {weatherEvents.map((event, idx) => (
              event === selectedEvent ? (
                <DynamicMarker
                  key={`${event.lat}-${event.lng}-${event.datetime}`}
                  position={[parseFloat(event.lat), parseFloat(event.lng)]}
                  icon={eventType === 'tornado' ? baseIcon : selectedHailIcon}
                >
                  <Popup offset={[0, -20]} onOpen={() => onSelectEvent?.(event)}>
                    <div className="p-2">
                      <div className="font-medium">{event.location}</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(event.datetime), 'MMM d, yyyy h:mm a')}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Radar: {event.wsr_id}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {parseFloat(event.lat).toFixed(2)}°N, {parseFloat(event.lng).toFixed(2)}°W
                      </div>
                    </div>
                  </Popup>
                </DynamicMarker>
              ) : (
                <CircleMarker
                  key={idx}
                  center={[parseFloat(event.lat), parseFloat(event.lng)]}
                  radius={6}
                  pathOptions={{
                    color: eventType === 'tornado' ? '#ef4444' : '#ef4444',
                    fillOpacity: 0.8,
                    weight: 2
                  }}
                >
                  <Popup offset={[0, -10]}>
                    <div className="p-2">
                      <div className="font-bold">
                        {eventType === 'tornado' ? 'Tornado' : 'Hail'} Signature
                      </div>
                      <div>Time: {event.datetime}</div>
                      <div>Radar: {event.wsr_id}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  )
} 