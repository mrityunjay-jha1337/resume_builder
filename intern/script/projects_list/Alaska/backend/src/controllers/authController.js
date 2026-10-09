import * as authService from "../services/authService.js";

export const register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, username, email, and password are required" });
    }
    const data = await authService.registerUser(req.body);
    res.status(201).json({ success: true, message: "User registered successfully", data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    const data = await authService.loginUser(email, password);
    res.status(200).json({ success: true, message: "Login successful", data });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get profile", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updatedUser = await authService.updateProfile(req.user.id, req.body);
    res.status(200).json({ success: true, message: "Profile updated successfully", data: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current password and new password are required" });
    }
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const addProfileImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ success: false, message: "Image URL is required" });
    const updatedUser = await authService.addProfileImage(req.user.id, imageUrl);
    res.status(200).json({ success: true, message: "Image added successfully", data: updatedUser.images });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add image", error: error.message });
  }
};

export const deleteProfileImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ success: false, message: "Image URL is required" });
    const updatedUser = await authService.deleteProfileImage(req.user.id, imageUrl);
    res.status(200).json({ success: true, message: "Image deleted successfully", data: updatedUser.images });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete image", error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Logout failed", error: error.message });
  }
};
