import * as friendshipService from "../services/friendshipService.js";

export const sendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const friendship = await friendshipService.sendRequest(req.user.id, receiverId);
    res.status(201).json({ success: true, data: friendship });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const updated = await friendshipService.acceptRequest(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    await friendshipService.rejectRequest(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: "Request rejected/deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const requests = await friendshipService.getPendingRequests(req.user.id);
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getFriends = async (req, res) => {
  try {
    const friends = await friendshipService.getFriends(req.user.id);
    res.status(200).json({ success: true, data: friends });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const removeFriendByUserId = async (req, res) => {
  try {
    await friendshipService.removeFriendByUserId(req.user.id, req.params.friendId);
    res.status(200).json({ success: true, message: "Friend removed successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
