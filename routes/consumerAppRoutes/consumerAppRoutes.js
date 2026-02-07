import { Router } from 'express'

import publicRoutes from './publicRoutes/publicRoutes.js'
import protectedRoutes from './protectedRoutes/protectedRoutes.js'
import { protectForCustomer } from '#middlewares/authMiddleware.js'


const consumerAppRoutes = Router()

consumerAppRoutes.use('/public', publicRoutes)
consumerAppRoutes.use('/protected', protectForCustomer, protectedRoutes)




export default consumerAppRoutes