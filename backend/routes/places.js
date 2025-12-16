import express from "express";
import { placesAutocomplete, placeDetails } from "../services/mapsService.js";

const router = express.Router();

router.get("/places", async (req, res) => {
  const { input, types, country } = req.query;
  if (!input) return res.status(400).json({ error: "input query required" });

  try {
    const preds = await placesAutocomplete(String(input), { types: types ? String(types) : undefined, country: country ? String(country) : undefined });
    res.json({ predictions: preds });
  } catch (err) {
    console.error("Error in places autocomplete:", err);
    res.status(500).json({ error: "Places autocomplete failed" });
  }
});

router.get('/placeDetails', async (req, res) => {
  const { place_id } = req.query;
  if (!place_id) return res.status(400).json({ error: 'place_id required' });
  try {
    const details = await placeDetails(String(place_id));
    res.json({ details });
  } catch (err) {
    console.error('Error fetching place details', err);
    res.status(500).json({ error: 'Failed to fetch place details' });
  }
});

export default router;
