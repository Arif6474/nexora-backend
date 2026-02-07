import asyncHandler from 'express-async-handler'
import Category from '#models/categoryModel.js'

import { archiveDocument, createDocument, deleteDocument, getAllDocuments, getDocumentsWithQuery, getSingleDocument, updateDocument } from '#crudServices/crudServices.js';

const getAllCategories = asyncHandler(async (req, res) => {
    await getAllDocuments({ model: Category, req, res });
})

const getSingleCategory = asyncHandler(async (req, res) => {
    await getSingleDocument({ model: Category, req, res });
})

const createCategory = asyncHandler(async (req, res) => {
    await createDocument({ model: Category, req, res, folderName: 'images/category' });
})

const updateCategory = asyncHandler(async (req, res) => {
    await updateDocument({ model: Category, req, res, folderName: 'images/category' });

});

const deleteCategory = asyncHandler(async (req, res) => {
    await deleteDocument({ model: Category, req, res, fileFields: ['image',]});
});

const archiveCategory = asyncHandler(async (req, res) => {
    await archiveDocument({ model: Category, req, res });
});

const getCategoryWithQuery = asyncHandler(async (req, res) => {
    await getDocumentsWithQuery({ model: Category, req, res });
})

export {

    getAllCategories,
    getSingleCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    archiveCategory,
    getCategoryWithQuery
}       