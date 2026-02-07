import { Router } from "express";
import {
    createProductSize,
    deleteProductSize,
    getAllProductSizes,
    updateProductSize
} from "#controllers/productSizeController.js";

const productSizeRoutes = Router();

productSizeRoutes.post('/', createProductSize);
productSizeRoutes.patch('/:id', updateProductSize);
productSizeRoutes.delete('/:id', deleteProductSize);
productSizeRoutes.get('/', getAllProductSizes);

export default productSizeRoutes;
