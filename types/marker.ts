export interface Marker {
  lat: number;
  lng: number;
  title: string;
  type: 'tornado' | 'hail' | 'wind';
  state: string;
  time: string;
  comments: string;
  county: string;
  severity?: 'low' | 'medium' | 'high';
  description?: string;
  size?: string;
  speed?: string;
} 