import express from "express";
import {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripsByUserId,
  getTripsByStation,
} from "../controllers/tripController.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";
import {
  checkUserOwnership,
  checkTripOwnership,
} from "../middleware/authorization.js";

const router = express.Router();

// GET /api/trips - Get all trips (optional auth for user context)
router.get("/", optionalAuth, getAllTrips);

// GET /api/trips/:id - Get trip by ID (optional auth)
router.get("/:id", optionalAuth, getTripById);

// GET /api/trips/user/:userId - Get trips by user ID (protected - user can only access their own trips)
router.get(
  "/user/:userId",
  authenticateToken,
  checkUserOwnership,
  getTripsByUserId
);

// GET /api/trips/station/:station - Get trips by station (optional auth)
router.get("/station/:station", optionalAuth, getTripsByStation);

// POST /api/trips - Create new trip (protected)
router.post("/", authenticateToken, createTrip);

// PUT /api/trips/:id - Update trip (protected - user can only update their own trips)
router.put("/:id", authenticateToken, checkTripOwnership, updateTrip);

// DELETE /api/trips/:id - Delete trip (protected - user can only delete their own trips)
router.delete("/:id", authenticateToken, checkTripOwnership, deleteTrip);

export default router;
