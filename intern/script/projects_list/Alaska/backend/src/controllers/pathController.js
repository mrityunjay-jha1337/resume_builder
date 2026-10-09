import * as pathService from "../services/pathService.js";

export const matchTrips = async (req, res) => {
  try {
    const finalResults = await pathService.matchTrips(req.user, req.body);
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedResults = finalResults.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedResults,
      count: paginatedResults.length,
      total: finalResults.length,
      totalPages: Math.ceil(finalResults.length / limit),
      currentPage: page,
      query: { totalStations: req.body.totalStations || 0, startTime: req.body.startTime ? new Date(req.body.startTime) : null, page, limit },
      message: `Found ${paginatedResults.length} matching trips (page ${page} of ${Math.ceil(finalResults.length / limit)})`,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
