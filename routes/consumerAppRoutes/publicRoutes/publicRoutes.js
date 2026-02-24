import { Router } from 'express'
import { getHomePageData, getAllProductCategories, getSingleProductDetails, getAllProductsWithSearch, getSingleProductBySlug, getAllProductsWithQuery, getSubCategoriesByCategoryId, getAllBrands } from '#controllers/publicController.js'
import authRoutes from './authRoutes/authRoutes.js'
import { validatePromoCode } from '#controllers/promoCodeController.js'

const publicRoutes = Router()
publicRoutes.use('/auth', authRoutes)

publicRoutes.get('/getHomePageData', getHomePageData)
publicRoutes.get('/getAllProductCategories', getAllProductCategories)
publicRoutes.get('/getSingleProductDetails/:productId', getSingleProductDetails)
publicRoutes.get('/getAllProductsWithSearch', getAllProductsWithSearch)
publicRoutes.get('/getSingleProductBySlug/:slug', getSingleProductBySlug)
publicRoutes.get('/getAllProductsWithQuery', getAllProductsWithQuery)
publicRoutes.get('/getSubCategoriesByCategoryId/:categoryId', getSubCategoriesByCategoryId)
publicRoutes.get('/getAllBrands', getAllBrands)
publicRoutes.post('/validatePromoCode', validatePromoCode)

export default publicRoutes 