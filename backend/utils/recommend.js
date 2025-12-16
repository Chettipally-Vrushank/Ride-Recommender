export function recommend(rides, preference) {
  if (!rides || rides.length === 0) {
    return null; // nothing to recommend
  }

  if (preference === "cheapest") {
    return rides.reduce((a, b) => (a.price < b.price ? a : b));
  }

  if (preference === "fastest") {
    return rides.reduce((a, b) => (a.eta < b.eta ? a : b));
  }

  return rides[0]; // fallback
}
