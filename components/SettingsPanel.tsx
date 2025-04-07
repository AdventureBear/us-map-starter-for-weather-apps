'use client';

import { Settings } from 'lucide-react';

interface SettingsPanelProps {
  mapType: 'street' | 'satellite';
  setMapType: (type: 'street' | 'satellite') => void;
  satelliteOpacity: number;
  setSatelliteOpacity: (opacity: number) => void;
  showRadar: boolean;
  setShowRadar: (show: boolean) => void;
  radarOpacity: number;
  setRadarOpacity: (opacity: number) => void;
  showWarnings: boolean;
  setShowWarnings: (show: boolean) => void;
  showDemoContent: boolean;
  setShowDemoContent: (show: boolean) => void;
}

export default function SettingsPanel({
  mapType,
  setMapType,
  satelliteOpacity,
  setSatelliteOpacity,
  showRadar,
  setShowRadar,
  radarOpacity,
  setRadarOpacity,
  showWarnings,
  setShowWarnings,
  showDemoContent,
  setShowDemoContent
}: SettingsPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Settings size={20} className="text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <span className="text-sm font-medium text-gray-700">Show Radar</span>
          </label>
          
          {showRadar && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              checked={showWarnings}
              onChange={(e) => setShowWarnings(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Show Warnings</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showDemoContent}
              onChange={(e) => setShowDemoContent(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Show Demo Content</span>
          </label>
        </div>
      </div>
    </div>
  );
} 