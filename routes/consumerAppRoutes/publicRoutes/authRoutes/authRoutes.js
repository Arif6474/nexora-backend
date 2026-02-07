import { loginCustomer, registerCustomer, getEmailFromToken, loginWithGoogle, forgotPassword, resetPassword } from '#controllers/userControllers/customerController.js';
import { Router } from 'express'

const authRoutes = Router()

authRoutes.post('/login', loginCustomer);
authRoutes.post('/register', registerCustomer);
authRoutes.post('/forgotPassword', forgotPassword);
authRoutes.patch('/resetPassword', resetPassword);
authRoutes.get('/getEmailFromToken/:token', getEmailFromToken)
authRoutes.post('/loginWithGoogle', loginWithGoogle);

export default authRoutes