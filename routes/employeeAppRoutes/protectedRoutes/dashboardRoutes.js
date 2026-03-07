import { Router } from "express";
import { getDashboardStats, getOrdersReport } from "#controllers/dashboardController.js";

const dashboardRoutes = Router();

dashboardRoutes.get('/stats', getDashboardStats);
dashboardRoutes.get('/report', getOrdersReport);

export default dashboardRoutes;
