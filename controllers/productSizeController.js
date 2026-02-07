import asyncHandler from 'express-async-handler'
import ProductSize from '#models/productSizeModel.js'

import { archiveDocument, createDocument, deleteDocument, getAllDocuments, getSingleDocument, updateDocument } from '#crudServices/crudServices.js';

const getAllProductSizes = asyncHandler(async (req, res) => {
    await getAllDocuments({ model: ProductSize, req, res });
})

const getSingleProductSize = asyncHandler(async (req, res) => {
    await getSingleDocument({ model: ProductSize, req, res });
})

const createProductSize = asyncHandler(async (req, res) => {
    await createDocument({ model: ProductSize, req, res });
})

const updateProductSize = asyncHandler(async (req, res) => {
    await updateDocument({ model: ProductSize, req, res });
});

const deleteProductSize = asyncHandler(async (req, res) => {
    await deleteDocument({ model: ProductSize, req, res });
});

const archiveProductSize = asyncHandler(async (req, res) => {
    await archiveDocument({ model: ProductSize, req, res });
});

export {
    getAllProductSizes,
    getSingleProductSize,
    createProductSize,
    updateProductSize,
    deleteProductSize,
    archiveProductSize
}
