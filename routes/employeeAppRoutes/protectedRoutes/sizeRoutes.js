import { Router } from 'express';
import {
    getAllSizes,
    getSingleSize,
    createSize,
    updateSize,
    deleteSize,
    archiveSize,
    getSizeWithQuery,
} from '#controllers/sizeController.js';

const router = Router();
router.get('/', getAllSizes);
router.post('/', createSize);
router.get('/getSizeWithQuery', getSizeWithQuery);
router.get('/getSingleSize/:id', getSingleSize);
router.patch('/:id', updateSize);
router.delete('/:id', deleteSize);
router.patch('/archiveSize/:id', archiveSize);

export default router;
