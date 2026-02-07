import { Router } from "express";
import {
    createProductImage,
    deleteProductImage,
    getAllProductImages,
    updateProductImage,
    archiveProductImage,
    getProductImageWithQuery,
    getSingleProductImage
} from "#controllers/productImageController.js";
import { upload } from '#utils/storage.js';

const productImageRoutes = Router();

productImageRoutes.post('/', upload.fields([{ name: 'image' }]), createProductImage);
productImageRoutes.patch('/:id', upload.fields([{ name: 'image' }]), updateProductImage);
productImageRoutes.delete('/:id', deleteProductImage);
productImageRoutes.get('/', getAllProductImages);
productImageRoutes.get('/getProductImageWithQuery', getProductImageWithQuery);
productImageRoutes.get('/getSingleProductImage/:id', getSingleProductImage);
productImageRoutes.patch('/archiveProductImage/:id', archiveProductImage);

export default productImageRoutes;
