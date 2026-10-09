import prisma from "../config/db.js";

export const getAllReviews = async () => {
  return await prisma.review.findMany({
    include: {
      reviewer: { select: { id: true, name: true, username: true, images: true } },
      reviewee: { select: { id: true, name: true, username: true, images: true } },
    },
  });
};

export const getReviewById = async (id) => {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      reviewer: { select: { id: true, name: true, username: true, images: true } },
      reviewee: { select: { id: true, name: true, username: true, images: true } },
    },
  });
  if (!review) throw new Error("Review not found");
  return review;
};

export const getReceivedReviews = async (userId) => {
  return await prisma.review.findMany({
    where: { revieweeId: userId },
    include: { reviewer: { select: { id: true, name: true, username: true, images: true } } },
    orderBy: { createdAt: "desc" },
  });
};

export const getWrittenReviews = async (userId) => {
  return await prisma.review.findMany({
    where: { reviewerId: userId },
    include: { reviewee: { select: { id: true, name: true, username: true, images: true } } },
    orderBy: { createdAt: "desc" },
  });
};

export const createReview = async (reviewerId, data) => {
  const { revieweeId, rating, comment } = data;
  if (reviewerId === revieweeId) throw new Error("You cannot review yourself");

  const review = await prisma.review.create({
    data: { reviewerId, revieweeId, rating: Number(rating), comment },
    include: {
      reviewer: { select: { id: true, name: true, username: true } },
      reviewee: { select: { id: true, name: true, username: true } },
    },
  });

  const aggregations = await prisma.review.aggregate({
    where: { revieweeId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.user.update({
    where: { id: revieweeId },
    data: {
      ratings: Math.round(aggregations._avg.rating || 0),
      ratingCount: aggregations._count.rating,
    },
  });

  return review;
};

export const deleteReview = async (id, userId) => {
  const existingReview = await prisma.review.findUnique({ where: { id } });
  if (!existingReview) throw new Error("Review not found");
  if (existingReview.reviewerId !== userId) throw new Error("Not authorized to delete this review");

  await prisma.review.delete({ where: { id } });

  const revieweeId = existingReview.revieweeId;
  const aggregations = await prisma.review.aggregate({
    where: { revieweeId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.user.update({
    where: { id: revieweeId },
    data: {
      ratings: Math.round(aggregations._avg.rating || 0),
      ratingCount: aggregations._count.rating,
    },
  });
};
