import { Router } from 'express'
import { createOrder, getMyAllOrders, getMyOrderById } from '#controllers/order/orderController.js'
import { updateProfile } from '#controllers/userControllers/customerController.js'
import wishlistRoutes from './wishlistRoutes.js'

const protectedRoutes = Router()
protectedRoutes.post('/createOrder', createOrder)
protectedRoutes.get('/getMyAllOrders', getMyAllOrders)
protectedRoutes.get('/getMyOrderById/:orderId', getMyOrderById)
protectedRoutes.patch('/updateProfile', updateProfile)
protectedRoutes.use('/wishlists', wishlistRoutes)

export default protectedRoutes
