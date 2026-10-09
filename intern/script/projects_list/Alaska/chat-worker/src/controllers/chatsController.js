import { prisma } from '../config/db.js';

export async function getChatsBetween(req, res) {
  try {
    const { senderId, receiverId } = req.params;
    
    const chats = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    const serializedChats = chats.map(chat => ({
      ...chat,
      clientTimestamp: chat.clientTimestamp ? Number(chat.clientTimestamp) : null
    }));

    return res.json({ success: true, data: serializedChats });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
