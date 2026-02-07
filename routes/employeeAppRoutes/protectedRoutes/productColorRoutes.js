import { Router } from "express";
import {
    createProductColor,
    deleteProductColor,
    getAllProductColors,
    updateProductColor
} from "#controllers/productColorController.js";

const productColorRoutes = Router();

productColorRoutes.post('/', createProductColor);
productColorRoutes.patch('/:id', updateProductColor);
productColorRoutes.delete('/:id', deleteProductColor);
productColorRoutes.get('/', getAllProductColors);

export default productColorRoutes;
