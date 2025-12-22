import { CourseData } from '../types/map'

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