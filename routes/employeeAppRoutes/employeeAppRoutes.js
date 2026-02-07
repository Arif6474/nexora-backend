import { Router } from "express";
import protectedRoutes from "./protectedRoutes/protectedRoutes.js";
import publicRoutes from "./publicRoutes/publicRoutes.js";
import { protectForCustomer } from "#middlewares/authMiddleware.js";

const employeeAppRoutes = Router();

employeeAppRoutes.use('/public', publicRoutes);
// Using protectForCustomer for now as protectForEmployee was removed. 
// This allows authenticated customers (likely admins) to access these routes.
employeeAppRoutes.use('/protected', protectForCustomer, protectedRoutes);

export default employeeAppRoutes;
