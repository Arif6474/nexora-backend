import { Router } from "express";
import {
    createProduct,
    deleteProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    getProductWithQuery,
    archiveProduct
} from "#controllers/productController.js";
import { upload } from '#utils/storage.js';

const productRoutes = Router();

productRoutes.post('/', upload.fields([{ name: 'image' }]), createProduct);
productRoutes.patch('/:id', upload.fields([{ name: 'image' }]), updateProduct);
productRoutes.delete('/:id', deleteProduct);
productRoutes.get('/', getAllProducts);
productRoutes.get('/getSingleProduct/:id', getSingleProduct);
productRoutes.get('/getProductWithQuery', getProductWithQuery);
productRoutes.patch('/archiveProduct/:id', archiveProduct);

export default productRoutes;
