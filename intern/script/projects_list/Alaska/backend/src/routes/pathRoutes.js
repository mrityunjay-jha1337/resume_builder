import express from "express";
import { matchTrips } from "../controllers/pathController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/match_trips", optionalAuth, matchTrips);

export default router;
