import { Marker } from '@/types/marker';
import weatherReportsJson from '../data/weatherReports.json';

// Type assertion to ensure the JSON data matches our Marker type
export const weatherReports: Marker[] = weatherReportsJson.map(report => ({
  lat: report.lat,
  lng: report.lng,
  title: report.title || 'Unknown Location',
  type: (report.type || 'tornado') as 'tornado' | 'hail' | 'wind',
  state: report.state || 'Unknown',
  time: report.time || new Date().toISOString(),
  comments: report.comments || '',
  county: report.county || 'Unknown',
  size: report.size,
  speed: report.speed
})); 