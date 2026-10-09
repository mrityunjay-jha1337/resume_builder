import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  register,
  login,
  getProfile,
  updateProfile,
  addProfileImage,
  deleteProfileImage,
  changePassword,
  logout,
} from "../controllers/authController.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Protected routes
router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, updateProfile);
router.post("/profile/images", authenticateToken, addProfileImage);
router.delete("/profile/images", authenticateToken, deleteProfileImage);
router.post("/change-password", authenticateToken, changePassword);

// Token verification endpoint
router.get("/verify", authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token is valid",
    data: req.user,
  });
});

export default router;
