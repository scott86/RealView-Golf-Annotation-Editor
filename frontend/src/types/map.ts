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

export interface Annotation {
  id: string;
  position: google.maps.LatLngLiteral;
  name: string;
  type: 'marker' | 'polygon' | 'polyline' | 'circle';
  style?: string; // Reference to a style name
}

