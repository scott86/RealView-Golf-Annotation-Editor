import { useState, useEffect, useRef } from 'react'
import { GoogleMap, LoadScript } from '@react-google-maps/api'
import './MapView.css'
import { markerStyles, markerImgStyles, labelStyles, createAnnotation, setSelectionStyles } from '../config/mapStyles'
import { api } from '../utils/api'
import { getLatStep, getLngStep } from '../utils/geo'
import { totalAnnotations, shiftSelectedAnnotations, createVertexMarkers, EditPolygon, EditPolyline, createEditPolygon, insertNewVertex, updateSelectedVertex, deleteSelectedVertex, cleanUpEditPolygon, unselectVertex, cleanUpEditPolyline, createEditPolyline, deleteSelectedVertexPL, insertNewVertexPL, updateSelectedVertexPL } from '../utils/annotations'
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

  const mapRef = useRef<google.maps.Map | null>(null)
  
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
  const [polylineVertexInstances, setPolylineVertexInstances] = useState<Map<string, google.maps.Marker[]>>(new Map())
  
  // Refs to track current instance Maps (for event handlers with stale closures)
  const markerInstancesRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const polygonInstancesRef = useRef<Map<string, google.maps.Polygon>>(new Map())
  const polylineInstancesRef = useRef<Map<string, google.maps.Polyline>>(new Map())

  // track whether a vertex marker is being dragged
  const [isVertexMarkerDragging, setIsVertexMarkerDragging] = useState(false)
  const [draggedVertexMarker, setDraggedVertexMarker] = useState<google.maps.Marker | null>(null)

  const isVertexMarkerDraggingRef = useRef(false)
  const draggedVertexMarkerRef = useRef<google.maps.Marker | null>(null)

  //const [editingPolygon, setEditingPolygon] = useState<EditPolygon | null>(null)
  const editingPolygonRef = useRef<EditPolygon | null>(null)
  const editingPolylineRef = useRef<EditPolyline | null>(null)

  const [uiMode, setUiMode] = useState<"shift" | "edit">("shift")
  const uiModeRef = useRef<"shift" | "edit">("shift")

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
    maxZoom: 24,
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
        if (isVertexMarkerDraggingRef.current) {
          console.log('Vertex marker dragged')
          updateSelectedVertex(editingPolygonRef.current!, e.latLng);
          //draggedVertexMarkerRef.current!.setPosition(e.latLng)
          //setIsVertexMarkerDragging(false)
          //setDraggedVertexMarker(null)
          //setAllPolygonClickability(true)
        }
    }
  }

  const handleRightClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      console.log('Right clicked at:', e.latLng.lat(), e.latLng.lng());

      // this is the only way to go from vertex dragging state to polygon editing mode
      if (isVertexMarkerDraggingRef.current !== null) {
        setIsVertexMarkerDragging(false)
        setDraggedVertexMarker(null)
        unselectVertex(editingPolygonRef.current!)
      }
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

    // edit mode has its own handlers for markers
    if (uiModeRef.current === "edit") {
      return;
    }

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

  const setAllMarkerClickability = (clickable: boolean) => {
    console.log("[set clickability] marker instances: ", markerInstancesRef.current);
    markerInstancesRef.current.forEach((marker, appId) => {
      marker.setOptions({ clickable: clickable });
    })
  }

  const setAllPolygonClickability = (clickable: boolean) => {
    console.log("[set clickability] polygon instances: ", polygonInstancesRef.current);
    polygonInstancesRef.current.forEach((polygon, appId) => {

        polygon.setOptions({ clickable: clickable });
    })
  }

  const setAllPolylineClickability = (clickable: boolean) => {
    console.log("[set clickability] polyline instances: ", polylineInstancesRef.current);
    polylineInstancesRef.current.forEach((polyline, appId) => {
      polyline.setOptions({ clickable: clickable });
    })
  }

  // Handle polygon click - toggle selection (multi-select)
  const handlePolygonClick = (polygonId: string) => {
    console.log("[debug] handlePolygonClick entrypoint");

    // TODO: some janky stuff is happening.
    // need to get to the bottom of why this callback executes twice after one click.
    // maybe it's best to not put a ton of logic inside the setter argument impl.

    setSelectedPolygons(prev => {
      console.log("[debug] handlePolygonClick setter callback entrypoint");
      const newSet = new Set(prev)

      if (newSet.has(polygonId)) {
        newSet.delete(polygonId)  // Deselect if already selected
      } else {
        newSet.add(polygonId)     // Add to selection
      }
      
      /*
      if (newSet.has(polygonId) && draggedVertexMarkerRef.current === null) {
        // we're not editing a vertex, so we can deselect
        newSet.delete(polygonId)  // Deselect if already selected
        if (uiModeRef.current === "edit") {
          // release currently editing polygon and make all polygons clickable again
          cleanUpEditPolygon(editingPolygonRef.current!)
          editingPolygonRef.current = null
          setAllPolygonClickability(true)
        }
      } else if (uiModeRef.current === "shift" || editingPolygonRef.current === null) {
        newSet.add(polygonId)     // Add to selection
        if (uiModeRef.current === "edit") {
          editingPolygonRef.current = createEditPolygon(polygonInstancesRef.current.get(polygonId)!, setIsVertexMarkerDragging, setDraggedVertexMarker)
          // disable clickability for all polygons except this one
          setAllPolygonClickability(false)
          polygonInstancesRef.current.get(polygonId)!.setOptions({ clickable: true })
        }
      }
      */
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

  const markerIdFilterPredicate = (id: string): boolean => {
    // basic case
    if (id.endsWith('Marker')) { return true; }
    // tree case: check that it contains "-Polyline-"
    if (id.includes('-Polyline-')) { return true; }
    return false;
  }

  // can also select annotations via the checkboxes
  const handleBatchSelection = (annotIds: string[], isSelected: boolean) => {

    // filter annotations by google type (Marker/Polygon/Polyline)
    const markerIds = annotIds.filter(markerIdFilterPredicate)
    const polygonIds = annotIds.filter(id => id.endsWith('Polygon'))
    const polylineIds = annotIds.filter(id => id.endsWith('Polyline'))

    // special case: if the trees polyline is selected, replace that id with all individual tree markers
    for (let polyId of polylineIds) {
      for (let markerInstanceId of markerInstancesRef.current.keys()) {
        if (markerInstanceId.startsWith(polyId)) {
          markerIds.push(markerInstanceId);
        }
      }
    }

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

    /*
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
    */
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
  const isAnnotationSelected = (annotAppId: string) => selectedMarkers.has(annotAppId) || selectedPolygons.has(annotAppId) || selectedPolylines.has(annotAppId)

  const isAnyPolySelected = () => selectedPolygons.size > 0 || selectedPolylines.size > 0

  // utility function to create and organize annotations
  const _collectAnnotation = (
    annot: Annotation,
    gmap: google.maps.Map,
    markers: Map<string, google.maps.Marker>,
    polygons: Map<string, google.maps.Polygon>,
    polylines: Map<string, google.maps.Polyline>,
    isGlobal: boolean
  ) => {
    const annotInstances = createAnnotation(annot, gmap, isGlobal)
    for(let annotInstance of annotInstances) {
    
      if(annotInstance === null) { return; } // ignore polylines for now

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
        if(annotInstance.getPath().getLength() == 0) { return; } // hole folders have empty tree linestrings for some reason
        polylines.set(appId, annotInstance)
        annotInstance.addListener('click', () => {
          console.log(`✓ Polyline ${annot.id} clicked`)
          handlePolylineClick(appId)
        })
      }
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
    const newPolylineVerts = new Map<string, google.maps.Marker[]>()
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

    /*
    setPolylineInstances(newPolylines)
    console.log(`✓ Created ${newPolylines.size} polylines`)

    let plVerts: google.maps.Marker[] = [];

    for(let plKey of newPolylines.keys()) {
      plVerts = createVertexMarkers(newPolylines.get(plKey)!, map!, "brown");

      // polyline vertex markers should always be visible,
      // but only clickable if UI is in edit mode
      plVerts.forEach(vert => {
        vert.setOptions({ clickable: true });
        vert.addListener('click', () => {
          console.log(`✓ Polyline vertex ${vert.get("app_id")} clicked`)
          // select this polyline for editing
          handlePolylineClick(plKey);
          if ((uiModeRef.current === "edit") && (!isAnyPolySelected())) {
            setIsVertexMarkerDragging(true);
            setDraggedVertexMarker(vert);
          }
        });
      });
      newPolylineVerts.set(plKey, plVerts);
    }
    setPolylineVertexInstances(newPolylineVerts)
    console.log(`✓ Created ${newPolylineVerts.size} polyline vertex instances`)
    */

    // check for null map references
    // and also override the right-click handler for everyone
    // and also get a rough estimate of the min/max lat/lng bounds
    let minLat = 90.0, maxLat = -90.0, minLng = 180.0, maxLng = -180.0;
    newMarkers.forEach(marker => {
      if (marker.getMap() === null) {
        console.error(`Marker ${marker.get("app_id")} has no map reference`)
      }
      marker.addListener('rightclick', (e: google.maps.MapMouseEvent) => { handleRightClick(e);})
      minLat = Math.min(minLat, marker.getPosition()!.lat());
      maxLat = Math.max(maxLat, marker.getPosition()!.lat());
      minLng = Math.min(minLng, marker.getPosition()!.lng());
      maxLng = Math.max(maxLng, marker.getPosition()!.lng());
    })
    newPolygons.forEach(polygon => {
      if (polygon.getMap() === null) {
        console.error(`Polygon ${polygon.get("app_id")} has no map reference`)
      }
      polygon.addListener('rightclick', (e: google.maps.MapMouseEvent) => { handleRightClick(e);})
    })
    newPolylines.forEach(polyline => {
      if (polyline.getMap() === null) {
        console.error(`Polyline ${polyline.get("app_id")} has no map reference`)
      }
      polyline.addListener('rightclick', (e: google.maps.MapMouseEvent) => { handleRightClick(e);})
    })

    // pan and zoom the map so that the whole course is visible
    if (map) {
      map.panTo({ lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 });
      map.setZoom(15);
    }

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
  // Also need to enforce rules for edit mode
  useEffect(() => {

    polygonInstances.forEach((polygon, appId) => {
      const isSelected = isPolygonSelected(appId)
      setSelectionStyles(polygon, isSelected);
    })

    polylineInstances.forEach((polyline, appId) => {
      const isSelected = isPolylineSelected(appId)
      setSelectionStyles(polyline, isSelected);
    })

    if (uiMode === "edit") {

      // edit mode is only for polys
      setAllMarkerClickability(false)

      if (!isAnyPolySelected()) {
        // one polygon/polyline selected ==> clean state. all polys should be clickable
        setAllPolygonClickability(true)
        setAllPolylineClickability(true)

        // remove all vertex markers
        if (editingPolygonRef.current !== null) {
          console.log("cleaning up edit polygon");
          cleanUpEditPolygon(editingPolygonRef.current!)
          editingPolygonRef.current = null;
        }
        if (editingPolylineRef.current !== null) {
          console.log("cleaning up edit polyline");
          cleanUpEditPolyline(editingPolylineRef.current!)
          editingPolylineRef.current = null;
        }
      } else {
        // clean state ==> one poly selected.
        // selected poly should be clickable in order to deselect it
        setAllPolygonClickability(false)
        setAllPolylineClickability(false)
        selectedPolygons.forEach(polygonId => {
          polygonInstances.get(polygonId)!.setOptions({ clickable: true })
          editingPolygonRef.current = createEditPolygon(polygonInstances.get(polygonId)!, setIsVertexMarkerDragging, setDraggedVertexMarker)
        })
        selectedPolylines.forEach(polylineId => {
          polylineInstances.get(polylineId)!.setOptions({ clickable: true })
          editingPolylineRef.current = createEditPolyline(polylineInstances.get(polylineId)!, setIsVertexMarkerDragging, setDraggedVertexMarker)
        })
      }
    }
  }, [selectedPolygons, polygonInstances, selectedPolylines, polylineInstances])

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
    mapRef.current = map
  }, [map])

  useEffect(() => {
    isVertexMarkerDraggingRef.current = isVertexMarkerDragging
  }, [isVertexMarkerDragging])

  useEffect(() => {
    draggedVertexMarkerRef.current = draggedVertexMarker
  }, [draggedVertexMarker])

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

  useEffect(() => {
    uiModeRef.current = uiMode
  }, [uiMode])

  /*
  useEffect(() => {
    editingPolygonRef.current = editingPolygon
  }, [editingPolygon])
  */

  useEffect(() => {
    // upon a mode switch, deselect everything
    setSelectedMarkers(new Set())
    setSelectedPolygons(new Set())
    setSelectedPolylines(new Set())
    if (editingPolygonRef.current !== null) {
      cleanUpEditPolygon(editingPolygonRef.current!)
      editingPolygonRef.current = null;
    }
    setAllPolygonClickability(true)
    setAllPolylineClickability(true)
    if (uiModeRef.current !== "edit") {
      setAllMarkerClickability(true)
    } else {
      setAllMarkerClickability(false)
    }
    polylineVertexInstances.forEach(verts => {
      verts.forEach(vert => {
        vert.setOptions({ clickable: uiModeRef.current === "edit" });
      });
    })
    setIsVertexMarkerDragging(false)
    setDraggedVertexMarker(null)
  }, [uiMode])

  // Keyboard event listener for arrow (and other)keys
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

      // key presses that apply to edit mode (with selected vertex)
      if (uiModeRef.current === "edit" && draggedVertexMarkerRef.current !== null) {
        
        // delete key can delete a selected vertex
        if (event.key === 'Delete') {
          if (editingPolygonRef.current !== null) {
            deleteSelectedVertex(editingPolygonRef.current!)
          } else {
            deleteSelectedVertexPL(editingPolylineRef.current!)
          }
        }

        // insert key can insert a new vertex
        if (event.key === 'Insert') {
          if (editingPolygonRef.current !== null) {
            insertNewVertex(editingPolygonRef.current!)
          } else {
            insertNewVertexPL(editingPolylineRef.current!)
          }
        }

      }
    }

    // Add event listener to window to ensure we capture all keyboard events
    window.addEventListener('keydown', handleKeyDown, true) // Use capture phase
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, []) // Empty dependency array - set up once on mount

  function renderGlobalAnnotations(annotations: Annotation[]) {

    // separate tree annotations from other annotations
    let treeData: [string, string, string][] = [];
    let otherAnnots: Annotation[] = [];
    annotations.forEach((annot) => {
      if(annot.annotType !== "trees") {
        otherAnnots.push(annot);
      } else {
        for(let i = 0; i < annot.rawCoords.length; i += 2) {
          treeData.push([`global-${annot.id}-${i}`, annot.id+"-"+i.toString(), annot.appId+"-"+i.toString()]);
        }
      }
    });

    return (
      <div style={{ paddingLeft: '35px', marginTop: '5px' }}>
        {otherAnnots.map((annot) => (      
          <div key={`global-${annot.id}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
            <input
              type="checkbox"
              id={`annot-global-${annot.id}`}
              style={{ marginRight: '8px', cursor: 'pointer' }}
              checked={isAnnotationSelected(annot.appId)}
              onChange={(e) => handleSingleAnnotationSelect(annot.appId, e.target.checked)}
              disabled={uiMode === "edit" && (editingPolygonRef.current !== null) && !isAnnotationSelected(annot.appId)}
            />
            <label htmlFor={`annot-global-${annot.id}`} style={{ cursor: 'pointer', fontSize: '13px' }}>
              {annot.annotType}
            </label>
          </div>
        ))}
        {treeData.map((tree: [string, string, string]) => (
          <div key={tree[0]} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
            <input
              type="checkbox"
              id={`annot-`+tree[0]}
              style={{ marginRight: '8px', cursor: 'pointer' }}
              checked={isAnnotationSelected(tree[2])}
              onChange={(e) => handleSingleAnnotationSelect(tree[2], e.target.checked)}
              disabled={uiMode === "edit" && (editingPolygonRef.current !== null) && !isAnnotationSelected(tree[2])} />
            <label htmlFor={`annot-`+tree[0]} style={{ cursor: 'pointer', fontSize: '13px' }}>tree</label>
          </div>
        ))}
      </div>
    );
  }


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

          <div style={{
            marginTop: '15px',
            borderTop: '1px solid #ccc',
            paddingTop: '10px'
          }}>
            {/* rocker switch to toggle between shift and edit mode */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
                Mode
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#f0f0f0',
                padding: '4px',
                borderRadius: '20px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#666',
                  minWidth: '40px',
                  textAlign: 'center'
                }}
                title="Can select multiple annotations and shift them all using the arrow keys. Perfect for correcting orthorectification errors.">
                  Shift
                </span>
                <div style={{
                  position: 'relative',
                  width: '48px',
                  height: '24px',
                  backgroundColor: '#ccc',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
                onClick={() => setUiMode(uiMode === "shift" ? "edit" : "shift")}>
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: uiMode === "shift" ? "2px" : "26px",
                    width: '20px',
                    height: '20px',
                    backgroundColor: "#0099ff",
                    borderRadius: '50%',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'transform 0.3s, left 0.3s'
                  }}></div>
                </div>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#666',
                  minWidth: '40px',
                  textAlign: 'center'
                }}
                title="Edit the vertices of a single polygon">
                  Edit
                </span>
              </div>
            </div>
          </div>

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
              All annotations
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
                disabled={uiMode === "edit"}
              />
              <label htmlFor="folder-global" style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Global
              </label>
            </div>
            
            {/* Global Annotations */}
            {expandedFolders.has('global') && (
              renderGlobalAnnotations(courseData.annotations)
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
                  disabled={uiMode === "edit"}
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
                        checked={isAnnotationSelected(annot.appId)}
                        onChange={(e) => handleSingleAnnotationSelect(annot.appId, e.target.checked)}
                        disabled={uiMode === "edit" && (editingPolygonRef.current !== null) && !isAnnotationSelected(annot.appId)}
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
          onRightClick={handleRightClick}
          options={options}
        >
          {/* Markers added programmatically via useEffect */}
        </GoogleMap>
      </div>
    </LoadScript>
  )
}

export default MapView

