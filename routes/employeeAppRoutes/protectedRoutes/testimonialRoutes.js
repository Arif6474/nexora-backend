import { Router } from 'express';
import {
    getAllTestimonials,
    getSingleTestimonial,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    archiveTestimonial,
    getTestimonialWithQuery,
} from '#controllers/testimonialController.js';
import { upload } from '#utils/storage.js';

const router = Router();

router.get('/', getAllTestimonials);
router.post('/', upload.fields([{ name: 'image' }]), createTestimonial);
router.get('/getTestimonialWithQuery', getTestimonialWithQuery);
router.get('/getSingleTestimonial/:id', getSingleTestimonial);
router.patch('/:id', upload.fields([{ name: 'image' }]), updateTestimonial);
router.delete('/:id', deleteTestimonial);
router.patch('/archiveTestimonial/:id', archiveTestimonial);

export default router;
