// backend/services/uberSandboxService.js
import axios from "axios";
import { getCoordinates } from "./mapsService.js";

// Sandbox endpoints
const TOKEN_URL = "https://sandbox-login.uber.com/oauth/v2/token";
const SANDBOX_ESTIMATE_URL = "https://sandbox-api.uber.com/v1.2/estimates/price";

let cachedToken = null;
let tokenExpiry = 0;

/**
 * get cached token or fetch a new one from Uber sandbox login
 * trims env vars to avoid accidental whitespace mismatches
 */
async function getUberToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const clientId = process.env.UBER_CLIENT_ID?.trim();
  const clientSecret = process.env.UBER_CLIENT_SECRET?.trim();
  const scope = (process.env.UBER_SCOPE || "3p.signals.eta").trim();

  const params = new URLSearchParams();
  params.append("client_id", clientId || "");
  params.append("client_secret", clientSecret || "");
  params.append("grant_type", "client_credentials");
  params.append("scope", scope);

  try {
    const res = await axios.post(TOKEN_URL, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    cachedToken = res.data.access_token;
    tokenExpiry = now + (res.data.expires_in || 3600) * 1000 - 60 * 1000; // expire a minute early
    console.log("Uber sandbox token fetched; expires_in=", res.data.expires_in);
    return cachedToken;
  } catch (err) {
    console.error("Uber token request failed. status:", err.response?.status);
    console.error("Uber token response body:", err.response?.data);
    throw new Error(`Uber token request failed: ${err.response?.status} - ${JSON.stringify(err.response?.data)}`);
  }
}

/**
 * pickup/drop are address strings — geocode then call Uber sandbox estimates
 * returns Uber sandbox response object (contains `prices` array)
 */
export async function getUberEstimateFromAddresses(pickup, drop) {
  const origin = await getCoordinates(pickup);
  const destination = await getCoordinates(drop);
  if (!origin || !destination) throw new Error("Geocoding failed for pickup/drop");

  let token;
  try {
    token = await getUberToken();
  } catch (e) {
    throw new Error(`Failed to obtain Uber token: ${e.message}`);
  }

  try {
    const resp = await axios.get(SANDBOX_ESTIMATE_URL, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        start_latitude: origin.lat,
        start_longitude: origin.lng,
        end_latitude: destination.lat,
        end_longitude: destination.lng,
      },
    });

    return resp.data; // { prices: [...] }
  } catch (err) {
    console.error("Uber estimate request failed. status:", err.response?.status);
    console.error("Uber estimate response body:", err.response?.data);
    throw new Error(`Failed to fetch Uber estimate: ${err.response?.status} - ${JSON.stringify(err.response?.data)}`);
  }
}
// getUberEstimate: takes origin/destination coordinates and returns Uber price estimates
export async function getUberEstimate(origin, destination) {
  let token;
  try {
    token = await getUberToken();
  } catch (e) {
    throw new Error(`Failed to obtain Uber token: ${e.message}`);
  }

  try {
    const resp = await axios.get(SANDBOX_ESTIMATE_URL, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        start_latitude: origin.lat,
        start_longitude: origin.lng,
        end_latitude: destination.lat,
        end_longitude: destination.lng,
      },
    });

    // Map the Uber API response to a simplified array
    if (resp.data && Array.isArray(resp.data.prices)) {
      return resp.data.prices.map(price => ({
        service: price.display_name,
        estimate: price.estimate,
        duration_min: price.duration ? Math.round(price.duration / 60) : undefined,
      }));
    }
    return [];
  } catch (err) {
    console.error("Uber estimate request failed. status:", err.response?.status);
    console.error("Uber estimate response body:", err.response?.data);
    throw new Error(`Failed to fetch Uber estimate: ${err.response?.status} - ${JSON.stringify(err.response?.data)}`);
  }
}
// ...existing code...
