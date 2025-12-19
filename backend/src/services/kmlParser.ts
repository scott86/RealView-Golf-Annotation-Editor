import { XMLParser } from 'fast-xml-parser';
import { KMLCourse, KMLHole, KMLAnnotation, LatLng } from '../types/kml.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,
  trimValues: true,
  isArray: (tagName) => {
    // Ensure these tags are always arrays
    return ['Folder', 'Placemark', 'Data'].includes(tagName);
  }
});

function parseCoordinates(coordString: string): LatLng[] {
  if (!coordString || coordString.trim() === '') {
    return [];
  }
  
  const points = coordString.trim().split(/\s+/);
  return points.map(point => {
    const [lon, lat] = point.split(',');
    return {
      lat: parseFloat(lat),
      lon: parseFloat(lon)
    };
  });
}

function parseAnnotation(placemark: any): KMLAnnotation | null {
  const name = placemark.name?.toLowerCase();
  if (!name) return null;

  let type: 'Point' | 'LineString' | 'Polygon';
  let coordinates: LatLng[] = [];

  // Determine geometry type and extract coordinates
  if (placemark.Point) {
    type = 'Point';
    const coordString = placemark.Point.coordinates;
    coordinates = parseCoordinates(coordString);
  } else if (placemark.LineString) {
    type = 'LineString';
    const coordString = placemark.LineString.coordinates;
    coordinates = parseCoordinates(coordString);
  } else if (placemark.Polygon) {
    type = 'Polygon';
    const outerBoundary = placemark.Polygon.outerBoundaryIs?.LinearRing?.coordinates;
    if (outerBoundary) {
      coordinates = parseCoordinates(outerBoundary);
    }
  } else {
    return null; // Unknown geometry type
  }

  return {
    name,
    type,
    coordinates
  };
}

function parseHole(folder: any): KMLHole | null {
  try {
    const holeNumber = parseInt(folder.name);
    if (isNaN(holeNumber)) return null;

    // Parse par from description (e.g., "par 4")
    const description = folder.description || '';
    const parMatch = description.match(/par\s+(\d+)/i);
    const par = parMatch ? parseInt(parMatch[1]) : 3;

    const annotations: KMLAnnotation[] = [];
    const placemarks = Array.isArray(folder.Placemark) ? folder.Placemark : [folder.Placemark].filter(Boolean);

    for (const placemark of placemarks) {
      const annotation = parseAnnotation(placemark);
      if (annotation) {
        annotations.push(annotation);
      }
    }

    return {
      holeNumber,
      par,
      annotations
    };
  } catch (error) {
    console.error('Error parsing hole:', error);
    return null;
  }
}

function parseExtendedData(extendedData: any): { leaderboardCode?: string; achievementCode?: string } {
  const result: { leaderboardCode?: string; achievementCode?: string } = {};
  
  if (!extendedData || !extendedData.Data) return result;

  const dataItems = Array.isArray(extendedData.Data) ? extendedData.Data : [extendedData.Data];
  
  for (const item of dataItems) {
    const name = item['@_name'];
    const value = item.value;
    
    if (name === 'leaderboard') {
      result.leaderboardCode = value;
    } else if (name === 'achievement') {
      result.achievementCode = value;
    }
  }
  
  return result;
}

export function parseKML(kmlContent: string): KMLCourse {
  const parsed = parser.parse(kmlContent);
  
  // Navigate to the main course folder
  const doc = parsed.kml?.Document;
  if (!doc) {
    throw new Error('Invalid KML: No Document element found');
  }

  // Find the main folder (should be an array)
  const folders = Array.isArray(doc.Folder) ? doc.Folder : [doc.Folder].filter(Boolean);
  const mainFolder = folders[0];
  
  if (!mainFolder) {
    throw new Error('Invalid KML: No main Folder found');
  }

  const courseName = mainFolder.name;
  if (!courseName) {
    throw new Error('Invalid KML: Course name not found');
  }

  // Parse extended data for leaderboard and achievement codes
  const extendedData = parseExtendedData(mainFolder.ExtendedData);

  const holes: KMLHole[] = [];
  let globalFolder: any = null;

  // Find hole folders and global folder
  const subFolders = Array.isArray(mainFolder.Folder) ? mainFolder.Folder : [mainFolder.Folder].filter(Boolean);
  
  for (const folder of subFolders) {
    if (!folder || !folder.name) continue;
    
    // Check if it's a hole folder (numeric name)
    if (/^\d+$/.test(folder.name)) {
      const hole = parseHole(folder);
      if (hole) {
        holes.push(hole);
      }
    } else if (folder.name.toLowerCase() === 'global') {
      globalFolder = folder;
    }
  }

  // Sort holes by hole number
  holes.sort((a, b) => a.holeNumber - b.holeNumber);

  // Parse global annotations
  const globalAnnotations: KMLAnnotation[] = [];
  if (globalFolder && globalFolder.Placemark) {
    const placemarks = Array.isArray(globalFolder.Placemark) 
      ? globalFolder.Placemark 
      : [globalFolder.Placemark].filter(Boolean);
    
    for (const placemark of placemarks) {
      const annotation = parseAnnotation(placemark);
      if (annotation) {
        globalAnnotations.push(annotation);
      }
    }
  }

  return {
    name: courseName,
    leaderboardCode: extendedData.leaderboardCode,
    achievementCode: extendedData.achievementCode,
    holes,
    globalAnnotations
  };
}

