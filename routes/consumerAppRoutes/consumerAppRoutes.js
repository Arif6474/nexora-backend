import { Router } from 'express'

import publicRoutes from './publicRoutes/publicRoutes.js'
import protectedRoutes from './protectedRoutes/protectedRoutes.js'
import { protectForCustomer } from '#middlewares/authMiddleware.js'


import chatbotRoutes from './chatbotRoutes.js'

const consumerAppRoutes = Router()

consumerAppRoutes.use('/public', publicRoutes)
consumerAppRoutes.use('/protected', protectForCustomer, protectedRoutes)
consumerAppRoutes.use('/chatbot', chatbotRoutes)




export default consumerAppRoutes