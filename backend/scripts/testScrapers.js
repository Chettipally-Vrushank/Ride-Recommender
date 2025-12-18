import 'dotenv/config';
import { getUberEstimate } from '../services/uberService.js';
import { getOlaEstimate } from '../services/olaService.js';
import { getRapidoEstimate } from '../services/rapidoService.js';
import { getCoordinates } from '../services/mapsService.js';

async function test() {
    const pickup = "Central Mall";
    const drop = "Airport";

    console.log(`Testing estimates for ${pickup} -> ${drop}`);

    // Need coords for Uber logic (legacy)
    const pCoords = await getCoordinates(pickup);
    const dCoords = await getCoordinates(drop);

    console.log("Coords:", pCoords, dCoords);

    try {
        const ola = await getOlaEstimate(pickup, drop);
        console.log("Ola:", ola);
    } catch (e) { console.error("Ola Error:", e.message); }

    try {
        const rapido = await getRapidoEstimate(pickup, drop);
        console.log("Rapido:", rapido);
    } catch (e) { console.error("Rapido Error:", e.message); }

    try {
        // Uber expects coords
        if (pCoords && dCoords) {
            const uber = await getUberEstimate(pCoords, dCoords);
            console.log("Uber:", uber);
        } else {
            console.log("Skipping Uber (no coords)");
        }
    } catch (e) { console.error("Uber Error:", e.message); }
}

test();
