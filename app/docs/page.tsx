'use client';

import Link from 'next/link';

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header with back link */}
          <div className="mb-6">
            <Link 
              href="/" 
              className="text-blue-500 hover:text-blue-600 mb-4 inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Map
            </Link>
            <h1 className="text-3xl font-bold text-slate-800 mt-4">Documentation & Next Steps</h1>
          </div>

          {/* Map Implementation */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Map Implementation</h2>
            <p className="text-slate-600 mb-4">
              This app uses MapLibre GL JS, an open-source fork of Mapbox GL JS, along with MapTiler for map tiles and geocoding. This combination provides a powerful, customizable mapping solution without the licensing restrictions of alternatives.
            </p>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Why MapLibre?</h3>
            <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
              <li>Open-source and free to use</li>
              <li>Compatible with multiple tile providers</li>
              <li>Rich feature set including custom layers and controls</li>
              <li>Active community and regular updates</li>
              <li>No usage restrictions or tracking requirements</li>
            </ul>
            <h3 className="text-xl font-semibold text-slate-800 mb-2 mt-4">Setting Up Your API Key</h3>
            <p className="text-slate-600 mb-4">
              To get started, you&apos;ll need to add your MapLibre API key to the environment variables. Create or edit the <code className="bg-slate-100 px-2 py-1 rounded">.env.local</code> file in your project root and add:
            </p>
            <pre className="bg-slate-100 p-4 rounded-lg mb-4 overflow-x-auto">
              <code>MAPTILER_API_KEY=your_api_key_here</code>
            </pre>
            <p className="text-slate-600">
              Replace <code className="bg-slate-100 px-2 py-1 rounded">your_api_key_here</code> with your actual MapTiler API key. This key will be used for both map tiles and geocoding services. <strong>Important:</strong> Never commit your <code className="bg-slate-100 px-2 py-1 rounded">.env.local</code> file to version control, as it contains sensitive information.
            </p>
          </section>

          {/* Cool Features */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Cool Things You Can Add</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Real-time Data Integration</h3>
                <p className="text-slate-600">
                  Connect to weather APIs like the National Weather Service API (weather.gov) for real-time weather data, warnings, and radar imagery. You can also integrate with other weather data providers for additional features.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Custom Layer Types</h3>
                <p className="text-slate-600">
                  Add specialized layers for different types of weather data: temperature heat maps, precipitation probability overlays, wind direction vectors, or custom alert polygons.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Interactive Features</h3>
                <p className="text-slate-600">
                  Implement time-based playback for radar data, draw custom regions for alerts, or add click-and-drag measurement tools for distance and area calculations.
                </p>
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Next Steps</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">1. Get Your API Keys</h3>
                <p className="text-slate-600">
                  Sign up for a free MapTiler account to get your API key. You&apos;ll need this for map tiles and geocoding. Consider which weather data providers you want to use and obtain necessary API keys.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">2. Customize the Base Map</h3>
                <p className="text-slate-600">
                  Explore MapTiler&apos;s style editor to customize map colors, labels, and features. You can create your own style or modify existing ones to match your application&apos;s theme.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">3. Add Real Data Sources</h3>
                <p className="text-slate-600">
                  Replace the demo data with real weather data from your chosen providers. The National Weather Service API is a great free starting point for US weather data.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">4. Enhance User Experience</h3>
                <p className="text-slate-600">
                  Add features like saved locations, custom alerts, mobile responsiveness, and more sophisticated search capabilities. Consider adding user accounts for personalized settings.
                </p>
              </div>
            </div>
          </section>

          {/* Resources */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Useful Resources</h2>
            <ul className="list-disc list-inside text-slate-600 space-y-2">
              <li><a href="https://maplibre.org/maplibre-gl-js-docs/api/" className="text-blue-500 hover:text-blue-600">MapLibre GL JS Documentation</a></li>
              <li><a href="https://docs.maptiler.com/cloud/api/" className="text-blue-500 hover:text-blue-600">MapTiler API Documentation</a></li>
              <li><a href="https://weather-gov.github.io/api/general-overview" className="text-blue-500 hover:text-blue-600">National Weather Service API Documentation</a></li>
              <li><a href="https://nextjs.org/docs" className="text-blue-500 hover:text-blue-600">Next.js Documentation</a></li>
            </ul>
          </section>

          {/* Star Reminder */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-blue-800 font-medium">
              ⭐️ Found this helpful? Don&apos;t forget to star our <a href="https://github.com/AdventureBear/us-map-starter-for-weather-apps" className="text-blue-600 hover:text-blue-800 underline">GitHub repository</a> to show your support and stay updated with new features! ⭐️
            </p>
          </div>
        </div>
      </div>
    </main>
  );
} 