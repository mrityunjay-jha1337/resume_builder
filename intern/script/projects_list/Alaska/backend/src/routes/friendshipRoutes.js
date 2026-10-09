import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getPendingRequests,
  getFriends,
  removeFriendByUserId,
} from "../controllers/friendshipController.js";

const router = express.Router();

router.post("/request", authenticateToken, sendRequest);
router.put("/accept/:id", authenticateToken, acceptRequest);
router.delete("/reject/:id", authenticateToken, rejectRequest);
router.delete("/user/:friendId", authenticateToken, removeFriendByUserId);
router.get("/pending", authenticateToken, getPendingRequests);
router.get("/friends", authenticateToken, getFriends);

export default router;
