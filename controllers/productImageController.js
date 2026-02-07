import asyncHandler from 'express-async-handler'
import ProductImage from '#models/productImageModel.js'

import { archiveDocument, createDocument, deleteDocument, getAllDocuments, getDocumentsWithQuery, getSingleDocument, updateDocument } from '#crudServices/crudServices.js';

const getAllProductImages = asyncHandler(async (req, res) => {
    await getAllDocuments({ model: ProductImage, req, res });
})

const getSingleProductImage = asyncHandler(async (req, res) => {
    await getSingleDocument({ model: ProductImage, req, res });
})

const createProductImage = asyncHandler(async (req, res) => {
    await createDocument({ model: ProductImage, req, res, folderName: 'images/productImages' });
})

const updateProductImage = asyncHandler(async (req, res) => {
    await updateDocument({ model: ProductImage, req, res, folderName: 'images/productImages' });
});

const deleteProductImage = asyncHandler(async (req, res) => {
    await deleteDocument({ model: ProductImage, req, res, fileFields: ['image'] });
});

const archiveProductImage = asyncHandler(async (req, res) => {
    await archiveDocument({ model: ProductImage, req, res });
});

const getProductImageWithQuery = asyncHandler(async (req, res) => {
    const filters = {
        product: req.query.product,
    };
    await getDocumentsWithQuery({ model: ProductImage, req, res, filters });
})

export {
    getAllProductImages,
    getSingleProductImage,
    createProductImage,
    updateProductImage,
    deleteProductImage,
    archiveProductImage,
    getProductImageWithQuery
}
