// Map annotation style library
// Reusable styles for markers, polygons, and other map annotations

import type { MarkerStyle, PolygonStyle, PolylineStyle, CircleStyle } from '../types/map'

// ============================================================================
// MARKER STYLES
// ============================================================================

// Using numeric path values instead of google.maps.SymbolPath to avoid loading issues
// 0 = CIRCLE, 1 = FORWARD_CLOSED_ARROW, 2 = FORWARD_OPEN_ARROW, 3 = BACKWARD_CLOSED_ARROW, 4 = BACKWARD_OPEN_ARROW
const CIRCLE_PATH = 0

export const markerStyles: Record<string, google.maps.Symbol> = {
  // Default red circle marker
  default: {
    path: CIRCLE_PATH,
    scale: 10,
    fillColor: '#FF0000',
    fillOpacity: 0.8,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
  },

  // Large cyan circle (your current style)
  highlighted: {
    path: CIRCLE_PATH,
    scale: 14,
    fillColor: 'red',
    fillOpacity: 0.5,
    strokeColor: 'cyan',
    strokeWeight: 4,
  },

  // Selected state marker
  selected: {
    path: CIRCLE_PATH,
    scale: 16,
    fillColor: '#FFD700',  // Gold
    fillOpacity: 0.9,
    strokeColor: '#FFFFFF',
    strokeWeight: 4,
  },

  // Unselected state marker
  unselected: {
    path: CIRCLE_PATH,
    scale: 12,
    fillColor: '#808080',  // Gray
    fillOpacity: 0.6,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
  },

  // Small blue marker
  small: {
    path: CIRCLE_PATH,
    scale: 6,
    fillColor: '#0000FF',
    fillOpacity: 0.8,
    strokeColor: '#FFFFFF',
    strokeWeight: 1,
  },

  // Yellow warning marker
  warning: {
    path: CIRCLE_PATH,
    scale: 12,
    fillColor: '#FFFF00',
    fillOpacity: 0.9,
    strokeColor: '#FF0000',
    strokeWeight: 3,
  },

  // Green success marker
  success: {
    path: CIRCLE_PATH,
    scale: 10,
    fillColor: '#00FF00',
    fillOpacity: 0.8,
    strokeColor: '#006600',
    strokeWeight: 2,
  },

  // Square marker
  square: {
    path: 'M -5,-5 L 5,-5 L 5,5 L -5,5 Z',
    fillColor: '#FF00FF',
    fillOpacity: 0.8,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: 1,
  },

  // Triangle marker
  triangle: {
    path: 'M 0,-10 L 8.66,5 L -8.66,5 Z',
    fillColor: '#FFA500',
    fillOpacity: 0.8,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: 1,
  },

  // Star marker
  star: {
    path: 'M 0,-10 L 2.5,-3 L 10,-3 L 4,2 L 6,9 L 0,4 L -6,9 L -4,2 L -10,-3 L -2.5,-3 Z',
    fillColor: '#FFD700',
    fillOpacity: 1,
    strokeColor: '#FF8C00',
    strokeWeight: 1,
    scale: 1,
  },
}

// ============================================================================
// LABEL STYLES
// ============================================================================

export const labelStyles: Record<string, google.maps.MarkerLabel> = {
  default: {
    text: '',
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: 'normal',
  },

  bold: {
    text: '',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 'bold',
  },

  large: {
    text: '',
    color: '#FFFF00',
    fontSize: '16px',
    fontWeight: 'bold',
  },

  small: {
    text: '',
    color: '#FFFFFF',
    fontSize: '10px',
    fontWeight: 'normal',
  },

  cyan: {
    text: '',
    color: '#00FFFF',
    fontSize: '14px',
    fontWeight: 'bold',
  },

  yellow: {
    text: '',
    color: '#FFFF00',
    fontSize: '14px',
    fontWeight: 'bold',
  },

  red: {
    text: '',
    color: '#FF0000',
    fontSize: '14px',
    fontWeight: 'bold',
  },
}

// ============================================================================
// POLYGON STYLES
// ============================================================================

export const polygonStyles: Record<string, PolygonStyle> = {
  default: {
    fillColor: '#FF0000',
    fillOpacity: 0.35,
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
  },

  zone: {
    fillColor: '#0000FF',
    fillOpacity: 0.2,
    strokeColor: '#0000FF',
    strokeOpacity: 0.6,
    strokeWeight: 2,
  },

  restricted: {
    fillColor: '#FF0000',
    fillOpacity: 0.3,
    strokeColor: '#FF0000',
    strokeOpacity: 1,
    strokeWeight: 3,
  },

  boundary: {
    fillColor: '#00FF00',
    fillOpacity: 0.1,
    strokeColor: '#00FF00',
    strokeOpacity: 0.8,
    strokeWeight: 2,
  },

  highlight: {
    fillColor: '#FFFF00',
    fillOpacity: 0.4,
    strokeColor: '#FFFF00',
    strokeOpacity: 0.9,
    strokeWeight: 3,
  },
}

// ============================================================================
// POLYLINE (PATH) STYLES
// ============================================================================

export const polylineStyles: Record<string, PolylineStyle> = {
  default: {
    strokeColor: '#FF0000',
    strokeOpacity: 1,
    strokeWeight: 3,
  },

  route: {
    strokeColor: '#0000FF',
    strokeOpacity: 0.8,
    strokeWeight: 4,
  },

  boundary: {
    strokeColor: '#FFFF00',
    strokeOpacity: 0.9,
    strokeWeight: 2,
  },

  dashed: {
    strokeColor: '#00FF00',
    strokeOpacity: 0.7,
    strokeWeight: 2,
  },

  thick: {
    strokeColor: '#FF00FF',
    strokeOpacity: 0.9,
    strokeWeight: 6,
  },
}

// ============================================================================
// CIRCLE STYLES
// ============================================================================

export const circleStyles: Record<string, CircleStyle> = {
  default: {
    fillColor: '#0000FF',
    fillOpacity: 0.2,
    strokeColor: '#0000FF',
    strokeWeight: 2,
  },

  range: {
    fillColor: '#00FF00',
    fillOpacity: 0.15,
    strokeColor: '#00FF00',
    strokeWeight: 1,
  },

  coverage: {
    fillColor: '#FF0000',
    fillOpacity: 0.1,
    strokeColor: '#FF0000',
    strokeWeight: 1,
  },
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a marker style with a custom label
 */
export function getMarkerWithLabel(
  styleKey: keyof typeof markerStyles,
  labelText: string,
  labelStyleKey: keyof typeof labelStyles = 'default'
): { icon: google.maps.Symbol; label: google.maps.MarkerLabel } {
  const label = { ...labelStyles[labelStyleKey], text: labelText }
  return {
    icon: markerStyles[styleKey],
    label,
  }
}

/**
 * Create a custom marker style
 */
export function createMarkerStyle(
  fillColor: string,
  strokeColor: string,
  scale: number = 10,
  fillOpacity: number = 0.8,
  strokeWeight: number = 2
): google.maps.Symbol {
  return {
    path: CIRCLE_PATH,
    scale,
    fillColor,
    fillOpacity,
    strokeColor,
    strokeWeight,
  }
}

/**
 * Create a custom label style
 */
export function createLabelStyle(
  text: string,
  color: string = '#FFFFFF',
  fontSize: string = '14px',
  fontWeight: string = 'normal'
): google.maps.MarkerLabel {
  return {
    text,
    color,
    fontSize,
    fontWeight,
  }
}

