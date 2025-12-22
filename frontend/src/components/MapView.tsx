import { useState, useEffect, useRef } from 'react'
import { GoogleMap, LoadScript } from '@react-google-maps/api'
import './MapView.css'
import { markerStyles, markerImgStyles, labelStyles, createAnnotation, setSelectionStyles } from '../config/mapStyles'
import { api } from '../utils/api'
import { getLatStep, getLngStep } from '../utils/geo'
import { totalAnnotations, shiftSelectedAnnotations } from '../utils/annotations'
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
  
  // Ref to track current course data (for event handlers with stale closures)
  const courseDataRef = useRef<CourseData | null>(null)
  
  // Annotation selection tree state
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  
  // Selection state - stores IDs of multiple selected annots
  const [selectedMarkers, setSelectedMarkers] = useState<Set<string>>(new Set())
  const [selectedPolygons, setSelectedPolygons] = useState<Set<string>>(new Set())
  const [selectedPolylines, setSelectedPolylines] = useState<Set<string>>(new Set())
  
  // Refs to track current selection state (for event handlers with stale closures)
  const selectedMarkersRef = useRef<Set<string>>(new Set())
  const selectedPolygonsRef = useRef<Set<string>>(new Set())
  const selectedPolylinesRef = useRef<Set<string>>(new Set())
  
  // Store annot instances
  const [markerInstances, setMarkerInstances] = useState<Map<string, google.maps.Marker>>(new Map())
  const [polygonInstances, setPolygonInstances] = useState<Map<string, google.maps.Polygon>>(new Map())
  const [polylineInstances, setPolylineInstances] = useState<Map<string, google.maps.Polyline>>(new Map())
  
  // Refs to track current instance Maps (for event handlers with stale closures)
  const markerInstancesRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const polygonInstancesRef = useRef<Map<string, google.maps.Polygon>>(new Map())
  const polylineInstancesRef = useRef<Map<string, google.maps.Polyline>>(new Map())


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
    tilt: 0, // Disable tilt/45° view
    keyboardShortcuts: false // Disable Google Maps' built-in keyboard controls
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

  // can also select annotations via the checkboxes
  const handleBatchSelection = (annotIds: string[], isSelected: boolean) => {

    // filter annotations by google type (Marker/Polygon/Polyline)
    const markerIds = annotIds.filter(id => id.endsWith('Marker'))
    const polygonIds = annotIds.filter(id => id.endsWith('Polygon'))
    const polylineIds = annotIds.filter(id => id.endsWith('Polyline'))

    setSelectedMarkers(prev => {
      const newSet = new Set(prev)
      markerIds.map(markerId => {
        if (!isSelected && newSet.has(markerId)) {
          newSet.delete(markerId)  // Deselect if already selected
        } else if (isSelected && !newSet.has(markerId)) {
          newSet.add(markerId)     // Add to selection if previously unselected
        }
      })
      return newSet
    })

    setSelectedPolygons(prev => {
      const newSet = new Set(prev)
      polygonIds.map(polygonId => {
        if (!isSelected && newSet.has(polygonId)) {
          newSet.delete(polygonId)  // Deselect if already selected
        } else if (isSelected && !newSet.has(polygonId)) {
          newSet.add(polygonId)     // Add to selection if previously unselected
        }
      })
      return newSet
    })

    setSelectedPolylines(prev => {
      const newSet = new Set(prev)
      polylineIds.map(polylineId => {
        if (!isSelected && newSet.has(polylineId)) {
          newSet.delete(polylineId)  // Deselect if already selected
        } else if (isSelected && !newSet.has(polylineId)) {
          newSet.add(polylineId)     // Add to selection if previously unselected
        }
      })
      return newSet
    })
  }
  const handleSingleAnnotationSelect = (annotId: string, isSelected: boolean) => {
    handleBatchSelection([annotId], isSelected)
  }

  const handleSelectGlobalAnnotations = (isSelected: boolean) => {
    handleBatchSelection(courseData?.annotations.map(annot => annot.appId) || [], isSelected)

    // update checkbox states for all child annotations without triggering a re-render
    courseData?.annotations.forEach(annot => {
      const checkbox = document.getElementById(`annot-global-${annot.id}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = isSelected;
      }
    })
  }

  const handleSelectHoleAnnotations = (holeId: number, isSelected: boolean) => {
    handleBatchSelection(courseData?.holes.find(hole => hole.id === holeId)?.annotations.map(annot => annot.appId) || [], isSelected)

    // update checkbox states for all child annotations without triggering a re-render
    courseData?.holes.find(hole => hole.id === holeId)?.annotations.forEach(annot => {
      const checkbox = document.getElementById(`annot-hole-${holeId}-${annot.id}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = isSelected;
      }
    })
  }

  const handleSelectAllAnnotations = (isSelected: boolean) => {
    handleBatchSelection(courseData?.annotations.map(annot => annot.appId) || [], isSelected)
    courseData?.holes.forEach(hole => {
      handleBatchSelection(hole.annotations.map(annot => annot.appId) || [], isSelected)
    })

    // update checkbox states for all child annotations without triggering a re-render
    courseData?.annotations.forEach(annot => {
      const globalCB = document.getElementById(`folder-global`) as HTMLInputElement;
      if (globalCB) {
        globalCB.checked = isSelected;
      }
      const checkbox = document.getElementById(`annot-global-${annot.id}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = isSelected;
      }
    })
    courseData?.holes.forEach(hole => {
      const holeCB = document.getElementById(`folder-hole-${hole.id}`) as HTMLInputElement;
      if (holeCB) {
        holeCB.checked = isSelected;
      }
      hole.annotations.forEach(annot => {
        const checkbox = document.getElementById(`annot-hole-${hole.id}-${annot.id}`) as HTMLInputElement;
        if (checkbox) {
          checkbox.checked = isSelected;
        }
      })
    })
  }

  // Check if marker is selected
  const isMarkerSelected = (markerId: string) => selectedMarkers.has(markerId)

  // Check if polygon is selected
  const isPolygonSelected = (polygonId: string) => selectedPolygons.has(polygonId)

  // Check if polyline is selected
  const isPolylineSelected = (polylineId: string) => selectedPolylines.has(polylineId)

  // Check if annotation is selected
  const isAnnotationSelected = (annot: Annotation) => selectedMarkers.has(annot.appId) || selectedPolygons.has(annot.appId) || selectedPolylines.has(annot.appId)

  // utility function to create and organize annotations
  const _collectAnnotation = (
    annot: Annotation,
    gmap: google.maps.Map,
    markers: Map<string, google.maps.Marker>,
    polygons: Map<string, google.maps.Polygon>,
    polylines: Map<string, google.maps.Polyline>,
    isGlobal: boolean
  ) => {
    const annotInstance = createAnnotation(annot, gmap, isGlobal)
    const appId = annotInstance.get("app_id")
    
    if(annotInstance instanceof google.maps.Marker) {
      markers.set(appId, annotInstance)
      annotInstance.addListener('click', () => {
        console.log(`✓ Marker ${appId} clicked`)
        handleMarkerClick(appId)
      })
    }
    else if(annotInstance instanceof google.maps.Polygon) {
      polygons.set(appId, annotInstance)
      annotInstance.addListener('click', () => {
        console.log(`✓ Polygon ${annot.id} clicked`)
        handlePolygonClick(appId)
      })
    }
    else if(annotInstance instanceof google.maps.Polyline) {
      polylines.set(appId, annotInstance)
      annotInstance.addListener('click', () => {
        console.log(`✓ Polyline ${annot.id} clicked`)
        handlePolylineClick(appId)
      })
    }
    
  }

  // Add markers programmatically after map loads
  useEffect(() => {
    if (!map) return

    if (!courseData) {
      return;
    }

    // build all the actual annots and gather them into new Maps
    const newMarkers = new Map<string, google.maps.Marker>()
    const newPolygons = new Map<string, google.maps.Polygon>()
    const newPolylines = new Map<string, google.maps.Polyline>()
    for(let hole of courseData.holes) {
      for(let annot of hole.annotations) {
        _collectAnnotation(annot, map, newMarkers, newPolygons, newPolylines, false)
      }
    }
    for(let annot of courseData.annotations) {
      _collectAnnotation(annot, map, newMarkers, newPolygons, newPolylines, true)
    }

    setMarkerInstances(newMarkers)
    console.log(`✓ Created ${newMarkers.size} markers`)

    setPolygonInstances(newPolygons)
    console.log(`✓ Created ${newPolygons.size} polygons`)

    setPolylineInstances(newPolylines)
    console.log(`✓ Created ${newPolylines.size} polylines`)

    // check for null map references
    newMarkers.forEach(marker => {
      if (marker.getMap() === null) {
        console.error(`Marker ${marker.get("app_id")} has no map reference`)
      }
    })
    newPolygons.forEach(polygon => {
      if (polygon.getMap() === null) {
        console.error(`Polygon ${polygon.get("app_id")} has no map reference`)
      }
    })
    newPolylines.forEach(polyline => {
      if (polyline.getMap() === null) {
        console.error(`Polyline ${polyline.get("app_id")} has no map reference`)
      }
    })

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
    if (markerInstances.size === 0) return

    markerInstances.forEach((marker, appId) => {
      const isSelected = isMarkerSelected(appId);
      setSelectionStyles(marker, isSelected);
    })
  }, [selectedMarkers, markerInstances])

  // Update polygon styles when selection changes
  useEffect(() => {
    if (polygonInstances.size === 0) return

    polygonInstances.forEach((polygon, appId) => {
      const isSelected = isPolygonSelected(appId)
      setSelectionStyles(polygon, isSelected);
    })
  }, [selectedPolygons, polygonInstances])

  // Update polyline styles when selection changes
  useEffect(() => {
    if (polylineInstances.size === 0) return

    polylineInstances.forEach((polyline, appId) => {
      const isSelected = isPolylineSelected(appId);
      setSelectionStyles(polyline, isSelected);
    })
  }, [selectedPolylines, polylineInstances])

  // Sync refs with state (so event handlers always have current values)
  useEffect(() => {
    selectedMarkersRef.current = selectedMarkers
  }, [selectedMarkers])

  useEffect(() => {
    selectedPolygonsRef.current = selectedPolygons
  }, [selectedPolygons])

  useEffect(() => {
    selectedPolylinesRef.current = selectedPolylines
  }, [selectedPolylines])

  useEffect(() => {
    markerInstancesRef.current = markerInstances
  }, [markerInstances])

  useEffect(() => {
    polygonInstancesRef.current = polygonInstances
  }, [polygonInstances])

  useEffect(() => {
    polylineInstancesRef.current = polylineInstances
  }, [polylineInstances])

  useEffect(() => {
    courseDataRef.current = courseData
  }, [courseData])

  // Keyboard event listener for arrow keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault() // Prevent default map panning
        event.stopPropagation() // Stop event from reaching Google Maps

        // calculate step sizes based on reference latitude
        const latStep = getLatStep();
        const lngStep = getLngStep(courseDataRef.current!.ref_lat);

        let deltaLat = 0.0, deltaLng = 0.0;
        switch(event.key) {
          case 'ArrowUp':
            deltaLat = latStep;
            console.log('Arrow Up pressed')
            break
          case 'ArrowDown':
            deltaLat = -latStep;
            console.log('Arrow Down pressed')
            break
          case 'ArrowLeft':
            deltaLng = -lngStep;
            console.log('Arrow Left pressed')
            break
          case 'ArrowRight':
            deltaLng = lngStep;
            console.log('Arrow Right pressed')
            break
        }
        // Use refs to get current state values (avoid stale closure)
        shiftSelectedAnnotations(
          deltaLat, 
          deltaLng, 
          selectedMarkersRef.current, 
          selectedPolygonsRef.current, 
          selectedPolylinesRef.current, 
          markerInstancesRef.current, 
          polygonInstancesRef.current, 
          polylineInstancesRef.current
        )
      }
    }

    // Add event listener to window to ensure we capture all keyboard events
    window.addEventListener('keydown', handleKeyDown, true) // Use capture phase
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, []) // Empty dependency array - set up once on mount


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

        {(selectedCourseId !== null && courseData) &&
        <div style={{ 
          marginTop: '15px',
          maxHeight: '500px',
          overflowY: 'auto',
          borderTop: '1px solid #ccc',
          paddingTop: '10px'
        }}>

          {/* Select All */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', paddingLeft: '5px' }}>
            <input
              type="checkbox"
              id="select-all"
              style={{ marginRight: '8px', cursor: 'pointer' }}
              onChange={(e) => handleSelectAllAnnotations(e.target.checked)}
            />
            <label htmlFor="select-all" style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              All annotations ({totalAnnotations(courseData)})
            </label>
          </div>

          {/* Global Folder */}
          <div style={{ marginBottom: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '5px' }}>
              <button
                onClick={() => {
                  setExpandedFolders(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has('global')) {
                      newSet.delete('global');
                    } else {
                      newSet.add('global');
                    }
                    return newSet;
                  });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  marginRight: '5px',
                  fontSize: '12px',
                  width: '16px'
                }}
              >
                {expandedFolders.has('global') ? '▼' : '▶'}
              </button>
              <input
                type="checkbox"
                id="folder-global"
                style={{ marginRight: '8px', cursor: 'pointer' }}
                onChange={(e) => handleSelectGlobalAnnotations(e.target.checked)}
              />
              <label htmlFor="folder-global" style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Global ({courseData.annotations.length})
              </label>
            </div>
            
            {/* Global Annotations */}
            {expandedFolders.has('global') && (
              <div style={{ paddingLeft: '35px', marginTop: '5px' }}>
                {courseData.annotations.map((annot) => (
                  <div key={`global-${annot.id}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
                    <input
                      type="checkbox"
                      id={`annot-global-${annot.id}`}
                      style={{ marginRight: '8px', cursor: 'pointer' }}
                      checked={isAnnotationSelected(annot)}
                      onChange={(e) => handleSingleAnnotationSelect(annot.appId, e.target.checked)}
                    />
                    <label htmlFor={`annot-global-${annot.id}`} style={{ cursor: 'pointer', fontSize: '13px' }}>
                      {annot.annotType}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hole Folders */}
          {courseData.holes.map((hole) => (
            <div key={hole.id} style={{ marginBottom: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '5px' }}>
                <button
                  onClick={() => {
                    setExpandedFolders(prev => {
                      const newSet = new Set(prev);
                      const folderId = `hole-${hole.id}`;
                      if (newSet.has(folderId)) {
                        newSet.delete(folderId);
                      } else {
                        newSet.add(folderId);
                      }
                      return newSet;
                    });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    marginRight: '5px',
                    fontSize: '12px',
                    width: '16px'
                  }}
                >
                  {expandedFolders.has(`hole-${hole.id}`) ? '▼' : '▶'}
                </button>
                <input
                  type="checkbox"
                  id={`folder-hole-${hole.id}`}
                  style={{ marginRight: '8px', cursor: 'pointer' }}
                  onChange={(e) => handleSelectHoleAnnotations(hole.id, e.target.checked)}
                />
                <label htmlFor={`folder-hole-${hole.id}`} style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Hole {hole.holeNumber} - Par {hole.par}
                </label>
              </div>
              
              {/* Hole Annotations */}
              {expandedFolders.has(`hole-${hole.id}`) && (
                <div style={{ paddingLeft: '35px', marginTop: '5px' }}>
                  {hole.annotations.map((annot) => (
                    <div key={`hole-${hole.id}-${annot.id}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
                      <input
                        type="checkbox"
                        id={`annot-hole-${hole.id}-${annot.id}`}
                        style={{ marginRight: '8px', cursor: 'pointer' }}
                        checked={isAnnotationSelected(annot)}
                        onChange={(e) => handleSingleAnnotationSelect(annot.appId, e.target.checked)}
                      />
                      <label htmlFor={`annot-hole-${hole.id}-${annot.id}`} style={{ cursor: 'pointer', fontSize: '13px' }}>
                        {annot.annotType}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        }

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

