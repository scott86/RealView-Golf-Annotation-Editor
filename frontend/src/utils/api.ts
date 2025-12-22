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
    data.annotations.forEach((annot: Annotation) => {
      annot.appId = buildAppId(annot, true); // apply frontend decoration
      if (!set_ref_lat) {
        data.ref_lat = annot.rawCoords[1]; // apply frontend decoration
        set_ref_lat = true;
      }
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

