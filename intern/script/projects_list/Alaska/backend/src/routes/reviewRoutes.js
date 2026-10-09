import express from "express";
import {
  getAllReviews,
  getReviewById,
  getReceivedReviews,
  getWrittenReviews,
  createReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/reviews - Get all reviews
router.get("/", optionalAuth, getAllReviews);

// GET /api/reviews/:id - Get review by ID
router.get("/:id", optionalAuth, getReviewById);

// GET /api/reviews/received/:userId - Get reviews received by a user
router.get("/received/:userId", optionalAuth, getReceivedReviews);

// GET /api/reviews/written/:userId - Get reviews written by a user
router.get("/written/:userId", optionalAuth, getWrittenReviews);

// POST /api/reviews - Create a review (protected)
router.post("/", authenticateToken, createReview);



// DELETE /api/reviews/:id - Delete a review (protected)
router.delete("/:id", authenticateToken, deleteReview);

export default router;
