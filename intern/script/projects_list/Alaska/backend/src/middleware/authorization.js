// Middleware to check if user can access a specific user's data
export const checkUserOwnership = (req, res, next) => {
  const { userId } = req.params;

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.id !== userId) {
    return res.status(403).json({
      success: false,
      message: "You can only access your own data",
    });
  }

  next();
};

// Middleware to check if user can access a specific trip
export const checkTripOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { default: prisma } = await import("../config/db.js");

    const trip = await prisma.trip.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (trip.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own trips",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking trip ownership",
      error: error.message,
    });
  }
};

// Middleware to check if user can access a specific chat
export const checkChatOwnership = async (req, res, next) => {
  try {
    const { id, senderId, receiverId } = req.params;
    const { default: prisma } = await import("../config/db.js");

    if (id) {
      // Check ownership for specific chat by ID
      const chat = await prisma.chat.findUnique({
        where: { id },
        select: { senderId: true, receiverId: true },
      });

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found",
        });
      }

      if (chat.senderId !== req.user.id && chat.receiverId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You can only access chats you are involved in",
        });
      }
    } else if (senderId && receiverId) {
      // Check ownership for chats between users
      if (req.user.id !== senderId && req.user.id !== receiverId) {
        return res.status(403).json({
          success: false,
          message: "You can only access chats you are involved in",
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking chat ownership",
      error: error.message,
    });
  }
};
