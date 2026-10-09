import * as tripService from "../services/tripService.js";

export const getAllTrips = async (req, res) => {
  try {
    const trips = await tripService.getAllTrips();
    res.status(200).json({ success: true, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTripById = async (req, res) => {
  try {
    const trip = await tripService.getTripById(req.params.id);
    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const createTrip = async (req, res) => {
  try {
    const trip = await tripService.createTrip(req.body);
    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    res.status(400).json({ success: false, error: "User not found or invalid data" });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.body);
    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    res.status(404).json({ success: false, message: "Trip not found" });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    await tripService.deleteTrip(req.params.id);
    res.status(200).json({ success: true, message: "Trip deleted successfully" });
  } catch (error) {
    res.status(404).json({ success: false, message: "Trip not found" });
  }
};

export const getTripsByUserId = async (req, res) => {
  try {
    const trips = await tripService.getTripsByUserId(req.params.userId);
    res.status(200).json({ success: true, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTripsByStation = async (req, res) => {
  try {
    const stationId = parseInt(req.params.station, 10);
    if (isNaN(stationId)) return res.status(400).json({ success: false, error: "Invalid station ID" });
    const trips = await tripService.getTripsByStation(stationId);
    res.status(200).json({ success: true, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
