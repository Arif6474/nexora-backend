import asyncHandler from 'express-async-handler'
import ProductColor from '#models/productColorModel.js'

import { archiveDocument, createDocument, deleteDocument, getAllDocuments, getDocumentsWithQuery, getSingleDocument, updateDocument } from '#crudServices/crudServices.js';

const getAllProductColors = asyncHandler(async (req, res) => {
    await getAllDocuments({ model: ProductColor, req, res });
})

const getSingleProductColor = asyncHandler(async (req, res) => {
    await getSingleDocument({ model: ProductColor, req, res });
})

const createProductColor = asyncHandler(async (req, res) => {
    await createDocument({ model: ProductColor, req, res });
})

const updateProductColor = asyncHandler(async (req, res) => {
    await updateDocument({ model: ProductColor, req, res });
});

const deleteProductColor = asyncHandler(async (req, res) => {
    await deleteDocument({ model: ProductColor, req, res });
});

const archiveProductColor = asyncHandler(async (req, res) => {
    await archiveDocument({ model: ProductColor, req, res });
});

const getProductColorWithQuery = asyncHandler(async (req, res) => {
    const filters = {
        product: req.query.product,
    };
    await getDocumentsWithQuery({ model: ProductColor, req, res, filters });
})

export {
    getAllProductColors,
    getSingleProductColor,
    createProductColor,
    updateProductColor,
    deleteProductColor,
    archiveProductColor,
    getProductColorWithQuery
}
