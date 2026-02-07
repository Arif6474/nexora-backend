import asyncHandler from 'express-async-handler'
import Color from '#models/colorModel.js'

import { archiveDocument, createDocument, deleteDocument, getAllDocuments, getDocumentsWithQuery, getSingleDocument, updateDocument } from '#crudServices/crudServices.js';

const getAllColors = asyncHandler(async (req, res) => {
    await getAllDocuments({ model: Color, req, res });
})

const getSingleColor = asyncHandler(async (req, res) => {
    await getSingleDocument({ model: Color, req, res });
})

const createColor = asyncHandler(async (req, res) => {
    await createDocument({ model: Color, req, res, folderName: 'images/color' });
})

const updateColor = asyncHandler(async (req, res) => {
    await updateDocument({ model: Color, req, res, folderName: 'images/color' });

});

const deleteColor = asyncHandler(async (req, res) => {
    await deleteDocument({ model: Color, req, res, fileFields: ['image',] });
});

const archiveColor = asyncHandler(async (req, res) => {
    await archiveDocument({ model: Color, req, res });
});

const getColorWithQuery = asyncHandler(async (req, res) => {
    await getDocumentsWithQuery({ model: Color, req, res });
})

export {

    getAllColors,
    getSingleColor,
    createColor,
    updateColor,
    deleteColor,
    archiveColor,
    getColorWithQuery
}