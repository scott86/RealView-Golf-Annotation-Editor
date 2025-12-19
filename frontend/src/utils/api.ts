// Centralized API configuration and utilities

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
    return response.json();
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

