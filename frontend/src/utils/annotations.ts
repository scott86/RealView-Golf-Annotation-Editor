import { CourseData } from '../types/map'

export interface VertexMarker {
  prev: VertexMarker | null;
  next: VertexMarker | null;
  marker: google.maps.Marker;
  ctxt: EditPolygon | EditPolyline | null;
  index: number;
}

export interface EditPolygon {
  ctxt: google.maps.Polygon;
  headVertexMarker: VertexMarker | null;
  selectedVertexMarker: VertexMarker | null;
}

export interface EditPolyline {
  ctxt: google.maps.Polyline;
  headVertexMarker: VertexMarker | null;
  selectedVertexMarker: VertexMarker | null;
}

export const deleteSelectedVertex = (editPolygon: EditPolygon) => {
  if (editPolygon.selectedVertexMarker === null) { return; }
  if (editPolygon.headVertexMarker!.prev!.index < 3) { return; }
  
  // remove from polygon path
  const path = editPolygon.ctxt.getPath();
  path.removeAt(editPolygon.selectedVertexMarker.index);

  // remove the vertex marker from the map
  let vm = editPolygon.selectedVertexMarker;
  vm.marker.setMap(null);
  
  // update linked list connections
  vm.prev!.next = vm.next;
  vm.next!.prev = vm.prev;
  editPolygon.selectedVertexMarker = vm.prev;
  vm.prev!.marker.setIcon(vertexSymbol("blue"));

  // indices need to be updated
  vm = vm.next!;
  while(vm !== editPolygon.headVertexMarker) {
    vm!.index -= 1;
    vm = vm!.next!;
  }

  // update marker colors
  vm.marker.setIcon(vertexSymbol("white"));
}

export const insertNewVertex = (editPolygon: EditPolygon) => {
  if (editPolygon.selectedVertexMarker === null) { return; }
  const path = editPolygon.ctxt.getPath();
  const vm0 = editPolygon.selectedVertexMarker;
  const vm1 = vm0.next;
  const ll0: google.maps.LatLng = path.getAt(vm0!.index);
  const ll1: google.maps.LatLng = path.getAt(vm1!.index);
  const llMid: google.maps.LatLng = new google.maps.LatLng((ll0.lat() + ll1.lat()) / 2, (ll0.lng() + ll1.lng()) / 2);
  path.insertAt(editPolygon.selectedVertexMarker.index + 1, llMid);
  const newVM = {
    prev: vm0,
    next: vm1,
    marker: new google.maps.Marker({
      position: llMid,
      map: editPolygon.ctxt.getMap(),
    }),
    ctxt: editPolygon,
    index: vm0.index + 1,
  };

  // update linked list
  vm0!.next = newVM;
  vm1!.prev = newVM;

  // need to update every index beyond this one until it comes back to the head marker
  let vm = vm1;
  while(vm !== editPolygon.headVertexMarker) {
    vm!.index += 1;
    vm = vm!.next;
  }

  // update marker colors
  vm0.marker.setIcon(vertexSymbol("white"));
  editPolygon.selectedVertexMarker = newVM;
  newVM.marker.setIcon(vertexSymbol("blue"));
}

export const cleanUpEditPolygon = (editPolygon: EditPolygon) => {
  console.log("cleaning up vertex markers...");
  let vm = editPolygon.headVertexMarker!;
  vm.marker.setMap(null);
  vm = vm.next!;
  while(vm !== editPolygon.headVertexMarker) {
    vm.marker.setMap(null);
    vm = vm.next!;
  }
}

export const unselectVertex = (editPolygon: EditPolygon) => {
  if (editPolygon.selectedVertexMarker !== null) {
    editPolygon.selectedVertexMarker!.marker.setIcon(vertexSymbol("white"));
    editPolygon.selectedVertexMarker = null;
  }
  editPolygon.ctxt.setOptions({ clickable: true });
}

const isSamePoint = (ll1: google.maps.LatLng, ll2: google.maps.LatLng): boolean => {
  let dLat = Math.abs(ll1.lat()-ll2.lat())
  let dLng = Math.abs(ll1.lng()-ll2.lng())
  return Math.sqrt( (dLat*dLat) + (dLng*dLng) ) < 0.0000001
}

/*
export const selectNewVertex = (editPolygon: EditPolygon, markerId: string): google.maps.Marker | null => {
  const marker = editPolygon.vertexMarkers.find(vm => vm.marker.get("app_id") === markerId);
  if (marker) {
    if (editPolygon.selectedVertexIndex !== -1) {
      editPolygon.vertexMarkers[editPolygon.selectedVertexIndex].marker.setIcon(vertexSymbol("white"));
    }
    editPolygon.selectedVertexIndex = marker.index;
    marker.marker.setIcon(vertexSymbol("blue"));
  }

  if (editPolygon.selectedVertexIndex === -1) {
    return null;
  }
  return editPolygon.vertexMarkers[editPolygon.selectedVertexIndex].marker;
}
*/

export const updateSelectedVertex = (editPolygon: EditPolygon, latLng: google.maps.LatLng) => {
  editPolygon.selectedVertexMarker!.marker.setPosition(latLng);
  const path = editPolygon.ctxt.getPath();
  path.setAt(editPolygon.selectedVertexMarker!.index, latLng);
}

const handleVertexClick = (editPolygon: EditPolygon, vertexMarker: VertexMarker) => {
  // nothing to do if the vertex is already selected
  if (vertexMarker === editPolygon.selectedVertexMarker) { return; }

  // unselect the previously selected vertex, if applicable
  if (editPolygon.selectedVertexMarker !== null) {
    editPolygon.selectedVertexMarker.marker.setIcon(vertexSymbol("white"));
  }

  // select the new vertex
  editPolygon.selectedVertexMarker = vertexMarker;
  editPolygon.selectedVertexMarker.marker.setIcon(vertexSymbol("blue"));

  // ensure parent polygon is not clickable
  editPolygon.ctxt.setOptions({ clickable: false });
}

export const createEditPolygon = (polygon: google.maps.Polygon, setIsVertexMarkerDragging: (isDragging: boolean) => void, setDraggedVertexMarker: (marker: google.maps.Marker | null) => void) => {
  //const path = polygon.getPath();
  
  const editPolygon: EditPolygon = {
    ctxt: polygon,
    headVertexMarker: null,
    selectedVertexMarker: null,
  }
  
  const mapMarkers = createVertexMarkers(polygon, polygon.getMap()!);
  const vMarkers: VertexMarker[] = [];
  for (let i = 0; i < mapMarkers.length; i++) {
    const vMarker = {
      prev: null,
      next: null,
      marker: mapMarkers[i],
      ctxt: editPolygon,
      index: i,
    }
    vMarkers.push(vMarker);
    mapMarkers[i].set("app_id", crypto.randomUUID());
  }
  for (let i=0; i < vMarkers.length; i++) {
    vMarkers[i].prev = vMarkers[(i+vMarkers.length-1)%vMarkers.length];
    vMarkers[i].next = vMarkers[(i+1)%vMarkers.length];
  }

  editPolygon.headVertexMarker = vMarkers[0];
  
  for (let i = 0; i < vMarkers.length; i++) {

    vMarkers[i].marker.addListener('click', () => {
      //console.log("[debug map] vertex marker clicked. map = ", editPolygon.vertexMarkers[i].marker.getMap());
      //console.log("[debug vertexMarkers] editPolygon.vertexMarkers = ", editPolygon.vertexMarkers);
      
      handleVertexClick(editPolygon, vMarkers[i])

      setIsVertexMarkerDragging(true);
      setDraggedVertexMarker(vMarkers[i].marker);

    });
  }

  // sanity check: all vertex markers should be on the same map
  const map = vMarkers[0].marker.getMap();
  vMarkers.forEach(vm => {
    if (vm.marker.getMap() !== map) {
      console.error("Vertex marker is on a different map than the first one");
    }
  });

  return editPolygon;
}

export const cleanUpEditPolyline = (editPolyline: EditPolyline) => {
  console.log("cleaning up vertex markers...");
  let vm = editPolyline.headVertexMarker!;
  vm.marker.setMap(null);
  vm = vm.next!;
  while(vm !== null) {
    vm.marker.setMap(null);
    vm = vm.next!;
  }
}

// delete the currently-selected vertex from the polyline
export const deleteSelectedVertexPL = (editPolyline: EditPolyline) => {
  
  // can't delete it if there's only one vertex
  if (editPolyline.headVertexMarker!.next === null) { return; }
  
  const path = editPolyline.ctxt.getPath();
  const vm0 = editPolyline.selectedVertexMarker!;

  // update indices of all vertices beyond this one
  let vm_ = vm0.next;
  while(vm_ !== null) {
    vm_.index -= 1;
    if (vm_.index == 0) {
      // this must be the new head vertex
      editPolyline.headVertexMarker = vm_;
    }
    vm_ = vm_.next;
  }

  path.removeAt(vm0.index);
  vm0.marker.setMap(null);
  let newSelectedVertex: VertexMarker | null = null;
  if (vm0.prev !== null) {
    newSelectedVertex = vm0.prev;
    if (vm0.next !== null) {
      vm0.prev.next = vm0.next;
      vm0.next.prev = vm0.prev;
    } else {
      vm0.prev.next = null;
    }
  } else {
    vm0.next!.prev = null;
    newSelectedVertex = vm0.next;
  }
  editPolyline.selectedVertexMarker = newSelectedVertex;
  editPolyline.selectedVertexMarker!.marker.setIcon(vertexSymbol("blue"));
}

export const insertNewVertexPL = (editPolyline: EditPolyline) => {
  if (editPolyline.selectedVertexMarker === null) { return; }
  const path = editPolyline.ctxt.getPath();
  const vm0 = editPolyline.selectedVertexMarker;

  let newLat: number = 0;
  let newLng: number = 0;
  let newIdx: number = editPolyline.selectedVertexMarker.index + 1
  let newPrev: VertexMarker | null = null;
  let newNext: VertexMarker | null = null;

  if (path.getLength() == 1) {
    // degenerate case: length-1 linestring
    newLng = vm0.marker.getPosition()!.lng();
    newLat = vm0.marker.getPosition()!.lat() + 0.0005;
    newPrev = vm0;
  } else {
    let ll0: google.maps.LatLng | null = null;
    let ll1: google.maps.LatLng | null = null;
    if (vm0.next === null) {
      // degenerate case: last vertex in path is selected
      ll0 = vm0.prev!.marker.getPosition()!;
      ll1 = vm0.marker.getPosition()!
      newIdx -= 1;
      newNext = vm0;
      newPrev = vm0.prev!;
    } else {
      // normal case: put new one between selected and next
      ll0 = vm0.marker.getPosition()!;
      ll1 = vm0.next.marker.getPosition()!;
      newNext = vm0.next!;
      newPrev = vm0;
    }
    newLng = (ll0.lng() + ll1.lng()) / 2;
    newLat = (ll0.lat() + ll1.lat()) / 2;
  }

  const llMid: google.maps.LatLng = new google.maps.LatLng(newLat, newLng);
  path.insertAt(newIdx, llMid);
  const newVM = {
    prev: newPrev,
    next: newNext,
    marker: new google.maps.Marker({
      position: llMid,
      map: editPolyline.ctxt.getMap(),
    }),
    ctxt: editPolyline,
    index: newIdx,
  };

  // update linked list
  newVM.prev.next = newVM;
  if (newVM.next !== null) {
    newVM.next.prev = newVM;
  }

  // need to update every index beyond this one
  let vm: VertexMarker = newVM;
  while(vm.next !== null) {
    vm = vm.next!;
    vm!.index += 1;
  }

  // update marker colors
  editPolyline.selectedVertexMarker.marker.setIcon(vertexSymbol("white"));
  editPolyline.selectedVertexMarker = newVM;
  newVM.marker.setIcon(vertexSymbol("blue"));
}

export const updateSelectedVertexPL = (editPolyline: EditPolyline, latLng: google.maps.LatLng) => {
  editPolyline.selectedVertexMarker!.marker.setPosition(latLng);
  const path = editPolyline.ctxt.getPath();
  path.setAt(editPolyline.selectedVertexMarker!.index, latLng);
}

const handleVertexClickPL = (editPolyline: EditPolyline, vertexMarker: VertexMarker) => {
  // nothing to do if the vertex is already selected
  if (vertexMarker === editPolyline.selectedVertexMarker) { return; }

  // unselect the previously selected vertex, if applicable
  if (editPolyline.selectedVertexMarker !== null) {
    editPolyline.selectedVertexMarker.marker.setIcon(vertexSymbol("white"));
  }

  // select the new vertex
  editPolyline.selectedVertexMarker = vertexMarker;
  editPolyline.selectedVertexMarker.marker.setIcon(vertexSymbol("blue"));

  // ensure parent polyline is not clickable
  editPolyline.ctxt.setOptions({ clickable: false });
}

export const createEditPolyline = (polyline: google.maps.Polyline, setIsVertexMarkerDragging: (isDragging: boolean) => void, setDraggedVertexMarker: (marker: google.maps.Marker | null) => void) => {
  //const path = polygon.getPath();
  
  const editPolyline: EditPolyline = {
    ctxt: polyline,
    headVertexMarker: null,
    selectedVertexMarker: null,
  }
  
  const mapMarkers = createVertexMarkers(polyline, polyline.getMap()!);
  const vMarkers: VertexMarker[] = [];
  for (let i = 0; i < mapMarkers.length; i++) {
    const vMarker = {
      prev: null,
      next: null,
      marker: mapMarkers[i],
      ctxt: editPolyline,
      index: i,
    }
    vMarkers.push(vMarker);
    mapMarkers[i].set("app_id", crypto.randomUUID());
  }
  for (let i=0; i < vMarkers.length; i++) {
    vMarkers[i].prev = i==0 ? null : vMarkers[i-1];
    vMarkers[i].next = null;
  }

  editPolyline.headVertexMarker = vMarkers[0];
  
  for (let i = 0; i < vMarkers.length; i++) {
    if(i < vMarkers.length - 1) {
      vMarkers[i].next = vMarkers[i+1];
    }

    vMarkers[i].marker.addListener('click', () => {
      //console.log("[debug map] vertex marker clicked. map = ", editPolygon.vertexMarkers[i].marker.getMap());
      //console.log("[debug vertexMarkers] editPolygon.vertexMarkers = ", editPolygon.vertexMarkers);
      
      handleVertexClickPL(editPolyline, vMarkers[i]);

      setIsVertexMarkerDragging(true);
      setDraggedVertexMarker(vMarkers[i].marker);

    });
  }

  // sanity check: all vertex markers should be on the same map
  const map = vMarkers[0].marker.getMap();
  vMarkers.forEach(vm => {
    if (vm.marker.getMap() !== map) {
      console.error("Vertex marker is on a different map than the first one");
    }
  });

  return editPolyline;
}

export const totalAnnotations = (courseData: CourseData) => {
  return courseData.annotations.length + courseData.holes.reduce((acc, hole) => acc + hole.annotations.length, 0)
}

export const getSelectedInstances = (selectedMarkers: Set<string>, selectedPolygons: Set<string>, selectedPolylines: Set<string>, markerInstances: Map<string, google.maps.Marker>, polygonInstances: Map<string, google.maps.Polygon>, polylineInstances: Map<string, google.maps.Polyline>) => {
  return {
    markers: Array.from(markerInstances.values()).filter(marker => selectedMarkers.has(marker.get("app_id"))),
    polygons: Array.from(polygonInstances.values()).filter(polygon => selectedPolygons.has(polygon.get("app_id"))),
    polylines: Array.from(polylineInstances.values()).filter(polyline => selectedPolylines.has(polyline.get("app_id"))),
  }
}

export const shiftSelectedAnnotations = (deltaLat: number, deltaLng: number, selectedMarkers: Set<string>, selectedPolygons: Set<string>, selectedPolylines: Set<string>, markerInstances: Map<string, google.maps.Marker>, polygonInstances: Map<string, google.maps.Polygon>, polylineInstances: Map<string, google.maps.Polyline>) => {
  const selectedInstances = getSelectedInstances(selectedMarkers, selectedPolygons, selectedPolylines, markerInstances, polygonInstances, polylineInstances);
  selectedInstances.markers.forEach(marker => {
    try {
        const pos = marker.getPosition();
        if (pos) {
          marker.setPosition({
            lat: pos.lat() + deltaLat,
            lng: pos.lng() + deltaLng,
          })
        }
    } catch (error) {
      console.error(`Error shifting marker: ${error}`);
    }
  })
  selectedInstances.polygons.forEach(polygon => {
    try {
        polygon.getPaths().forEach(path => {
            for (let i=0; i<path.getLength(); i++) {
                const point = path.getAt(i);
                path.setAt(i, new google.maps.LatLng(point.lat() + deltaLat, point.lng() + deltaLng));
            }
        })
    } catch (error) {
        console.error(`Error shifting polygon: ${error}`);
    }
  })
  selectedInstances.polylines.forEach(polyline => {
    try {
        const path = polyline.getPath();
        for (let i=0; i<path.getLength(); i++) {
            const point = path.getAt(i);
            path.setAt(i, new google.maps.LatLng(point.lat() + deltaLat, point.lng() + deltaLng));
        }
    } catch (error) {
        console.error(`Error shifting polyline: ${error}`);
    }
  })
}

const vertexSymbol = (color: string) => {
    return {
        url: "data:image/svg+xml;utf8," +
        encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="7" height="7">
            <rect x="0" y="0" width="7" height="7" fill="${color}" stroke="black" stroke-width="1"/>
            </svg>
        `),
        scaledSize: { width: 7, height: 7 } as google.maps.Size,
        anchor: { x: 3.5, y: 3.5 } as google.maps.Point,
    }
}

export const createVertexMarkers = (geom: google.maps.Polygon | google.maps.Polyline, map: google.maps.Map, fillColor: string = "white"): google.maps.Marker[] => {
    const path = geom.getPath(); // MVCArray<LatLng>
    const markers: google.maps.Marker[] = [];
    console.log("creating vertex markers for polygon/polyline: ", geom.get("app_id"));

    let n = path.getLength();

    // if polygon,don't repeat a copy of the first vertex
    if(geom instanceof google.maps.Polygon) {
      if (isSamePoint(path.getAt(0), path.getAt(path.getLength()-1))) { n = n - 1; }
    }

    for (let i = 0; i < n; i++) {
            
      const marker = new google.maps.Marker({
          position: path.getAt(i),
          map: map, // Explicitly set the map
          clickable: geom instanceof google.maps.Polygon, // Must be true for click listener to work
          draggable: false, // Can be set to true later for vertex editing
          icon: vertexSymbol(fillColor),
          zIndex: 1000, // Ensure markers appear above polygons
        });

        markers.push(marker);
    }

    console.log(`Created ${markers.length} vertex markers`);
    return markers;
}