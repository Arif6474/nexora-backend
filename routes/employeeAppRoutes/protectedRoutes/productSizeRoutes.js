import { Router } from "express";
import {
    createProductSize,
    deleteProductSize,
    getAllProductSizes,
    updateProductSize,
    archiveProductSize,
    getProductSizeWithQuery,
    getSingleProductSize
} from "#controllers/productSizeController.js";

const productSizeRoutes = Router();

productSizeRoutes.post('/', createProductSize);
productSizeRoutes.patch('/:id', updateProductSize);
productSizeRoutes.delete('/:id', deleteProductSize);
productSizeRoutes.get('/', getAllProductSizes);
productSizeRoutes.get('/getProductSizeWithQuery', getProductSizeWithQuery);
productSizeRoutes.get('/getSingleProductSize/:id', getSingleProductSize);
productSizeRoutes.patch('/archiveProductSize/:id', archiveProductSize); 

export default productSizeRoutes;
