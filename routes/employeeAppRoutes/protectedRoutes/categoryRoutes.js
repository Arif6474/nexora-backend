import { Router } from 'express';
import {
    getAllCategories,
    getSingleCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    archiveCategory,
    getCategoryWithQuery,
} from '#controllers/categoryController.js';
import { upload } from '#utils/storage.js';

const router = Router();
router.get('/', getAllCategories);
router.post('/', upload.fields([{ name: 'image' }]), createCategory);
router.get('/getCategoryWithQuery', getCategoryWithQuery);
router.get('/getSingleCategory/:id', getSingleCategory);
router.patch('/:id', upload.fields([{ name: 'image' }]), updateCategory);
router.delete('/:id', deleteCategory);
router.patch('/archiveCategory/:id', archiveCategory);

export default router;