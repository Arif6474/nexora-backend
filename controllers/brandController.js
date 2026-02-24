import asyncHandler from 'express-async-handler'
import Brand from '#models/brandModel.js'

import { archiveDocument, createDocument, deleteDocument, getAllDocuments, getDocumentsWithQuery, getSingleDocument, updateDocument } from '#crudServices/crudServices.js';

const getAllBrands = asyncHandler(async (req, res) => {
    await getAllDocuments({ model: Brand, req, res });
})

const getSingleBrand = asyncHandler(async (req, res) => {
    await getSingleDocument({ model: Brand, req, res });
})

const createBrand = asyncHandler(async (req, res) => {
    await createDocument({ model: Brand, req, res, folderName: 'images/brand' });
})

const updateBrand = asyncHandler(async (req, res) => {
    await updateDocument({ model: Brand, req, res, folderName: 'images/brand' });
});

const deleteBrand = asyncHandler(async (req, res) => {
    await deleteDocument({ model: Brand, req, res, fileFields: ['image'] });
});

const archiveBrand = asyncHandler(async (req, res) => {
    await archiveDocument({ model: Brand, req, res });
});

const getBrandWithQuery = asyncHandler(async (req, res) => {
    await getDocumentsWithQuery({ model: Brand, req, res });
})

export {
    getAllBrands,
    getSingleBrand,
    createBrand,
    updateBrand,
    deleteBrand,
    archiveBrand,
    getBrandWithQuery
}
