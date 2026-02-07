import asyncHandler from 'express-async-handler'
import Product from '#models/productModel.js'

import { archiveDocument, createDocument, deleteDocument, getAllDocuments, getDocumentsWithQuery, getSingleDocument, updateDocument } from '#crudServices/crudServices.js';

const getAllProducts = asyncHandler(async (req, res) => {
    await getAllDocuments({ model: Product, req, res });
})

const getSingleProduct = asyncHandler(async (req, res) => {
    await getSingleDocument({ model: Product, req, res });
})

const createProduct = asyncHandler(async (req, res) => {
    await createDocument({ model: Product, req, res, folderName: 'images/product', fileFields: ['image'] });
})

const updateProduct = asyncHandler(async (req, res) => {
    await updateDocument({ model: Product, req, res, folderName: 'images/product', fileFields: ['image'] });
});

const deleteProduct = asyncHandler(async (req, res) => {
    await deleteDocument({ model: Product, req, res, fileFields: ['image',] });
});

const archiveProduct = asyncHandler(async (req, res) => {
    await archiveDocument({ model: Product, req, res });
});

const getProductWithQuery = asyncHandler(async (req, res) => {
    const filters = {
        category: req.query.category,
        subCategory: req.query.subCategory,
    };
    await getDocumentsWithQuery({ model: Product, req, res, filters });
})

export {
    getAllProducts,
    getSingleProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    archiveProduct,
    getProductWithQuery
}
