import cron from 'node-cron';
import prisma from '../config/db.js';



export const initCronJobs = () => {
  // Run every day at 3:00 AM ('0 3 * * *')
  // We use Asia/Kolkata timezone assuming users are in India for Metro
  cron.schedule('0 3 * * *', async () => {
    console.log('[CRON] Starting daily trip cleanup job at 3:00 AM');
    try {
      // Find trips older than 24 hours (1 day) based on startTime
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const oldTrips = await prisma.trip.findMany({
        where: {
          startTime: {
            lt: oneDayAgo,
          },
        },
      });

      if (oldTrips.length === 0) {
        console.log('[CRON] No old trips to clean up today.');
        return;
      }

      console.log(`[CRON] Found ${oldTrips.length} old trips. Moving to history...`);

      // Use a transaction to safely move them
      await prisma.$transaction(async (tx) => {
        // 1. Insert into TripHistory
        const historyData = oldTrips.map(trip => ({
          userId: trip.userId,
          startTime: trip.startTime,
          stationList: trip.stationList,
          length: trip.length,
          startStation: trip.startStation,
          endStation: trip.endStation
        }));

        await tx.tripHistory.createMany({
          data: historyData
        });

        // 2. Delete from active Trip table
        const tripIds = oldTrips.map(t => t.id);
        await tx.trip.deleteMany({
          where: {
            id: { in: tripIds }
          }
        });
      });

      console.log(`[CRON] Successfully archived ${oldTrips.length} trips.`);
    } catch (error) {
      console.error('[CRON] Error during trip cleanup job:', error);
    }
  }, {
    timezone: "Asia/Kolkata"
  });
};
