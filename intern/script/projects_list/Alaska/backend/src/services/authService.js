import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";



const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

export const registerUser = async (data) => {
  const { name, username, email, password, about, bio } = data;
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existingUser) throw new Error("User already exists with this email or username");
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, username, email, password: hashedPassword, about: about || "", bio: bio || "" },
    select: { id: true, name: true, username: true, email: true, profile_image: true, about: true, bio: true, images: true, ratings: true, ratingCount: true },
  });
  const token = generateToken(user.id);
  return { user, token };
};

export const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error("Invalid credentials");
  const token = generateToken(user.id);
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

export const updateProfile = async (userId, data) => {
  const { name, username, about, bio, image, images } = data;
  if (username) {
    const existingUser = await prisma.user.findFirst({ where: { username, NOT: { id: userId } } });
    if (existingUser) throw new Error("Username is already taken");
  }
  return await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(username && { username }),
      ...(about !== undefined && { about }),
      ...(bio !== undefined && { bio }),
      ...(image !== undefined && { profile_image: image }),
      ...(images !== undefined && { images }),
    },
    select: { id: true, name: true, username: true, email: true, profile_image: true, about: true, bio: true, images: true },
  });
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) throw new Error("Current password is incorrect");
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashedNewPassword } });
};

export const addProfileImage = async (userId, imageUrl) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { images: { push: imageUrl } },
    select: { id: true, images: true },
  });
};

export const deleteProfileImage = async (userId, imageUrl) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { images: true } });
  if (!user) throw new Error("User not found");
  const newImages = user.images.filter((img) => img !== imageUrl);
  return await prisma.user.update({
    where: { id: userId },
    data: { images: newImages },
    select: { id: true, images: true },
  });
};
