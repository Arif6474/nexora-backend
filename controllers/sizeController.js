import asyncHandler from 'express-async-handler'
import Size from '#models/sizeModel.js'

import { archiveDocument, createDocument, deleteDocument, getAllDocuments, getDocumentsWithQuery, getSingleDocument, updateDocument } from '#crudServices/crudServices.js';

const getAllSizes = asyncHandler(async (req, res) => {
    await getAllDocuments({ model: Size, req, res });
})

const getSingleSize = asyncHandler(async (req, res) => {
    await getSingleDocument({ model: Size, req, res });
})

const createSize = asyncHandler(async (req, res) => {
    await createDocument({ model: Size, req, res, folderName: 'images/size' });
})

const updateSize = asyncHandler(async (req, res) => {
    await updateDocument({ model: Size, req, res, folderName: 'images/size' });

});

const deleteSize = asyncHandler(async (req, res) => {
    await deleteDocument({ model: Size, req, res, fileFields: ['image',]});
});

const archiveSize = asyncHandler(async (req, res) => {
    await archiveDocument({ model: Size, req, res });
});

const getSizeWithQuery = asyncHandler(async (req, res) => {
    await getDocumentsWithQuery({ model: Size, req, res });
})

export {

    getAllSizes,
    getSingleSize,
    createSize,
    updateSize,
    deleteSize,
    archiveSize,
    getSizeWithQuery
}