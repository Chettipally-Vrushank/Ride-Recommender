import 'dotenv/config';
import express from "express";
import cors from "cors";
import ridesRouter from "./routes/rides.js";
import placesRouter from "./routes/places.js";
import uberRoutes from "./routes/uberRoutes.js";


console.log('DEBUG process.env.GOOGLE_MAPS_API_KEY =', process.env.GOOGLE_MAPS_API_KEY);

const app = express();

// Enable CORS for development (allow all origins). In production, restrict this.
app.use(cors());
const PORT = 4000;

app.use("/", ridesRouter);
app.use("/", placesRouter);
app.use("/api", uberRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
