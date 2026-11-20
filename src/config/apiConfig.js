/**
 * Centralized API Configuration for ExoBook ERP
 * 
 * Configures the base URL for FastAPI backend in ONE single place.
 * Can be overridden by Vite environment variable (VITE_API_BASE_URL).
 */

export const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || 'http://148.230.66.145:8001';

export const API_TIMEOUT = 15000;

