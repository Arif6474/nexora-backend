import { Router } from 'express'
import { checkProductWishlist, createWishlist, getMyWishlists } from '#controllers/wishlistController.js'

const wishlistRoutes = Router()
wishlistRoutes.post('/createWishlist', createWishlist)
wishlistRoutes.get('/checkProductWishlist', checkProductWishlist)
wishlistRoutes.get('/getMyWishlists', getMyWishlists)

export default wishlistRoutes