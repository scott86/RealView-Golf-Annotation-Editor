import { CourseData } from '../types/map'

export interface VertexMarker {
  prev: VertexMarker | null;
  next: VertexMarker | null;
  marker: google.maps.Marker;
  ctxt: EditPolygon | null;
  index: number;
}

export interface EditPolygon {
  ctxt: google.maps.Polygon;
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

export const createVertexMarkers = (polygon: google.maps.Polygon, map: google.maps.Map): google.maps.Marker[] => {
    const path = polygon.getPath(); // MVCArray<LatLng>
    const markers: google.maps.Marker[] = [];
    console.log("creating vertex markers for polygon: ", polygon.get("app_id"));

    // don't repeat a copy of the first vertex
    let n = path.getLength();
    if (isSamePoint(path.getAt(0), path.getAt(path.getLength()-1))) { n = n - 1; }

    for (let i = 0; i < n; i++) {
      //console.log("vertex: ", path.getAt(i).lat(), path.getAt(i).lng(), " index: ", i);
            
      const marker = new google.maps.Marker({
          position: path.getAt(i),
          map: map, // Explicitly set the map
          clickable: true, // Must be true for click listener to work
          draggable: false, // Can be set to true later for vertex editing
          icon: vertexSymbol("white"),
          zIndex: 1000, // Ensure markers appear above polygons
        });

        /*
        marker.addListener('click', () => {
            console.log(`Vertex marker ${i} clicked`);
            marker.setIcon(vertexSymbol("blue"));
            //setIsVertexMarkerDragging(true);
            //setDraggedVertexMarker(marker);
        });
        */

        markers.push(marker);
    }

    console.log(`Created ${markers.length} vertex markers`);
    return markers;
}