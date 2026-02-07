import { Router } from "express";
import {
    loginEmployee,
    registerEmployee,
    forgotEmployeePassword,
    resetEmployeePassword,
    getEmailFromToken
} from "#controllers/userControllers/employeeController.js";

const publicRoutes = Router();

publicRoutes.post('/login', loginEmployee);
publicRoutes.post('/register', registerEmployee);
publicRoutes.post('/forgotPassword', forgotEmployeePassword);
publicRoutes.post('/resetPassword', resetEmployeePassword);
publicRoutes.get('/getEmailFromToken/:token', getEmailFromToken);

export default publicRoutes;
