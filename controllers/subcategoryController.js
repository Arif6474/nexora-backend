import asyncHandler from 'express-async-handler'
import Subcategory from '#models/subcategoryModel.js'

import { archiveDocument, createDocument, deleteDocument, getAllDocuments, getDocumentsWithQuery, getSingleDocument, updateDocument } from '#crudServices/crudServices.js';

const getAllSubcategories = asyncHandler(async (req, res) => {
    await getAllDocuments({ model: Subcategory, req, res });
})

const getSingleSubcategory = asyncHandler(async (req, res) => {
    await getSingleDocument({ model: Subcategory, req, res });
})

const createSubcategory = asyncHandler(async (req, res) => {
    await createDocument({ model: Subcategory, req, res, folderName: 'images/subcategory' });
})

const updateSubcategory = asyncHandler(async (req, res) => {
    await updateDocument({ model: Subcategory, req, res, folderName: 'images/subcategory' });

});

const deleteSubcategory = asyncHandler(async (req, res) => {
    await deleteDocument({ model: Subcategory, req, res, fileFields: ['image',] });
});

const archiveSubcategory = asyncHandler(async (req, res) => {
    await archiveDocument({ model: Subcategory, req, res });
});

const getSubcategoryWithQuery = asyncHandler(async (req, res) => {
    await getDocumentsWithQuery({ model: Subcategory, req, res });
})

export {
    getAllSubcategories,
    getSingleSubcategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    archiveSubcategory,
    getSubcategoryWithQuery
}
