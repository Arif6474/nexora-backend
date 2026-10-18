import asyncHandler from 'express-async-handler';
import Testimonial from '#models/testimonialModel.js';
import {
    archiveDocument,
    createDocument,
    deleteDocument,
    getAllDocuments,
    getDocumentsWithQuery,
    getSingleDocument,
    updateDocument
} from '#crudServices/crudServices.js';

const getAllTestimonials = asyncHandler(async (req, res) => {
    await getAllDocuments({ model: Testimonial, req, res });
});

const getSingleTestimonial = asyncHandler(async (req, res) => {
    await getSingleDocument({ model: Testimonial, req, res });
});

const createTestimonial = asyncHandler(async (req, res) => {
    await createDocument({ model: Testimonial, req, res, folderName: 'images/testimonials' });
});

const updateTestimonial = asyncHandler(async (req, res) => {
    await updateDocument({ model: Testimonial, req, res, folderName: 'images/testimonials' });
});

const deleteTestimonial = asyncHandler(async (req, res) => {
    await deleteDocument({ model: Testimonial, req, res, fileFields: ['image'] });
});

const archiveTestimonial = asyncHandler(async (req, res) => {
    await archiveDocument({ model: Testimonial, req, res });
});

const getTestimonialWithQuery = asyncHandler(async (req, res) => {
    await getDocumentsWithQuery({ model: Testimonial, req, res });
});

export {
    getAllTestimonials,
    getSingleTestimonial,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    archiveTestimonial,
    getTestimonialWithQuery
};
