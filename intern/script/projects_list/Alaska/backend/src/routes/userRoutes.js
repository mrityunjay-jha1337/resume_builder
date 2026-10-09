import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserByUsername,
  uploadGalleryImage,
} from "../controllers/userController.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// GET /api/users - Get all users (optional auth for user context)
router.get("/", optionalAuth, getAllUsers);

// GET /api/users/:id - Get user by ID (optional auth for user context)
router.get("/:id", optionalAuth, getUserById);

// GET /api/users/username/:username - Get user by username (optional auth)
router.get("/username/:username", optionalAuth, getUserByUsername);

// POST /api/users - Create new user (protected - admin only or registration via auth)
router.post("/", authenticateToken, createUser);

// PUT /api/users/:id - Update user (protected - user can only update their own profile)
router.put("/:id", authenticateToken, updateUser);

// DELETE /api/users/:id - Delete user (protected - user can only delete their own account)
router.delete("/:id", authenticateToken, deleteUser);

// POST /api/users/:id/gallery - Upload image to gallery
router.post(
  "/:id/gallery",
  authenticateToken,
  upload.single("file"),
  uploadGalleryImage,
);

export default router;
