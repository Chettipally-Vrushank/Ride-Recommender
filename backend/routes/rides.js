import express from "express";
import { getRides } from "../services/rideService.js";

const router = express.Router();

router.get("/rides", async (req, res) => {
  const { pickup, drop } = req.query;

  if (!pickup || !drop) return res.json({ rides: [], recommended: { message: "Pickup and drop required" } });

  const result = await getRides(pickup, drop);
  res.json(result);
});

export default router;
