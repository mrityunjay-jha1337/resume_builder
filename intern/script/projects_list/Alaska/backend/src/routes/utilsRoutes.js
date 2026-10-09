import express from "express";
import pathRoutes from "./pathRoutes.js";

const router = express.Router();

router.use("/path", pathRoutes);

export default router;
