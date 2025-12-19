// Different patterns for marker selection in React
// This file shows best practices - copy what you need!

import { useState } from 'react'
import { Marker } from '@react-google-maps/api'
import { markerStyles } from '../config/mapStyles'

// ============================================================================
// PATTERN 1: Single Selection (Only one marker selected at a time)
// ============================================================================

export function SingleSelectionExample() {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)

  const markers = [
    { id: 'marker-1', position: { lat: 40.7128, lng: -74.0060 }, name: 'A' },
    { id: 'marker-2', position: { lat: 40.7580, lng: -73.9855 }, name: 'B' },
    { id: 'marker-3', position: { lat: 40.7489, lng: -73.9680 }, name: 'C' },
  ]

  const handleMarkerClick = (markerId: string) => {
    // Toggle: if already selected, deselect; otherwise select
    setSelectedMarker(prev => prev === markerId ? null : markerId)
  }

  return (
    <>
      {markers.map(marker => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={selectedMarker === marker.id ? markerStyles.selected : markerStyles.unselected}
          onClick={() => handleMarkerClick(marker.id)}
        />
      ))}
    </>
  )
}

// ============================================================================
// PATTERN 2: Multi-Selection (Multiple markers can be selected)
// ============================================================================

export function MultiSelectionExample() {
  const [selectedMarkers, setSelectedMarkers] = useState<Set<string>>(new Set())

  const markers = [
    { id: 'marker-1', position: { lat: 40.7128, lng: -74.0060 }, name: 'A' },
    { id: 'marker-2', position: { lat: 40.7580, lng: -73.9855 }, name: 'B' },
    { id: 'marker-3', position: { lat: 40.7489, lng: -73.9680 }, name: 'C' },
  ]

  const handleMarkerClick = (markerId: string) => {
    setSelectedMarkers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(markerId)) {
        newSet.delete(markerId)  // Deselect
      } else {
        newSet.add(markerId)     // Select
      }
      return newSet
    })
  }

  const isSelected = (markerId: string) => selectedMarkers.has(markerId)

  return (
    <>
      {markers.map(marker => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={isSelected(marker.id) ? markerStyles.selected : markerStyles.unselected}
          onClick={() => handleMarkerClick(marker.id)}
        />
      ))}
    </>
  )
}

// ============================================================================
// PATTERN 3: Selection with Data Array
// ============================================================================

export function SelectionWithDataExample() {
  interface MarkerData {
    id: string
    position: google.maps.LatLngLiteral
    name: string
    isSelected: boolean  // Selection state in the data itself
  }

  const [markers, setMarkers] = useState<MarkerData[]>([
    { id: 'marker-1', position: { lat: 40.7128, lng: -74.0060 }, name: 'A', isSelected: false },
    { id: 'marker-2', position: { lat: 40.7580, lng: -73.9855 }, name: 'B', isSelected: false },
    { id: 'marker-3', position: { lat: 40.7489, lng: -73.9680 }, name: 'C', isSelected: false },
  ])

  const handleMarkerClick = (markerId: string) => {
    setMarkers(prev => prev.map(marker =>
      marker.id === markerId
        ? { ...marker, isSelected: !marker.isSelected }  // Toggle this marker
        : { ...marker, isSelected: false }                 // Deselect others (single-select)
    ))
  }

  return (
    <>
      {markers.map(marker => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={marker.isSelected ? markerStyles.selected : markerStyles.unselected}
          onClick={() => handleMarkerClick(marker.id)}
        />
      ))}
    </>
  )
}

// ============================================================================
// PATTERN 4: Selection with Callbacks (Lifting State Up)
// ============================================================================

interface SelectableMarkerProps {
  id: string
  position: google.maps.LatLngLiteral
  isSelected: boolean
  onSelect: (id: string) => void
}

export function SelectableMarker({ id, position, isSelected, onSelect }: SelectableMarkerProps) {
  return (
    <Marker
      position={position}
      icon={isSelected ? markerStyles.selected : markerStyles.unselected}
      onClick={() => onSelect(id)}
    />
  )
}

// Parent component manages selection
export function ParentWithCallbacks() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <>
      <SelectableMarker
        id="marker-1"
        position={{ lat: 40.7128, lng: -74.0060 }}
        isSelected={selectedId === 'marker-1'}
        onSelect={setSelectedId}
      />
      <SelectableMarker
        id="marker-2"
        position={{ lat: 40.7580, lng: -73.9855 }}
        isSelected={selectedId === 'marker-2'}
        onSelect={setSelectedId}
      />
    </>
  )
}

// ============================================================================
// PATTERN 5: Selection with Custom Actions
// ============================================================================

export function SelectionWithActionsExample() {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)

  const markers = [
    { id: 'marker-1', position: { lat: 40.7128, lng: -74.0060 }, name: 'A' },
    { id: 'marker-2', position: { lat: 40.7580, lng: -73.9855 }, name: 'B' },
  ]

  const handleSelect = (markerId: string) => {
    setSelectedMarker(markerId)
    console.log('Selected:', markerId)
    // Additional actions when selected:
    // - Pan to marker
    // - Show info window
    // - Load data
    // - etc.
  }

  const handleDeselect = () => {
    console.log('Deselected:', selectedMarker)
    setSelectedMarker(null)
  }

  const handleMarkerClick = (markerId: string) => {
    if (selectedMarker === markerId) {
      handleDeselect()
    } else {
      handleSelect(markerId)
    }
  }

  return (
    <>
      {markers.map(marker => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={selectedMarker === marker.id ? markerStyles.selected : markerStyles.unselected}
          onClick={() => handleMarkerClick(marker.id)}
        />
      ))}
    </>
  )
}

// ============================================================================
// KEY PRINCIPLES
// ============================================================================

/*
1. ✅ Store selection state, not style
   - Good: selectedMarker = 'marker-1'
   - Bad:  markerStyle = { color: 'gold' }

2. ✅ Derive styles from state
   - icon={isSelected ? selectedStyle : unselectedStyle}

3. ✅ Immutable updates
   - setMarkers(prev => prev.map(...))  // Creates new array
   - NOT: markers[0].isSelected = true  // Mutates state

4. ✅ Single source of truth
   - State lives in one place
   - Components receive props

5. ✅ Clear click handlers
   - onClick={() => handleMarkerClick(marker.id)}
   - Pass IDs, not objects

6. ✅ Use Set for multi-select
   - Efficient lookup: selectedSet.has(id)
   - Easy add/remove: set.add() / set.delete()
*/

