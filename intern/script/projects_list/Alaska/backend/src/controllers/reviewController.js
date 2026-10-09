import * as reviewService from "../services/reviewService.js";

export const getAllReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getAllReviews();
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getReviewById = async (req, res) => {
  try {
    const review = await reviewService.getReviewById(req.params.id);
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

export const getReceivedReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getReceivedReviews(req.params.userId);
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getWrittenReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getWrittenReviews(req.params.userId);
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    const { revieweeId, rating } = req.body;
    if (!revieweeId || !rating) {
      return res.status(400).json({ success: false, error: "revieweeId and rating are required" });
    }
    const review = await reviewService.createReview(req.user.id, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    await reviewService.deleteReview(req.params.id, req.user.id);
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
