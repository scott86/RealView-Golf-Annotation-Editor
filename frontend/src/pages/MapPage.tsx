import MapView from '../components/MapView'

function MapPage() {
  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

  if (!apiKey) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Google Maps API Key Missing</h2>
        <p>Please add VITE_GOOGLE_MAPS_API_KEY to your .env file</p>
      </div>
    )
  }

  return (
    <div>
      <MapView 
        apiKey={apiKey}
        initialCenter={{ lat: 38.99479, lng: -77.1777 }} // DC
        initialZoom={12}
      />
    </div>
  )
}

export default MapPage

