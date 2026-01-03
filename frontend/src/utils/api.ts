// Centralized API configuration and utilities

import { Annotation, HoleData } from '../types/map';
import { buildAppId } from '../config/mapStyles';

// Base URL - uses Vite proxy in development (/api -> http://localhost:5000/api)
// In production, this can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = {
  // Course endpoints
  getCourses: async () => {
    const response = await fetch(`${API_BASE_URL}/courses-list`);
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    return response.json();
  },

  getCourse: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch course');
    }
    let data = await response.json();
    let set_ref_lat = false;
    let masterTreeIdx: number = -1;
    let treeAnnots: Annotation[] = [];
    data.annotations.forEach((annot: Annotation, curIdx: number) => {

      // special case: "trees" annotation needs to decompose into individual tree markers
      if (annot.annotType === "trees") {
        masterTreeIdx = curIdx;
        for (let i = 0; i < annot.rawCoords.length; i += 2) {
          treeAnnots.push({
            ...annot,
            annotType: "tree",
            numCoords: 1,
            rawCoords: [annot.rawCoords[i], annot.rawCoords[i+1]],
          });
        }
      }

      annot.appId = buildAppId(annot, true); // apply frontend decoration
      if (!set_ref_lat) {
        data.ref_lat = annot.rawCoords[1]; // apply frontend decoration
        set_ref_lat = true;
      }
    })

    // if there was a "trees" annotation, remove it and add the individual tree annotations
    if (masterTreeIdx !== -1) {
      data.annotations.splice(masterTreeIdx, 1);
      treeAnnots.forEach((treeAnnot: Annotation, curIdx: number) => {
        treeAnnot.appId = buildAppId(treeAnnot, true)+"-"+(curIdx*2).toString();
        data.annotations.push(treeAnnot);
      })
    }

    // hole-level "trees" annotations are not supported. only global-level trees are supported.
    data.holes.forEach((hole: HoleData) => {
      // remove any "trees" annotations from the hole
      hole.annotations = hole.annotations.filter((annot: Annotation) => annot.annotType !== "trees");
    })

    data.holes.forEach((hole: HoleData) => {
      hole.annotations.forEach((annot: Annotation) => {
        annot.appId = buildAppId(annot, false); // apply frontend decoration
        if (!set_ref_lat) {
          data.ref_lat = annot.rawCoords[1]; // apply frontend decoration
          set_ref_lat = true;
        }
      })
    })
    console.log("course data received. reference latitude: ", data.ref_lat);
    return data;
  },

  // Health check
  checkHealth: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  },

  // Import KML
  importKML: async (file: File) => {
    const formData = new FormData();
    formData.append('kml', file);
    
    const response = await fetch(`${API_BASE_URL}/import-kml`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to import KML');
    }
    return response.json();
  }
};

