'use client'

import { useState } from 'react'
import { format, subDays, subMonths, startOfDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SettingsPanelProps {
  startDate: Date
  endDate: Date
  onDateChange: (start: Date, end: Date) => void
  activeDataset: string
  onDatasetChange: (dataset: string) => void
  mapType: 'street' | 'satellite'
  onMapTypeChange: (type: 'street' | 'satellite') => void
  satelliteOpacity: number
  onOpacityChange: (opacity: number) => void
}

const datasets = [
  { id: 'nx3tvs', name: 'Tornado Signatures', description: 'Tornado Signatures from NEXRAD (Level-III TVS Product)' },
  { id: 'nx3hail', name: 'Hail Signatures', description: 'Filtered Hail Signatures (Max Size > 0 and Probability = 100%)' },
  { id: 'nx3hail_all', name: 'All Hail Signatures', description: 'All Hail Signatures from NEXRAD' },
  { id: 'nx3meso', name: 'Mesocyclone', description: 'Mesocyclone Signatures from NEXRAD' },
  { id: 'nx3mda', name: 'Digital Mesocyclone', description: 'Digital Mesocyclone Detection Algorithm' },
  { id: 'nx3structure', name: 'Strong Storm Cells', description: 'Filtered Storm Cells (Max Reflectivity >= 45 dBZ)' },
  { id: 'nx3structure_all', name: 'All Storm Cells', description: 'All Storm Cells from NEXRAD' },
  { id: 'nldn', name: 'Lightning Strikes', description: 'Lightning Strikes from Vaisala NLDN' }
]

// Add date range options
const dateRanges = [
  { label: 'Past 3 Days', value: '3days', start: () => subDays(startOfDay(new Date()), 3) },
  { label: 'This Week', value: 'week', start: () => subDays(startOfDay(new Date()), 7) },
  { label: 'This Month', value: 'month', start: () => subMonths(startOfDay(new Date()), 1) },
  { label: 'Past 3 Months', value: '3months', start: () => subMonths(startOfDay(new Date()), 3) },
  { label: 'Past Year', value: 'year', start: () => subMonths(startOfDay(new Date()), 12) },
]

export default function SettingsPanel({
  startDate,
  endDate,
  onDateChange,
  activeDataset,
  onDatasetChange,
  mapType,
  onMapTypeChange,
  satelliteOpacity,
  onOpacityChange
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div 
      className={`fixed top-0 right-0 h-full bg-slate-800/95 backdrop-blur-sm shadow-xl transition-all duration-300 z-[1000] ${
        isOpen ? 'w-80' : 'w-12'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-0 top-1/2 -translate-x-full transform bg-slate-800/95 backdrop-blur-sm p-2 rounded-l-lg shadow-xl text-white hover:text-blue-400 transition-colors"
      >
        {isOpen ? (
          <ChevronRight className="h-6 w-6" />
        ) : (
          <ChevronLeft className="h-6 w-6" />
        )}
      </button>

      {isOpen && (
        <div className="p-6 space-y-6 h-full overflow-y-auto text-white">
          <div>
            <h2 className="text-lg font-semibold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Settings</h2>
            
            <div className="space-y-4">
              {/* Date Range */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Date Range
                  </label>
                  <select
                    className="text-sm bg-slate-700/50 border border-white/10 rounded px-2 py-1 text-gray-300"
                    onChange={(e) => {
                      const range = dateRanges.find(r => r.value === e.target.value)
                      if (range) {
                        onDateChange(range.start(), new Date())
                      }
                    }}
                  >
                    <option value="">Custom</option>
                    {dateRanges.map((range) => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="bg-slate-700/50 border border-white/10 rounded p-2 text-sm text-white"
                    value={format(startDate, 'yyyy-MM-dd')}
                    onChange={(e) => onDateChange(new Date(e.target.value), endDate)}
                  />
                  <input
                    type="date"
                    className="bg-slate-700/50 border border-white/10 rounded p-2 text-sm text-white"
                    value={format(endDate, 'yyyy-MM-dd')}
                    onChange={(e) => onDateChange(startDate, new Date(e.target.value))}
                  />
                </div>
              </div>

              {/* Weather Events */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Weather Events
                </label>
                <div className="space-y-2">
                  {datasets.map((dataset) => (
                    <label key={dataset.id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="dataset"
                        value={dataset.id}
                        checked={activeDataset === dataset.id}
                        onChange={(e) => onDatasetChange(e.target.value)}
                        className="text-blue-400"
                      />
                      <span className="text-sm text-gray-300">{dataset.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Map Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Map Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="mapType"
                      value="street"
                      checked={mapType === 'street'}
                      onChange={() => onMapTypeChange('street')}
                      className="text-blue-400"
                    />
                    <span className="text-sm text-gray-300">Street Map</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="mapType"
                      value="satellite"
                      checked={mapType === 'satellite'}
                      onChange={() => onMapTypeChange('satellite')}
                      className="text-blue-400"
                    />
                    <span className="text-sm text-gray-300">Satellite</span>
                  </label>
                </div>
              </div>

              {/* Satellite Opacity */}
              {mapType === 'satellite' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Map Opacity
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.1"
                    value={satelliteOpacity}
                    onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                    className="w-full accent-blue-400"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 