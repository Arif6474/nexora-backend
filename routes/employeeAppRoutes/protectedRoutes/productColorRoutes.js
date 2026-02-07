import { Router } from "express";
import {
    createProductColor,
    deleteProductColor,
    getAllProductColors,
    updateProductColor,
    archiveProductColor,
    getProductColorWithQuery,
    getSingleProductColor
} from "#controllers/productColorController.js";

const productColorRoutes = Router();

productColorRoutes.post('/', createProductColor);
productColorRoutes.patch('/:id', updateProductColor);
productColorRoutes.delete('/:id', deleteProductColor);
productColorRoutes.get('/', getAllProductColors);
productColorRoutes.get('/getProductColorWithQuery', getProductColorWithQuery);
productColorRoutes.get('/getSingleProductColor/:id', getSingleProductColor);
productColorRoutes.patch('/archiveProductColor/:id', archiveProductColor);

export default productColorRoutes;
