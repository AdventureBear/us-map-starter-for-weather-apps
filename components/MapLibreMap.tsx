'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Maximize2, Minimize2 } from 'lucide-react';

interface Marker {
  lat: number;
  lng: number;
  title?: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high';
  type?: 'tornado' | 'hail' | 'wind';
  state?: string;
  time?: string;
  size?: string;
  speed?: string;
  comments?: string;
}

interface WarningPolygon {
  id: string;
  type: 'warning' | 'watch';
  coordinates: number[][][];
  description: string;
  startTime: string;
  endTime: string;
}

interface MapLibreMapProps {
  mapType: 'street' | 'satellite';
  satelliteOpacity: number;
  onBoundsChange?: (bounds: [[number, number], [number, number]]) => void;
  onAddMarker?: (lat: number, lng: number) => void;
  markers?: Marker[];
  onCenterOnUser?: boolean;
  onCenterComplete?: () => void;
  showRadar?: boolean;
  radarOpacity?: number;
  showWarnings?: boolean;
  warningPolygons?: WarningPolygon[];
}

export default function MapLibreMap({
  mapType,
  satelliteOpacity,
  onBoundsChange,
  markers = [],
  onCenterOnUser = false,
  onCenterComplete,
  showRadar = false,
  radarOpacity = 0.7,
  showWarnings = false,
  warningPolygons = []
}: MapLibreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  if (!apiKey) {
    console.error('MapTiler API key is not set. Please add NEXT_PUBLIC_MAPTILER_API_KEY to your .env.local file');
  }

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    // Note: MapLibre uses [longitude, latitude] format
    const center: [number, number] = userLocation 
      ? [userLocation[1], userLocation[0]] // Convert from [lat, lng] to [lng, lat]
      : [-98.5795, 39.8283]; // Center of the US
    const zoom = userLocation ? 10 : 3; // Changed from 4 to 3 for a wider view

    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: mapType === 'street' 
        ? `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`
        : `https://api.maptiler.com/maps/satellite/style.json?key=${apiKey}`,
      center: center,
      zoom: zoom,
      attributionControl: false
    });

    // Add navigation control
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add attribution
    map.current.addControl(new maplibregl.AttributionControl({
      compact: true
    }));

    // Handle map click
    map.current.on('click', (e) => {
      // Check if we clicked on a marker by comparing coordinates
      const clickedMarker = markersRef.current.find(marker => {
        const markerLngLat = marker.getLngLat();
        const clickLngLat = e.lngLat;
        
        // Check if click is within a small radius of the marker
        const distance = Math.sqrt(
          Math.pow(markerLngLat.lng - clickLngLat.lng, 2) +
          Math.pow(markerLngLat.lat - clickLngLat.lat, 2)
        );
        
        return distance < 0.01; // Adjust this threshold as needed
      });
      
      if (clickedMarker) {
        clickedMarker.togglePopup();
      }
    });

    // Handle bounds change
    map.current.on('moveend', () => {
      if (onBoundsChange && map.current) {
        const bounds = map.current.getBounds();
        onBoundsChange([
          [bounds.getSouth(), bounds.getWest()],
          [bounds.getNorth(), bounds.getEast()]
        ]);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapType, apiKey]);

  // Update map style when mapType changes
  useEffect(() => {
    if (!map.current) return;

    const style = mapType === 'street' 
      ? `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`
      : `https://api.maptiler.com/maps/satellite/style.json?key=${apiKey}`;

    map.current.setStyle(style);
  }, [mapType, apiKey]);

  // Update satellite opacity
  useEffect(() => {
    if (!map.current || mapType !== 'satellite') return;

    const updateOpacity = () => {
      if (!map.current) return;
      const layers = map.current.getStyle().layers;
      layers.forEach(layer => {
        if (layer.type === 'raster') {
          map.current!.setPaintProperty(layer.id, 'raster-opacity', satelliteOpacity);
        }
      });
    };

    // If the style is already loaded, update opacity immediately
    if (map.current.isStyleLoaded()) {
      updateOpacity();
    }

    // Listen for style load to update opacity
    map.current.on('style.load', updateOpacity);

    return () => {
      if (map.current) {
        map.current.off('style.load', updateOpacity);
      }
    };
  }, [satelliteOpacity, mapType]);

  // Handle user location
  useEffect(() => {
    if (!onCenterOnUser) return;

    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const newLocation: [number, number] = [longitude, latitude]; // [lng, lat] format
            setUserLocation([latitude, longitude]); // Store in [lat, lng] format for consistency
            
            if (map.current) {
              map.current.flyTo({
                center: newLocation,
                zoom: 10,
                essential: true
              });
              // Call the completion callback after centering
              if (onCenterComplete) {
                onCenterComplete();
              }
            }
          },
          (error) => {
            console.error('Error getting location:', error);
            alert('Unable to get your location. Please make sure location services are enabled.');
            // Call the completion callback even on error
            if (onCenterComplete) {
              onCenterComplete();
            }
          }
        );
      } else {
        alert('Geolocation is not supported by your browser');
        // Call the completion callback if geolocation is not supported
        if (onCenterComplete) {
          onCenterComplete();
        }
      }
    };

    getLocation();
  }, [onCenterOnUser, onCenterComplete]);

  // Update markers
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(marker => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '32px';
      el.style.height = '32px';
      
      // Check if this is a search result marker
      if (marker.comments?.startsWith('Searched location:')) {
        const iconPath = '/marker-icon.png';
        el.style.backgroundImage = `url(${iconPath})`;
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';
      } else {
        // Set marker icon based on type for weather reports
        let iconPath = '/marker-icon.png';
        if (marker.type) {
          iconPath = `/icons/${marker.type}.svg`;
        }
        el.style.backgroundImage = `url(${iconPath})`;
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';
      }
      
      el.style.cursor = 'pointer';
      el.style.transform = 'translate(-50%, -100%)';

      // Build popup content based on report type
      let popupContent = `<div class="p-2 max-w-xs">`;
      
      // Add title if available
      if (marker.title) {
        popupContent += `<h3 class="font-bold text-lg">${marker.title}</h3>`;
      }
      
      // Add time if available
      if (marker.time) {
        popupContent += `<p class="text-sm text-gray-600">Time: ${marker.time}</p>`;
      }
      
      // Add location details
      if (marker.state) {
        popupContent += `<p class="text-sm">State: ${marker.state}</p>`;
      }
      
      // Add type-specific details
      if (marker.type === 'tornado') {
        popupContent += `<p class="text-sm font-medium text-red-600">Tornado Report</p>`;
      } else if (marker.type === 'hail' && marker.size) {
        popupContent += `<p class="text-sm font-medium text-green-600">Hail Size: ${marker.size}</p>`;
      } else if (marker.type === 'wind' && marker.speed) {
        popupContent += `<p class="text-sm font-medium text-blue-600">Wind Speed: ${marker.speed}</p>`;
      }
      
      // Add comments if available
      if (marker.comments) {
        popupContent += `<p class="text-sm mt-2">${marker.comments}</p>`;
      }
      
      popupContent += `</div>`;

      const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 25,
        className: 'custom-popup'
      }).setHTML(popupContent);

      // Add custom styles for the popup
      const style = document.createElement('style');
      style.textContent = `
        .custom-popup .maplibregl-popup-close-button {
          width: 24px;
          height: 24px;
          font-size: 20px;
          padding: 0;
          margin: 0;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .custom-popup .maplibregl-popup-close-button:hover {
          background: #f0f0f0;
        }
      `;
      document.head.appendChild(style);

      const newMarker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(newMarker);
    });
  }, [markers]);

  // Remove the map click handler since we're using marker's built-in popup
  useEffect(() => {
    if (!map.current) return;

    const clickHandler = (e: maplibregl.MapMouseEvent) => {
      // If we clicked on empty space, do nothing
      if (!e.target) return;
    };

    map.current.on('click', clickHandler);

    return () => {
      if (map.current) {
        map.current.off('click', clickHandler);
      }
    };
  }, []);

  const toggleFullscreen = () => {
    if (!mapContainer.current) return;

    if (!document.fullscreenElement) {
      mapContainer.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Update radar layer visibility and opacity
  useEffect(() => {
    if (!map.current) return;

    const updateRadarLayer = () => {
      if (!map.current) return;
      
      // Remove existing radar layer if it exists
      if (map.current.getLayer('radar-layer')) {
        map.current.removeLayer('radar-layer');
        map.current.removeSource('radar-source');
      }

      if (showRadar) {
        // Add radar source
        map.current.addSource('radar-source', {
          type: 'raster',
          tiles: [
            'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png'
          ],
          tileSize: 256
        });

        // Add radar layer
        map.current.addLayer({
          id: 'radar-layer',
          type: 'raster',
          source: 'radar-source',
          paint: {
            'raster-opacity': radarOpacity
          }
        });
      }
    };

    // If the style is already loaded, update radar layer immediately
    if (map.current.isStyleLoaded()) {
      updateRadarLayer();
    }

    // Listen for style load to update radar layer
    map.current.on('style.load', updateRadarLayer);

    return () => {
      if (map.current) {
        map.current.off('style.load', updateRadarLayer);
      }
    };
  }, [showRadar, radarOpacity]);

  // Update warning polygons
  useEffect(() => {
    if (!map.current) return;

    const updateWarningPolygons = () => {
      if (!map.current) return;
      
      // Remove existing warning layers and sources
      if (map.current.getLayer('warning-fill')) {
        map.current.removeLayer('warning-fill');
        map.current.removeLayer('warning-outline');
        map.current.removeSource('warning-source');
      }

      if (showWarnings && warningPolygons.length > 0) {
        // Add warning source
        map.current.addSource('warning-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: warningPolygons.map(polygon => ({
              type: 'Feature',
              properties: {
                type: polygon.type,
                description: polygon.description,
                startTime: polygon.startTime,
                endTime: polygon.endTime
              },
              geometry: {
                type: 'Polygon',
                coordinates: polygon.coordinates
              }
            }))
          }
        });

        // Add warning fill layer
        map.current.addLayer({
          id: 'warning-fill',
          type: 'fill',
          source: 'warning-source',
          paint: {
            'fill-color': [
              'match',
              ['get', 'type'],
              'warning', '#ff4444',  // Red for tornado warnings
              'watch', '#ffff00',    // Yellow for thunderstorm watches
              '#000000'
            ],
            'fill-opacity': 0.2
          }
        });

        // Add warning outline layer
        map.current.addLayer({
          id: 'warning-outline',
          type: 'line',
          source: 'warning-source',
          paint: {
            'line-color': [
              'match',
              ['get', 'type'],
              'warning', '#ff0000',  // Red for tornado warnings
              'watch', '#ffcc00',    // Yellow for thunderstorm watches
              '#000000'
            ],
            'line-width': 2
          }
        });

        // Add click handler for warning polygons
        map.current.on('click', 'warning-fill', (e) => {
          if (!e.features?.[0]) return;
          
          const feature = e.features[0];
          const coordinates = e.lngLat;
          const description = feature.properties?.description || '';
          const type = feature.properties?.type || '';
          const startTime = feature.properties?.startTime || '';
          const endTime = feature.properties?.endTime || '';

          // Calculate bounds of the polygon
          const polygon = feature.geometry as GeoJSON.Polygon;
          const bounds = polygon.coordinates[0].reduce((bounds, coord) => {
            return bounds.extend(new maplibregl.LngLat(coord[0], coord[1]));
          }, new maplibregl.LngLatBounds(
            new maplibregl.LngLat(polygon.coordinates[0][0][0], polygon.coordinates[0][0][1]),
            new maplibregl.LngLat(polygon.coordinates[0][0][0], polygon.coordinates[0][0][1])
          ));

          // Zoom to the polygon bounds with padding
          map.current?.fitBounds(bounds, {
            padding: 50,
            duration: 1000
          });

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const popup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true,
            offset: 25
          })
            .setLngLat(coordinates)
            .setHTML(`
              <div class="p-2">
                <h3 class="font-bold text-lg">${type === 'warning' ? 'Tornado Warning' : 'Thunderstorm Watch'}</h3>
                <p class="text-sm">${description}</p>
                <p class="text-sm text-gray-600">Valid: ${startTime} to ${endTime}</p>
              </div>
            `)
            .addTo(map.current!);
        });

        // Change cursor to pointer when hovering over warnings
        map.current.on('mouseenter', 'warning-fill', () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = 'pointer';
          }
        });

        map.current.on('mouseleave', 'warning-fill', () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = '';
          }
        });
      }
    };

    // If the style is already loaded, update warning polygons immediately
    if (map.current.isStyleLoaded()) {
      updateWarningPolygons();
    }

    // Listen for style load to update warning polygons
    map.current.on('style.load', updateWarningPolygons);

    return () => {
      if (map.current) {
        map.current.off('style.load', updateWarningPolygons);
      }
    };
  }, [showWarnings, warningPolygons]);

  return (
    <div className="bg-slate-500 rounded-lg shadow-md relative">
      <div className="absolute top-2 right-2 flex space-x-2">
        <button
          onClick={toggleFullscreen}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-md transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
      <div className="p-2">
        <div className="h-[600px] w-full rounded-lg overflow-hidden">
          <div ref={mapContainer} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
} 