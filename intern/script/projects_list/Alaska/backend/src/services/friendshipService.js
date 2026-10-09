import prisma from "../config/db.js";

export const sendRequest = async (requesterId, receiverId) => {
  if (requesterId === receiverId) throw new Error("Cannot send request to yourself");
  const existing = await prisma.friendship.findFirst({
    where: { OR: [{ requesterId, receiverId }, { requesterId: receiverId, receiverId: requesterId }] },
  });
  if (existing) throw new Error("Friendship interaction already exists");
  return await prisma.friendship.create({
    data: { requesterId, receiverId, status: "PENDING" },
  });
};

export const acceptRequest = async (id, userId) => {
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) throw new Error("Request not found");
  if (friendship.receiverId !== userId) throw new Error("Unauthorized");
  return await prisma.friendship.update({
    where: { id }, data: { status: "ACCEPTED" },
  });
};

export const rejectRequest = async (id, userId) => {
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) throw new Error("Request not found");
  if (friendship.receiverId !== userId && friendship.requesterId !== userId) throw new Error("Unauthorized");
  await prisma.friendship.delete({ where: { id } });
};

export const getPendingRequests = async (userId) => {
  return await prisma.friendship.findMany({
    where: { receiverId: userId, status: "PENDING" },
    include: { requester: { select: { id: true, name: true, username: true, profile_image: true } } },
  });
};

export const getFriends = async (userId) => {
  const requests = await prisma.friendship.findMany({
    where: { OR: [{ requesterId: userId }, { receiverId: userId }], status: "ACCEPTED" },
    include: {
      requester: { select: { id: true, name: true, username: true, profile_image: true } },
      receiver: { select: { id: true, name: true, username: true, profile_image: true } },
    },
  });
  return requests.map((f) => f.requesterId === userId ? f.receiver : f.requester);
};

export const removeFriendByUserId = async (userId, friendId) => {
  const friendship = await prisma.friendship.findFirst({
    where: { OR: [{ requesterId: userId, receiverId: friendId }, { requesterId: friendId, receiverId: userId }] },
  });
  if (!friendship) throw new Error("Friendship not found");
  await prisma.friendship.delete({ where: { id: friendship.id } });
};
