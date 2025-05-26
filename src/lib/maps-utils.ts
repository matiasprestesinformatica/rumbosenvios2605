
"use client"; // This file will contain client-side helpers

// Mar del Plata, Argentina approximate bounding box
// Generated using https://boundingbox.klokantech.com/ (adjust as needed)
export const MAR_DEL_PLATA_BOUNDS = {
  south: -38.1564, // Min Latitude
  west: -57.7069,  // Min Longitude
  north: -37.9000, // Max Latitude
  east: -57.4500,  // Max Longitude
};

/**
 * Checks if given coordinates are within the Mar del Plata bounding box.
 */
export function isWithinMarDelPlata(lat: number, lng: number): boolean {
  return (
    lat >= MAR_DEL_PLATA_BOUNDS.south &&
    lat <= MAR_DEL_PLATA_BOUNDS.north &&
    lng >= MAR_DEL_PLATA_BOUNDS.west &&
    lng <= MAR_DEL_PLATA_BOUNDS.east
  );
}

interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

/**
 * Geocodes an address string using Google Geocoding API (client-side).
 * IMPORTANT: Requires the Google Maps JavaScript API to be loaded OR use direct fetch.
 * This implementation uses fetch to avoid needing the Maps JS SDK directly for just geocoding.
 */
export async function geocodeAddressClientSide(
  address: string,
  apiKey: string
): Promise<GeocodeResult | null> {
  if (!apiKey) {
    console.error("Google Maps API Key is not configured.");
    // Optionally throw an error or return a specific error object
    throw new Error("API Key para geocodificación no configurada.");
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&region=AR&language=es`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location; // { lat, lng }
      const formattedAddress = data.results[0].formatted_address;
      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: formattedAddress,
      };
    } else {
      console.warn("Geocoding failed or no results:", data.status, data.error_message);
      let userMessage = "No se pudo geocodificar la dirección.";
      if (data.status === "ZERO_RESULTS") {
        userMessage = "No se encontraron resultados para la dirección proporcionada.";
      } else if (data.status === "REQUEST_DENIED") {
        userMessage = "Solicitud de geocodificación denegada. Verifica la API Key y sus permisos.";
      } else if (data.error_message) {
        userMessage = `Error de geocodificación: ${data.error_message}`;
      }
      throw new Error(userMessage);
    }
  } catch (error) {
    console.error("Error calling Geocoding API:", error);
    throw new Error( (error as Error).message || "Error de red al intentar geocodificar.");
  }
}
