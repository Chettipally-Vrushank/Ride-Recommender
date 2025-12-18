import { getDistance } from "./mapsService.js";

export async function getRapidoEstimate(pickup, drop) {
  const distance = await getDistance(pickup, drop);
  if (!distance) return null;

  const baseFare = 30;
  const perKm = 10;
  const perMin = 1;

  const price =
    baseFare +
    distance.distanceKm * perKm +
    distance.durationMin * perMin;

  return {
    service: "Rapido",
    price: Math.round(price),
    eta: Math.round(distance.durationMin),
  };
}
