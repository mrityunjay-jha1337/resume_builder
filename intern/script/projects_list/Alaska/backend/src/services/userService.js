import prisma from "../config/db.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



export const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true, name: true, username: true, email: true, profile_image: true,
      about: true, bio: true, images: true, ratings: true, ratingCount: true,
      trips: true, tripHistory: true,
    },
  });
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      trips: true,
      tripHistory: true,
      receivedReviews: { include: { reviewer: { select: { id: true, name: true, profile_image: true, username: true } } } },
      writtenReviews: { include: { reviewee: { select: { id: true, name: true, profile_image: true, username: true } } } },
    },
  });
  if (!user) throw new Error("User not found");
  const { password, ...userWithoutPassword } = user;
  
  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ requesterId: id }, { receiverId: id }], status: "ACCEPTED" },
    include: {
      requester: { select: { id: true, name: true, username: true, profile_image: true, bio: true } },
      receiver: { select: { id: true, name: true, username: true, profile_image: true, bio: true } },
    },
  });
  const friendsList = friendships.map((f) => f.requesterId === id ? f.receiver : f.requester);
  userWithoutPassword.friends = friendsList;
  return userWithoutPassword;
};

export const createUser = async (data) => {
  return await prisma.user.create({
    data: {
      name: data.name, username: data.username, email: data.email, password: data.password,
      profile_image: data.image, about: data.about, bio: data.bio,
    },
  });
};

export const updateUser = async (id, data) => {
  const { name, username, email, image, about, bio, images } = data;
  if (username) {
    const existingUser = await prisma.user.findFirst({ where: { username, NOT: { id } } });
    if (existingUser) throw new Error("Username is already taken");
  }
  if (email) {
    const existingUser = await prisma.user.findFirst({ where: { email, NOT: { id } } });
    if (existingUser) throw new Error("Email is already taken");
  }
  return await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }), ...(username && { username }), ...(email && { email }),
      ...(image !== undefined && { profile_image: image }), ...(about !== undefined && { about }),
      ...(bio !== undefined && { bio }), ...(images !== undefined && { images }),
    },
    select: { id: true, name: true, username: true, email: true, profile_image: true, about: true, bio: true, images: true, ratings: true, ratingCount: true },
  });
};

export const deleteUser = async (id) => {
  await prisma.user.delete({ where: { id } });
};

export const getUserByUsername = async (username) => {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { trips: true },
  });
  if (!user) throw new Error("User not found");
  return user;
};

export const uploadGalleryImage = async (id, fileBuffer, dummyMode = false) => {
  if (dummyMode) {
    const dummyUrl = `https://dummyimage.com/600x400/000/fff&text=Dummy+Image+${Date.now()}`;
    const user = await prisma.user.findUnique({ where: { id } });
    const updatedImages = [...(user.images || []), dummyUrl];
    return await prisma.user.update({
      where: { id }, data: { images: updatedImages },
      select: { id: true, name: true, username: true, email: true, profile_image: true, images: true },
    });
  } else {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ folder: "alaska_gallery" }, async (error, result) => {
        if (error) return reject(error);
        try {
          const user = await prisma.user.findUnique({ where: { id } });
          const updatedImages = [...(user.images || []), result.secure_url];
          const updatedUser = await prisma.user.update({
            where: { id }, data: { images: updatedImages },
            select: { id: true, name: true, username: true, email: true, profile_image: true, images: true },
          });
          resolve(updatedUser);
        } catch (dbError) {
          reject(dbError);
        }
      });
      uploadStream.end(fileBuffer);
    });
  }
};
