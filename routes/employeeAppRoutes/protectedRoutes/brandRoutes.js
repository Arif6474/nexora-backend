import { Router } from 'express';
import {
    getAllBrands,
    getSingleBrand,
    createBrand,
    updateBrand,
    deleteBrand,
    archiveBrand,
    getBrandWithQuery,
} from '#controllers/brandController.js';
import { upload } from '#utils/storage.js';

const router = Router();
router.get('/', getAllBrands);
router.post('/', upload.fields([{ name: 'image' }]), createBrand);
router.get('/getBrandWithQuery', getBrandWithQuery);
router.get('/getSingleBrand/:id', getSingleBrand);
router.patch('/:id', upload.fields([{ name: 'image' }]), updateBrand);
router.delete('/:id', deleteBrand);
router.patch('/archiveBrand/:id', archiveBrand);

export default router;
