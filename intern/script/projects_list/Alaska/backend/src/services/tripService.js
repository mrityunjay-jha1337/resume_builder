import prisma from "../config/db.js";

export const getAllTrips = async () => {
  return await prisma.trip.findMany({
    include: { user: { select: { id: true, name: true, username: true, email: true, profile_image: true, ratings: true, ratingCount: true } } },
  });
};

export const getTripById = async (id) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, username: true, email: true, profile_image: true, ratings: true, ratingCount: true } } },
  });
  if (!trip) throw new Error("Trip not found");
  return trip;
};

export const createTrip = async (data) => {
  return await prisma.trip.create({
    data: {
      userId: data.userId, startTime: new Date(data.startTime), stationList: data.stationList,
      length: data.length, startStation: data.startStation, endStation: data.endStation,
    },
    include: { user: { select: { id: true, name: true, username: true, email: true, profile_image: true, ratings: true, ratingCount: true } } },
  });
};

export const updateTrip = async (id, data) => {
  return await prisma.trip.update({
    where: { id },
    data: {
      ...(data.startTime && { startTime: new Date(data.startTime) }),
      ...(data.stationList !== undefined && { stationList: data.stationList }),
      ...(data.length !== undefined && { length: data.length }),
      ...(data.startStation !== undefined && { startStation: data.startStation }),
      ...(data.endStation !== undefined && { endStation: data.endStation }),
    },
    include: { user: { select: { id: true, name: true, username: true, email: true, profile_image: true, ratings: true, ratingCount: true } } },
  });
};

export const deleteTrip = async (id) => {
  await prisma.trip.delete({ where: { id } });
};

export const getTripsByUserId = async (userId) => {
  const trips = await prisma.trip.findMany({
    where: { userId },
    include: { user: { select: { id: true, name: true, username: true, email: true, profile_image: true, ratings: true, ratingCount: true } } },
    orderBy: { startTime: "desc" },
  });
  const history = await prisma.tripHistory.findMany({
    where: { userId },
    include: { user: { select: { id: true, name: true, username: true, email: true, profile_image: true, ratings: true, ratingCount: true } } },
    orderBy: { startTime: "desc" },
  });
  return [...trips, ...history].sort((a, b) => b.startTime - a.startTime);
};

export const getTripsByStation = async (stationId) => {
  return await prisma.trip.findMany({
    where: { OR: [{ startStation: stationId }, { endStation: stationId }, { stationList: { has: stationId } }] },
    include: { user: { select: { id: true, name: true, username: true, email: true, profile_image: true, ratings: true, ratingCount: true } } },
    orderBy: { startTime: "desc" },
  });
};
