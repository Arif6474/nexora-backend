import { Router } from "express";
import consumerAppRoutes from "./consumerAppRoutes/consumerAppRoutes.js";
import employeeAppRoutes from "./employeeAppRoutes/employeeAppRoutes.js";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const router = Router();

// router.use('/api', consumerAppRoutes);
router.use('/customerApp', consumerAppRoutes);
router.use('/employeeApp', employeeAppRoutes);

export default router;  
