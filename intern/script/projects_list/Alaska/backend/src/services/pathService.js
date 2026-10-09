import prisma from "../config/db.js";

const TIME_WINDOW_MINUTES = 120;
const AVG_STATION_TIME_MINUTES = 3;
const DEFAULT_MATCH_THRESHOLD_MINUTES = 10;

function getLongestCommonWithIndices(st, candidateIds) {
  let v = 0, l = 0, bestLen = 0, bestEndPosRef = -1, bestEndPosCand = -1;
  for (let i = 0; i < candidateIds.length; i++) {
    const c = candidateIds[i];
    while (v !== -1 && !st[v].next.has(c)) {
      v = st[v].link;
      if (v !== -1) l = st[v].len;
    }
    if (v === -1) { v = 0; l = 0; } else { v = st[v].next.get(c); l++; }
    if (l > bestLen) { bestLen = l; bestEndPosRef = st[v].firstEndPos; bestEndPosCand = i; }
  }
  const startRef = bestEndPosRef !== -1 ? bestEndPosRef - bestLen + 1 : -1;
  const startCand = bestEndPosCand !== -1 ? bestEndPosCand - bestLen + 1 : -1;
  return { length: bestLen, startRef, startCand };
}

function deserializeSam(serializedSam) {
  if (!serializedSam || !serializedSam.st) return null;
  return serializedSam.st.map(state => ({ ...state, next: new Map(state.next) }));
}

export const matchTrips = async (user, data) => {
  const { sam, startTime, k, totalStations, matchThreshold } = data;
  const thresholdMinutes = matchThreshold !== undefined ? parseInt(matchThreshold) : DEFAULT_MATCH_THRESHOLD_MINUTES;
  const st = deserializeSam(sam);
  if (!st) throw new Error("Failed to deserialize SAM");

  let refTime = null, dateFilter = {};
  if (startTime) {
    refTime = new Date(startTime);
    if (isNaN(refTime.getTime())) throw new Error("Invalid startTime");
    const minTime = new Date(refTime.getTime() - TIME_WINDOW_MINUTES * 60000);
    const maxTime = new Date(refTime.getTime() + TIME_WINDOW_MINUTES * 60000);
    dateFilter = { startTime: { gte: minTime, lte: maxTime } };
  }
  if (user) dateFilter.userId = { not: user.id };

  const trips = await prisma.trip.findMany({
    where: dateFilter,
    include: { user: { select: { id: true, name: true, username: true, email: true, profile_image: true, ratings: true } } },
  });

  let userFriendships = [];
  if (user) {
    userFriendships = await prisma.friendship.findMany({
      where: { OR: [{ requesterId: user.id }, { receiverId: user.id }] },
    });
  }

  const results = trips.map((trip) => {
    const candidatePath = trip.stationList;
    const { length, startRef, startCand } = getLongestCommonWithIndices(st, candidatePath);
    let timeDiffAtOverlap = null, isViable = false;

    if (length > 0) {
      if (refTime) {
        const timeToReachOverlapRef = startRef * AVG_STATION_TIME_MINUTES;
        const timeToReachOverlapCan = startCand * AVG_STATION_TIME_MINUTES;
        const overlapTimeRef = new Date(refTime.getTime() + timeToReachOverlapRef * 60000);
        const overlapTimeCan = new Date(trip.startTime.getTime() + timeToReachOverlapCan * 60000);
        timeDiffAtOverlap = Math.round((overlapTimeCan - overlapTimeRef) / 60000);
        if (Math.abs(timeDiffAtOverlap) <= thresholdMinutes) isViable = true;
      } else {
        isViable = true;
      }
    }

    let friendshipStatus = "NONE", friendshipId = null;
    if (user) {
      const relationship = userFriendships.find(f =>
        (f.requesterId === trip.user.id && f.receiverId === user.id) ||
        (f.receiverId === trip.user.id && f.requesterId === user.id)
      );
      if (relationship) {
        friendshipId = relationship.id;
        if (relationship.status === "PENDING" && relationship.receiverId === user.id) friendshipStatus = "RECEIVED_REQUEST";
        else if (relationship.status === "PENDING" && relationship.requesterId === user.id) friendshipStatus = "SENT_REQUEST";
        else friendshipStatus = relationship.status;
      }
    }
    return { ...trip, lcsLen: length, startInQuery: startRef, startInCandidate: startCand, timeDiffAtOverlap, isViable, friendshipStatus, friendshipId };
  });

  let finalResults = results;
  if (refTime) finalResults = results.filter((r) => r.isViable);
  finalResults.sort((a, b) => b.lcsLen - a.lcsLen);
  return finalResults;
};
