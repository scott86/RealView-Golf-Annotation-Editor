// Map annotation style library
// Reusable styles for markers, polygons, and other map annotations

import type { MarkerStyle, PolygonStyle, PolylineStyle, CircleStyle, Annotation, AnnotationType } from '../types/map'

// ============================================================================
// MARKER STYLES
// ============================================================================


export const SELECTION_STYLING = {
  'ICONOPACITY': [0.3, 1.0],

  'FILLCOLOR': {
    'teebox': ['#FFFF00', '#FFFF00'],
    'fairway': ['#00AA00', '#00AA00'],
    'cutout': ['#000000', '#000000'],
    'green': ['#00FF00', '#00FF00'],
    'water': ['#0000FF', '#0000FF'],
    'asphalt': ['#808080', '#808080'],
    'bunker': ['#E0E0E0', '#E0E0E0'],
    'ob': ['#FF0000', '#FF0000'],
  },

  'FILLOPACITY': {
    'teebox': [0.05, 0.3],
    'fairway': [0.05, 0.3],
    'cutout': [0.05, 0.3],
    'green': [0.05, 0.3],
    'water': [0.05, 0.3],
    'asphalt': [0.05, 0.3],
    'bunker': [0.05, 0.3],
    'ob': [0.0, 0.0],
  },

  'STROKECOLOR': {
    'teebox': ['#222200', '#222200'],
    'fairway': ['#002200', '#002200'],
    'cutout': ['#000000', '#000000'],
    'green': ['#002200', '#002200'],
    'water': ['#000022', '#000022'],
    'asphalt': ['#202020', '#202020'],
    'bunker': ['#202020', '#202020'],
    'ob': ['#FF6666', '#FFFFFF'],
    'trees': ['#883000', '#883000'],
  },

  'STROKEOPACITY': {
    'teebox': [0.8, 1.0],
    'fairway': [0.8, 1.0],
    'cutout': [0.8, 1.0],
    'green': [0.8, 1.0],
    'water': [0.8, 1.0],
    'asphalt': [0.8, 1.0],
    'bunker': [0.8, 1.0],
    'ob': [0.8, 1.0],
    'trees': [0.8, 1.0],
  },

  'STROKEWEIGHT': {
    'teebox': [2, 4],
    'fairway': [2, 4],
    'cutout': [2, 4],
    'green': [2, 4],
    'water': [2, 4],
    'asphalt': [2, 4],
    'bunker': [2, 4],
    'ob': [2, 4],
    'trees': [2, 4],
  },
}


export const markerImgStyles: Record<string, google.maps.Icon> = {
  tee: {
    url: "/images/tee_icon.png",
    scaledSize: { width: 48, height: 48 } as google.maps.Size,
    anchor: { x: 24, y: 46 } as google.maps.Point,
  },

  cup: {
    url: "/images/cup_icon.png",
    scaledSize: { width: 48, height: 48 } as google.maps.Size,
    anchor: { x: 24, y: 45 } as google.maps.Point,
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
}

export const markerStyles: Record<string, MarkerStyle> = {
  tee: {
    icon: markerImgStyles.tee,
    label: { ...labelStyles.default, text: 'tee' },
    opacity: SELECTION_STYLING.ICONOPACITY[0],
  },
  cup: {
    icon: markerImgStyles.cup,
    label: { ...labelStyles.default, text: 'cup' },
    opacity: SELECTION_STYLING.ICONOPACITY[0],
  },
  drop: {
    icon: markerImgStyles.tee,
    label: { ...labelStyles.default, text: 'drop' },
    opacity: SELECTION_STYLING.ICONOPACITY[0],
  },
}

// ============================================================================
// POLYGON STYLES
// ============================================================================

export const polygonStyles: Record<string, PolygonStyle> = {
  
  fairway: {
    fillColor: SELECTION_STYLING.FILLCOLOR.fairway[0],
    fillOpacity: SELECTION_STYLING.FILLOPACITY.fairway[0],
    strokeColor: SELECTION_STYLING.STROKECOLOR.fairway[0],
    strokeOpacity: SELECTION_STYLING.STROKEOPACITY.fairway[0],
    strokeWeight: SELECTION_STYLING.STROKEWEIGHT.fairway[0],
  },

  cutout: {
    fillColor: SELECTION_STYLING.FILLCOLOR.cutout[0],
    fillOpacity: SELECTION_STYLING.FILLOPACITY.cutout[0],
    strokeColor: SELECTION_STYLING.STROKECOLOR.cutout[0],
    strokeOpacity: SELECTION_STYLING.STROKEOPACITY.cutout[0],
    strokeWeight: SELECTION_STYLING.STROKEWEIGHT.cutout[0],
  },

  green: {
    fillColor: SELECTION_STYLING.FILLCOLOR.green[0],
    fillOpacity: SELECTION_STYLING.FILLOPACITY.green[0],
    strokeColor: SELECTION_STYLING.STROKECOLOR.green[0],
    strokeOpacity: SELECTION_STYLING.STROKEOPACITY.green[0],
    strokeWeight: SELECTION_STYLING.STROKEWEIGHT.green[0],
  },

  water: {
    fillColor: SELECTION_STYLING.FILLCOLOR.water[0],
    fillOpacity: SELECTION_STYLING.FILLOPACITY.water[0],
    strokeColor: SELECTION_STYLING.STROKECOLOR.water[0],
    strokeOpacity: SELECTION_STYLING.STROKEOPACITY.water[0],
    strokeWeight: SELECTION_STYLING.STROKEWEIGHT.water[0],
  },

  asphalt: {
    fillColor: SELECTION_STYLING.FILLCOLOR.asphalt[0],
    fillOpacity: SELECTION_STYLING.FILLOPACITY.asphalt[0],
    strokeColor: SELECTION_STYLING.STROKECOLOR.asphalt[0],
    strokeOpacity: SELECTION_STYLING.STROKEOPACITY.asphalt[0],
    strokeWeight: SELECTION_STYLING.STROKEWEIGHT.asphalt[0],
  },

  bunker: {
    fillColor: SELECTION_STYLING.FILLCOLOR.bunker[0],
    fillOpacity: SELECTION_STYLING.FILLOPACITY.bunker[0],
    strokeColor: SELECTION_STYLING.STROKECOLOR.bunker[0],
    strokeOpacity: SELECTION_STYLING.STROKEOPACITY.bunker[0],
    strokeWeight: SELECTION_STYLING.STROKEWEIGHT.bunker[0],
  },

  teebox: {
    fillColor: SELECTION_STYLING.FILLCOLOR.teebox[0],
    fillOpacity: SELECTION_STYLING.FILLOPACITY.teebox[0],
    strokeColor: SELECTION_STYLING.STROKECOLOR.teebox[0],
    strokeOpacity: SELECTION_STYLING.STROKEOPACITY.teebox[0],
    strokeWeight: SELECTION_STYLING.STROKEWEIGHT.teebox[0],
  },

  ob: {
    fillColor: SELECTION_STYLING.FILLCOLOR.ob[0],
    fillOpacity: SELECTION_STYLING.FILLOPACITY.ob[0],
    strokeColor: SELECTION_STYLING.STROKECOLOR.ob[0],
    strokeOpacity: SELECTION_STYLING.STROKEOPACITY.ob[0],
    strokeWeight: SELECTION_STYLING.STROKEWEIGHT.ob[0],
  },

  default: {
    fillColor: '#FF0000',
    fillOpacity: 0.35,
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
  },

}

// ============================================================================
// POLYLINE (PATH) STYLES
// ============================================================================

export const polylineStyles: Record<string, PolylineStyle> = {
  
  trees: {
    strokeColor: SELECTION_STYLING.STROKECOLOR.trees[0],
    strokeOpacity: SELECTION_STYLING.STROKEOPACITY.trees[0],
    strokeWeight: SELECTION_STYLING.STROKEWEIGHT.trees[0],
  },

  default: {
    strokeColor: '#FF0000',
    strokeOpacity: 1,
    strokeWeight: 3,
  },
}

// Function to get annotation types - called after Google Maps loads
export function getAnnotationTypes(): Record<string, AnnotationType> {
  return {
    fairway: {
      annotClass: google.maps.Polygon,
      style: polygonStyles.fairway
    },
    fairway_hole: {
      annotClass: google.maps.Polygon,
      style: polygonStyles.cutout
    },
    green: {
      annotClass: google.maps.Polygon,
      style: polygonStyles.green
    },
    green_hole: {
      annotClass: google.maps.Polygon,
      style: polygonStyles.cutout
    },
    ob: {
      annotClass: google.maps.Polygon,
      style: polygonStyles.ob
    },
    teebox: {
      annotClass: google.maps.Polygon,
      style: polygonStyles.teebox
    },
    bunker: {
      annotClass: google.maps.Polygon,
      style: polygonStyles.bunker
    },
    bunker_hole: {
      annotClass: google.maps.Polygon,
      style: polygonStyles.cutout
    },
    water: {
      annotClass: google.maps.Polygon,
      style: polygonStyles.water
    },
    water_hole: {
      annotClass: google.maps.Polygon,
      style: polygonStyles.cutout
    },
    asphalt: {
      annotClass: google.maps.Polygon,
      style: polygonStyles.asphalt
    },
    drop: {
      annotClass: google.maps.Marker,
      style: markerStyles.drop
    },
    trees: {
      annotClass: google.maps.Polyline,
      style: polylineStyles.trees
    },
    tee: {
      annotClass: google.maps.Marker,
      style: markerStyles.tee
    },
    cup: {
      annotClass: google.maps.Marker,
      style: markerStyles.cup
    },
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function _buildGeo(rawGeo: number[], annotClass: typeof google.maps.Polygon | typeof google.maps.Polyline | typeof google.maps.Marker) {
  if(annotClass === google.maps.Polygon) {
    let latLngs = [];
    for(let i = 0; i < rawGeo.length; i += 2) {
      latLngs.push(new google.maps.LatLng(rawGeo[i+1], rawGeo[i]))
    }
    return { paths: [latLngs] }
  }
  else if(annotClass === google.maps.Polyline) {
    let latLngs = [];
    for(let i = 0; i < rawGeo.length; i += 2) {
      latLngs.push(new google.maps.LatLng(rawGeo[i+1], rawGeo[i]))
    }
    return { path: latLngs }
  }
  else if(annotClass === google.maps.Marker) {
    return { position: new google.maps.LatLng(rawGeo[1], rawGeo[0]) }
  }
  return { paths: [] }
}

export function buildAppId(annotRecord: Annotation, isGlobal: boolean): string {
  let googleType = "UnknownType";
  switch(getAnnotationTypes()[annotRecord.annotType].annotClass) {
    case google.maps.Polygon:
      googleType = "Polygon";
      break;
    case google.maps.Polyline:
      googleType = "Polyline";
      break;
    case google.maps.Marker:
      googleType = "Marker";
      break;
  }
  let appId = annotRecord.id.toString() + '-' + googleType;
  if(isGlobal) {
    appId = "g" + appId; // this some hacky shit
  }
  return appId;
}

export function createAnnotation(annotRecord: Annotation, map: google.maps.Map, isGlobal: boolean): google.maps.Polygon | google.maps.Polyline | google.maps.Marker {
  const annotType = getAnnotationTypes()[annotRecord.annotType]
  let annotInstance = new annotType.annotClass({
    paths: [annotRecord.rawCoords],
    map: map,
    ..._buildGeo(annotRecord.rawCoords, annotType.annotClass),
    ...annotType.style
  })
  // build application-level id that encodes database id and google type (Marker/Polygon/Polyline)
  annotInstance.set("app_id", buildAppId(annotRecord, isGlobal))
  annotInstance.set("annot_type", annotRecord.annotType)
  return annotInstance
}

export function setSelectionStyles(annotInstance: google.maps.Polygon | google.maps.Polyline | google.maps.Marker, isSelected: boolean) {
  let annotType = annotInstance.get("annot_type") as string;
  if(annotType.endsWith("_hole")) {
    annotType = "cutout";
  }
  const idx = isSelected ? 1 : 0;
  if(annotInstance instanceof google.maps.Marker) {
    annotInstance.setOpacity(SELECTION_STYLING.ICONOPACITY[idx]);
  }
  else if(annotInstance instanceof google.maps.Polygon) {
    // Type guard: ensure annotType is a valid key
    const validTypes = ['teebox', 'fairway', 'cutout', 'green', 'water', 'asphalt', 'bunker', 'ob'] as const;
    type ValidType = typeof validTypes[number];
    
    const typedAnnotType = (validTypes.includes(annotType as ValidType) ? annotType : 'fairway') as ValidType;
    
    annotInstance.setOptions({
      fillColor: SELECTION_STYLING.FILLCOLOR[typedAnnotType][idx],
      fillOpacity: SELECTION_STYLING.FILLOPACITY[typedAnnotType][idx],
      strokeColor: SELECTION_STYLING.STROKECOLOR[typedAnnotType][idx],
      strokeOpacity: SELECTION_STYLING.STROKEOPACITY[typedAnnotType][idx],
      strokeWeight: SELECTION_STYLING.STROKEWEIGHT[typedAnnotType][idx],
    })
  }
  else if(annotInstance instanceof google.maps.Polyline) {
    const validTypes = ['trees'] as const;
    type ValidType = typeof validTypes[number];    
    const typedAnnotType = (validTypes.includes(annotType as ValidType) ? annotType : 'default') as ValidType;
    
    annotInstance.setOptions({
      strokeColor: SELECTION_STYLING.STROKECOLOR[typedAnnotType][idx],
      strokeOpacity: SELECTION_STYLING.STROKEOPACITY[typedAnnotType][idx],
      strokeWeight: SELECTION_STYLING.STROKEWEIGHT[typedAnnotType][idx],
    })
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

