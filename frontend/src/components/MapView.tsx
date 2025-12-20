import { useState, useEffect } from 'react'
import { GoogleMap, LoadScript } from '@react-google-maps/api'
import './MapView.css'
import { markerStyles, markerIconStyles, markerImgStyles, labelStyles, createAnnotation } from '../config/mapStyles'
import { api } from '../utils/api'
import { CourseData, HoleData, Annotation } from '../types/map'

interface MapViewProps {
  apiKey: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}

interface Course {
  id: number;
  name: string;
}

function MapView({ 
  apiKey, 
  initialCenter = { lat: 38.9941228, lng: -77.177219 }, // DC area - centered on markers
  initialZoom = 15 
}: MapViewProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [center, setCenter] = useState(initialCenter)
  const [zoom, setZoom] = useState(initialZoom)
  
  // Course selection
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [courseData, setCourseData] = useState<CourseData | null>(null)
  
  // Selection state - stores IDs of multiple selected annots
  const [selectedMarkers, setSelectedMarkers] = useState<Set<string>>(new Set())
  const [selectedPolygons, setSelectedPolygons] = useState<Set<string>>(new Set())
  const [selectedPolylines, setSelectedPolylines] = useState<Set<string>>(new Set())
  
  // Store annot instances
  const [markerInstances, setMarkerInstances] = useState<google.maps.Marker[]>([])
  const [polygonInstances, setPolygonInstances] = useState<google.maps.Polygon[]>([])
  const [polylineInstances, setPolylineInstances] = useState<google.maps.Polyline[]>([])


  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    position: 'absolute' as const,
    top: 0,
    left: 0
  }

  // Map options - use simple values to avoid google namespace issues
  const options = {
    mapTypeId: 'satellite' as const, // Satellite imagery
    mapTypeControl: true,
    mapTypeControlOptions: {
      mapTypeIds: []
    },
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
    gestureHandling: 'greedy' as const, // Allows pan/zoom without ctrl key
    tilt: 0 // Disable tilt/45° view
  }

  const onLoad = (map: google.maps.Map) => {
    setMap(map)
    console.log('✓ Map loaded successfully')
  }

  const onUnmount = () => {
    setMap(null)
  }

  // Update center and zoom only when the map stops moving (on idle)
  const handleIdle = () => {
    if (map) {
      const newCenter = map.getCenter()
      const newZoom = map.getZoom()
      
      if (newCenter) {
        setCenter({
          lat: newCenter.lat(),
          lng: newCenter.lng()
        })
      }
      
      if (newZoom) {
        setZoom(newZoom)
      }
    }
  }

  const handleClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
        console.log('Clicked at:', e.latLng.lat(), e.latLng.lng());
    }
  }

  const handleCourseSelect = (courseId: string) => {
    let courseIdNum = courseId ? Number(courseId) : null;
    setSelectedCourseId(courseIdNum);
    if (courseIdNum) {

      const fetchCourseData = async () => {
        try {
          const data = await api.getCourse(courseIdNum);
          setCourseData(data);

        } catch (error) {
          console.error('Error fetching course data:', error)
        }
      }
      fetchCourseData();
    }
  }

  // Fetch courses once map loads
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await api.getCourses()
        setCourses(data)
      } catch (error) {
        console.error('Error fetching courses:', error)
      }
    }
    
    fetchCourses()
  }, [map])

  // Handle marker click - toggle selection (multi-select)
  const handleMarkerClick = (markerId: string) => {
    setSelectedMarkers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(markerId)) {
        newSet.delete(markerId)  // Deselect if already selected
      } else {
        newSet.add(markerId)     // Add to selection
      }
      return newSet
    })
  }

  // Handle polygon click - toggle selection (multi-select)
  const handlePolygonClick = (polygonId: string) => {
    setSelectedPolygons(prev => {
      const newSet = new Set(prev)
      if (newSet.has(polygonId)) {
        newSet.delete(polygonId)  // Deselect if already selected
      } else {
        newSet.add(polygonId)     // Add to selection
      }
      return newSet
    })
  }

  // Handle polyline click - toggle selection (multi-select)
  const handlePolylineClick = (polylineId: string) => {
    setSelectedPolylines(prev => {
      const newSet = new Set(prev)
      if (newSet.has(polylineId)) {
        newSet.delete(polylineId)  // Deselect if already selected
      } else {
        newSet.add(polylineId)     // Add to selection
      }
      return newSet
    })
  }

  // Check if marker is selected
  const isMarkerSelected = (markerId: string) => selectedMarkers.has(markerId)

  // Check if polygon is selected
  const isPolygonSelected = (polygonId: string) => selectedPolygons.has(polygonId)

  // Check if polyline is selected
  const isPolylineSelected = (polylineId: string) => selectedPolylines.has(polylineId)

  // utility function to create and organize annotations
  const _collectAnnotation = (
    annot: Annotation,
    gmap: google.maps.Map,
    markers: google.maps.Marker[],
    polygons: google.maps.Polygon[],
    polylines: google.maps.Polyline[]
  ) => {
    const annotInstance = createAnnotation(annot, gmap)
        if(annotInstance instanceof google.maps.Marker) {
          markers.push(annotInstance)
          annotInstance.addListener('click', () => {
            console.log(`✓ Marker ${annot.id} clicked`)
            handleMarkerClick(annotInstance.get("app_id"))
          })
        }
        else if(annotInstance instanceof google.maps.Polygon) {
          polygons.push(annotInstance)
          annotInstance.addListener('click', () => {
            console.log(`✓ Polygon ${annot.id} clicked`)
            handlePolygonClick(annotInstance.get("app_id"))
          })
        }
        else if(annotInstance instanceof google.maps.Polyline) {
          polylines.push(annotInstance)
          annotInstance.addListener('click', () => {
            console.log(`✓ Polyline ${annot.id} clicked`)
            handlePolylineClick(annotInstance.get("app_id"))
          })
        }
  }

  // Add markers programmatically after map loads
  useEffect(() => {
    if (!map) return

    console.log('✓ Adding markers programmatically...')

    // Define markers to create
    /*const markersData = [
      { id: 'foo', position: { lat: 38.9951228, lng: -77.177219 }, label: 'F' },
      { id: 'bar', position: { lat: 38.9951228, lng: -77.179219 }, label: 'B' },
      { id: 'baz', position: { lat: 38.9961228, lng: -77.179219 }, label: 'Z' },
      { id: 'cup', position: { lat: 38.9941228, lng: -77.177219 }, label: 'cup' },
      { id: 'marker-17', position: { lat: 38.9921228, lng: -77.177219 }, label: '17' },
    ]

    // Define polygons to create
    const polygonsData = [
        { id: 'green', path: [
            { lat: 38.99421228, lng: -77.177419 },
            { lat: 38.99381228, lng: -77.177419 },
            { lat: 38.99381228, lng: -77.177019 },
            { lat: 38.99421228, lng: -77.177019 }] },
    ]*/

    if (!courseData) {
      return;
    }

    // build all the actual annots and gather them into new arrays
    let newMarkers: google.maps.Marker[] = [];
    let newPolygons: google.maps.Polygon[] = [];
    let newPolylines: google.maps.Polyline[] = [];
    for(let hole of courseData.holes) {
      for(let annot of hole.annotations) {
        _collectAnnotation(annot, map, newMarkers, newPolygons, newPolylines)
      }
      for(let annot of courseData.annotations) {
        _collectAnnotation(annot, map, newMarkers, newPolygons, newPolylines)
      }
    }

    /*
    // Create marker instances
    const newMarkers = markersData.map(data => {
      const marker = new google.maps.Marker({
        position: data.position,
        map: map,
        icon: markerImgStyles.tee,
        label: { ...labelStyles.default, text: data.label },
        title: data.id
      })

      // Add click listener
      marker.addListener('click', () => {
        console.log(`✓ Marker ${data.id} clicked`)
        handleMarkerClick(data.id)
      })

      return marker
    })
    */

    setMarkerInstances(newMarkers)
    console.log(`✓ Created ${newMarkers.length} markers`)

    /*
    // Create polygon instances
    const newPolygons = polygonsData.map(data => {
      const polygon = new google.maps.Polygon({
        paths: [data.path],
        map: map,
        fillColor: '#00FF00',
        fillOpacity: 0.3,
      })

      // Add click listener
      polygon.addListener('click', () => {
        console.log(`✓ Polygon ${data.id} clicked`)
        handlePolygonClick(data.id)
      })

      return polygon
    })
    */

    setPolygonInstances(newPolygons)
    console.log(`✓ Created ${newPolygons.length} polygons`)

    setPolylineInstances(newPolylines)
    console.log(`✓ Created ${newPolylines.length} polylines`)

    // Cleanup function
    return () => {
      console.log('Cleaning up markers...')
      newMarkers.forEach(marker => marker.setMap(null))
      console.log('Cleaning up polygons...')
      newPolygons.forEach(polygon => polygon.setMap(null))
      console.log('Cleaning up polylines...')
      newPolylines.forEach(polyline => polyline.setMap(null))
    }
  }, [courseData]) // Only run when a new course loads

  // Update marker styles when selection changes
  useEffect(() => {
    if (markerInstances.length === 0) return

    markerInstances.forEach((marker) => {
      const isSelected = isMarkerSelected(marker.get("app_id"))
      
      console.log("TODO: Update marker styles")
      //marker.setIcon(isSelected ? markerIconStyles.selected : markerImgStyles.cup)
      //marker.setLabel({ 
      //  ...(isSelected ? labelStyles.bold : labelStyles.default), 
      //  text: data.label 
      //})
    })
  }, [selectedMarkers])

  // Update polygon styles when selection changes
  useEffect(() => {
    if (polygonInstances.length === 0) return

    polygonInstances.forEach((polygon) => {
      const isSelected = isPolygonSelected(polygon.get("app_id"))
      
      polygon.setOptions({
        //fillOpacity: isSelected ? 0.4 : 0.15,
        strokeColor: isSelected ? 'white' : '#000000',
        strokeWeight: isSelected ? 4 : 2,
      })
    })
  }, [selectedPolygons])

  // Update polyline styles when selection changes
  useEffect(() => {
    if (polylineInstances.length === 0) return

    polylineInstances.forEach((polyline) => {
      const isSelected = isPolylineSelected(polyline.get("app_id"))

      polyline.setOptions({
        //strokeColor: isSelected ? 'white' : '#000000',
        strokeWeight: isSelected ? 4 : 2,
      })
    })
  }, [selectedPolylines])


  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <div className="map-view-container">
        {/* Course selector dropdown */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 10,
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
        }}>
          <label htmlFor="course-select" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Select Course:
          </label>
          <select
            id="course-select"
            value={selectedCourseId || ''}
            onChange={(e) =>handleCourseSelect(e.target.value)}
            style={{
              padding: '8px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              minWidth: '200px'
            }}
          >
            <option value="">-- Select a course --</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div className="map-info">
          <p>
            Lat: {center.lat.toFixed(6)}, Lng: {center.lng.toFixed(6)}, Zoom: {zoom}
          </p>
          {selectedMarkers.size > 0 && (
            <p style={{ color: '#FFD700', fontWeight: 'bold' }}>
              Selected ({selectedMarkers.size}): {Array.from(selectedMarkers).join(', ')}
            </p>
          )}
        </div>
        
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={initialCenter}
          zoom={initialZoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onIdle={handleIdle}
          onClick={handleClick}
          options={options}
        >
          {/* Markers added programmatically via useEffect */}
        </GoogleMap>
      </div>
    </LoadScript>
  )
}

export default MapView

