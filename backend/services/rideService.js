import { getCoordinates, getDistanceAndDuration } from "./mapsService.js";
import { getUberEstimateFromAddresses } from "../services/uberService.js";
import { getUberEstimate } from './uberService.js';

export async function getRides(pickup, drop) {
  try {
    console.log("📍 Pickup:", pickup, "Drop:", drop);

    const origin = await getCoordinates(pickup);
    const destination = await getCoordinates(drop);
    console.log("📌 Origin coords:", origin, "Destination coords:", destination);

    if (!origin || !destination) return { rides: [], recommended: { message: "Invalid addresses" } };

    const distanceInfo = await getDistanceAndDuration(origin, destination);
    console.log("📏 Distance info:", distanceInfo);

    if (!distanceInfo) return { rides: [], recommended: { message: "No routes found" } };

    const { distanceKm, durationMin } = distanceInfo;

    // Predict Uber price using a formula (no API call)
    const uberRide = {
      service: "Uber",
      price: Math.round(35 + distanceKm * 9 + durationMin * 2),
      eta: Math.round(durationMin)
    };

    const olaRide = {
      service: "Ola",
      price: Math.round(40 + distanceKm * 10 + durationMin * 2.5),
      eta: Math.round(durationMin)
    };

    const rapidoRide = {
      service: "Rapido",
      price: Math.round(30 + distanceKm * 8 + durationMin * 1.5),
      eta: Math.round(durationMin)
    };

    const rides = [uberRide, olaRide, rapidoRide];

    // Update recommended logic to include all rides
    const recommended = rides.reduce((prev, curr) => (curr.price < prev.price ? curr : prev));

    return { rides, recommended };
  } catch (err) {
    console.error("❌ Error in getRides:", err);
    return { error: "Failed to get ride estimates" };
  }
}
