import { format } from 'date-fns'

interface WeatherEvent {
  lat: string
  lon: string
  datetime: string
  wsr_id: string
  location: string
}

interface EventBrowserProps {
  events: WeatherEvent[]
  eventType: 'nx3tvs' | 'nx3hail'
  selectedEvent: WeatherEvent | null
  onSelectEvent: (event: WeatherEvent) => void
}

export default function EventBrowser({ events, eventType, selectedEvent, onSelectEvent }: EventBrowserProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-xl h-[600px] overflow-hidden flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">
          {eventType === 'nx3tvs' ? 'Tornado' : eventType === 'nx3hail' ? 'Hail' : 'Mesocyclone'} Signatures
          <span className="ml-2 text-sm text-gray-400">({events.length})</span>
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {events.map((event, idx) => (
          <button
            key={idx}
            onClick={() => onSelectEvent(event)}
            className={`w-full text-left p-4 border-b border-white/10 transition-colors
              ${selectedEvent === event 
                ? 'bg-blue-500/20 hover:bg-blue-500/30' 
                : 'hover:bg-white/5'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-white">
                  {event.location}
                </div>
                <div className="text-sm text-gray-300">
                  {format(new Date(event.datetime), 'MMM d, yyyy h:mm a')}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Radar: {event.wsr_id}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {parseFloat(event.lat).toFixed(2)}°N, {parseFloat(event.lon).toFixed(2)}°W
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
} 