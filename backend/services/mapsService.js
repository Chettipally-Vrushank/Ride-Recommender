import fetch from "node-fetch";

// 1️⃣ Convert address to coordinates
export async function getCoordinates(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const fullAddress = `${address}, India`;  // append country
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

  console.log("🌐 Geocoding URL:", url);

  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log("📄 Geocoding response:", data); // debug

    if (data.status === "OK" && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }

    console.error("❌ Geocoding returned empty results for:", address);
    return null;
  } catch (error) {
    console.error("❌ Error fetching coordinates:", error);
    return null;
  }
}


// 2️⃣ Get distance and duration using Routes API
export async function getDistanceAndDuration(originCoords, destCoords) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const routesUrl = `https://routes.googleapis.com/directions/v2:computeRoutes`;

  const body = {
    origin: { location: { latLng: { latitude: originCoords.lat, longitude: originCoords.lng } } },
    destination: { location: { latLng: { latitude: destCoords.lat, longitude: destCoords.lng } } },
    travelMode: "DRIVE"
  };

  // Try Routes API first (preferred)
  try {
    const res = await fetch(`${routesUrl}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration"
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    console.log("📄 Routes API response:", data);

    if (data && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKm = route.distanceMeters / 1000;
      // route.duration may be a number (seconds) or string; normalize
      const durationSec = typeof route.duration === 'number' ? route.duration : parseInt(String(route.duration).replace(/[^0-9]/g, ''), 10);
      const durationMin = durationSec / 60;
      return { distanceKm, durationMin };
    }

    console.warn("⚠️ Routes API returned no routes or error; falling back to Distance Matrix.", data?.error || data);
  } catch (err) {
    console.warn("⚠️ Routes API request failed; falling back to Distance Matrix.", err && err.message ? err.message : err);
  }

  // Fallback to Distance Matrix API
  try {
    const dmUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originCoords.lat},${originCoords.lng}&destinations=${destCoords.lat},${destCoords.lng}&key=${apiKey}&units=metric`;
    console.log("🔗 Distance Matrix URL:", dmUrl);
    const dmRes = await fetch(dmUrl);
    const dmData = await dmRes.json();
    console.log("📄 Distance Matrix response:", dmData);

    if (
      dmData &&
      dmData.rows &&
      dmData.rows[0] &&
      dmData.rows[0].elements &&
      dmData.rows[0].elements[0].status === "OK"
    ) {
      const distanceKm = dmData.rows[0].elements[0].distance.value / 1000;
      const durationMin = dmData.rows[0].elements[0].duration.value / 60;
      return { distanceKm, durationMin };
    }

    console.error("❌ Distance Matrix returned no routes or error", dmData);
    return null;
  } catch (err) {
    console.error("❌ Distance Matrix request failed", err);
    return null;
  }
}



// Convenience wrapper used by ride estimate services
export async function getDistance(pickup, drop) {
  const origin = await getCoordinates(pickup);
  const destination = await getCoordinates(drop);
  if (!origin || !destination) return null;
  return await getDistanceAndDuration(origin, destination);
}

// Places Autocomplete (server-side proxy)
export async function placesAutocomplete(input, options = {}) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const params = new URLSearchParams({ input: String(input), key: apiKey });
  // If caller provided types or country, include them
  if (options.types) params.set('types', options.types);
  if (options.country) params.set('components', `country:${options.country}`);

  // Do not set types=geocode by default so landmarks and establishments are included
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === 'OK' && Array.isArray(data.predictions)) {
    return data.predictions.map(p => ({ description: p.description, place_id: p.place_id }));
  }
  console.warn('Places autocomplete failed or returned no predictions', data);
  return [];
}

// Place Details: return formatted_address and lat/lng for a place_id
export async function placeDetails(placeId) {
  if (!placeId) return null;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const params = new URLSearchParams({ place_id: String(placeId), key: apiKey, fields: 'formatted_address,geometry' });
  const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.result) {
      const formatted_address = data.result.formatted_address;
      const loc = data.result.geometry?.location;
      return { formatted_address, lat: loc?.lat ?? null, lng: loc?.lng ?? null };
    }
    console.warn('Place details failed', data);
    return null;
  } catch (err) {
    console.error('Place details request failed', err);
    return null;
  }
}
