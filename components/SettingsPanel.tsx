'use client';

import { useState } from 'react';

interface SettingsPanelProps {
  mapType: 'street' | 'satellite';
  onMapTypeChange: (type: 'street' | 'satellite') => void;
  satelliteOpacity: number;
  onOpacityChange: (opacity: number) => void;
  onAddMarker: () => void;
  onCenterOnUser: () => void;
}

export default function SettingsPanel({
  mapType,
  onMapTypeChange,
  satelliteOpacity,
  onOpacityChange,
  onAddMarker,
  onCenterOnUser,
}: SettingsPanelProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-xl p-4 text-white">
      <h2 className="text-lg font-semibold mb-4">Map Controls</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Map Type</label>
          <select
            value={mapType}
            onChange={(e) => onMapTypeChange(e.target.value as 'street' | 'satellite')}
            className="w-full bg-white/10 border border-white/20 rounded-md p-2 text-white"
          >
            <option value="street">Street Map</option>
            <option value="satellite">Satellite</option>
          </select>
        </div>

        {mapType === 'satellite' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Satellite Opacity: {satelliteOpacity.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={satelliteOpacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={onAddMarker}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
          >
            Add Marker
          </button>
          <button
            onClick={onCenterOnUser}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-md transition-colors"
          >
            Center on My Location
          </button>
        </div>
      </div>
    </div>
  );
} 