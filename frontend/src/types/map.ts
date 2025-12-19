// Types for map annotations and styles

export interface MarkerStyle {
  icon: google.maps.Icon | google.maps.Symbol;
  label?: string | google.maps.MarkerLabel;
}

export interface PolygonStyle {
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWeight: number;
}

export interface PolylineStyle {
  strokeColor: string;
  strokeOpacity: number;
  strokeWeight: number;
}

export interface CircleStyle {
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWeight: number;
}

export interface LabelStyle {
  text: string;
  color: string;
  fontSize: string;
  fontWeight: string;
  fontFamily?: string;
}

// data structure as received from the backend
export interface Annotation {
  id: number;
  holeId: number;
  annotType: 'fairway' | 'fairway_hole' | 'green' | 'green_hole' | 'ob' | 'teebox' | 'bunker' | 'bunker_hole' | 'water' | 'water_hole' | 'asphalt' | 'drop' | 'trees' | 'tee' | 'cup'
  numCoords: number;
  rawCoords: number[];
}

// predefined styles for each annotation type
export interface AnnotationType {
  annotClass: typeof google.maps.Polygon | typeof google.maps.Polyline | typeof google.maps.marker.AdvancedMarkerElement;
  style: PolygonStyle | PolylineStyle | MarkerStyle;
}
