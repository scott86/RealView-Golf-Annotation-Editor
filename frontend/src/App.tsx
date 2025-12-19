import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import IndexCard from './components/IndexCard'
import MapPage from './pages/MapPage'

interface HealthCheck {
  status: string;
  timestamp: string;
}

function App() {
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)

  const checkHealth = async () => {
      try {
        const response = await axios.get<HealthCheck>('/api/health')
        setHealth(response.data)
        setError(null)
      } catch (err) {
        setError('Failed to connect to backend')
        console.error(err)
      } finally {
        setLoading(false)
      }
  }

  const checkHealthLoop = async () => {
    while (true) {
      await checkHealth()
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  useEffect(() => {
    //checkHealthLoop()
    checkHealth()
  }, [])

  // Show map page if toggled
  if (showMap) {
    return (
      <div>
        <button 
          onClick={() => setShowMap(false)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 2000,
            padding: '0.75rem 1.5rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          Back to Home
        </button>
        <MapPage />
      </div>
    )
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Map App</h1>
        <p>Full-stack React + TypeScript + Node.js + PostgreSQL</p>
        
        <div className="status-card">
          <h2>Backend Status</h2>
          {loading && <p>Checking connection...</p>}
          {error && <p className="error">{error}</p>}
          {health && (
            <div className="success">
              <p>✓ Status: {health.status}</p>
              <p>Server time: {new Date(health.timestamp).toLocaleString()}</p>
            </div>
          )}
        </div>

        <button 
          onClick={() => setShowMap(true)}
          className="map-button"
        >
          🗺️ Open Map View
        </button>

        {/* Example IndexCard components - title is immutable prop, content is dynamic state */}
        <IndexCard title="My First Note" />
        
        <IndexCard title="Shopping List" />
        
        <IndexCard title="Ideas" />
      </header>
    </div>
  )
}

export default App

