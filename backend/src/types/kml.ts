// Type definitions for parsed KML data

export interface LatLng {
  lat: number;
  lon: number;
}

export interface KMLAnnotation {
  name: string; // tee, teebox, cup, green, fairway, water, bunker, asphalt, ob, trees, drop, etc.
  type: 'Point' | 'LineString' | 'Polygon';
  coordinates: LatLng[];
}

export interface KMLHole {
  holeNumber: number;
  par: number;
  annotations: KMLAnnotation[];
}

export interface KMLCourse {
  name: string;
  leaderboardCode?: string;
  achievementCode?: string;
  holes: KMLHole[];
  globalAnnotations: KMLAnnotation[];
}

