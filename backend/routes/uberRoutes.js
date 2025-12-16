// backend/routes/uberRoutes.js
import express from "express";
import { getUberEstimateFromAddresses } from "../services/uberService.js";

const router = express.Router();

router.get("/uber/estimate", async (req, res) => {
  const { pickup, drop } = req.query;
  if (!pickup || !drop) return res.status(400).json({ error: "pickup and drop required" });

  try {
    const data = await getUberEstimateFromAddresses(pickup, drop);
    // normalize a little for your frontend
    const prices = (data.prices || []).map(p => ({
      service: p.display_name || p.localized_display_name || p.product_id,
      estimate: p.estimate || (p.low_estimate && p.high_estimate ? `${p.low_estimate}-${p.high_estimate}` : "N/A"),
      distance_km: p.distance,
      duration_min: p.duration ? Math.round(p.duration / 60) : null
    }));

    res.json({ service: "uber", raw: data, prices });
  } catch (err) {
    console.error("Uber estimate error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch Uber estimate", detail: err?.response?.data || err.message });
  }
});

export default router;
