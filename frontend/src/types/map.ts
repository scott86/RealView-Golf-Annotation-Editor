// Types for map annotations and styles

export interface MarkerStyle {
  icon: google.maps.Icon | google.maps.Symbol;
  label?: string | google.maps.MarkerLabel;
  opacity?: number;
}

export interface PolygonStyle {
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWeight: number;
  zIndex?: number;
  clickable?: boolean;
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

// data structure for a single annotation as received from the backend
export interface Annotation {
  id: number;
  holeId: number;
  annotType: 'fairway' | 'fairway_hole' | 'green' | 'green_hole' | 'ob' | 'teebox' | 'bunker' | 'bunker_hole' | 'water' | 'water_hole' | 'asphalt' | 'drop' | 'trees' | 'tree' | 'tee' | 'cup'
  numCoords: number;
  rawCoords: number[];
  appId: string; // frontend decoration
}

// data structure for a single hole as received from the backend
export interface HoleData {
  id: number;
  holeNumber: number;
  par: number;
  courseId: number
  annotations: Annotation[];
}

// data structure for whole course as received from the backend
export interface CourseData {
  id: number;
  name: string;
  leaderboardCode?: string;
  achievementCode?: string;
  holes: HoleData[];
  annotations: Annotation[];
  ref_lat: number; // frontend decoration
}

// predefined styles for each annotation type
export interface AnnotationType {
  annotClass: typeof google.maps.Polygon | typeof google.maps.Polyline | typeof google.maps.Marker;
  style: PolygonStyle | PolylineStyle | MarkerStyle;
}
