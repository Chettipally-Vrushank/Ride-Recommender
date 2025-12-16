import { getDistance } from "./mapsService.js";

export async function getOlaEstimate(pickup, drop) {
  const distance = await getDistance(pickup, drop);
  if (!distance) return null;

  const baseFare = 40;
  const perKm = 11;
  const perMin = 3;

  const price =
    baseFare +
    distance.distanceKm * perKm +
    distance.durationMin * perMin;

  return {
    service: "Ola",
    price: Math.round(price),
    eta: Math.round(distance.durationMin),
  };
}

