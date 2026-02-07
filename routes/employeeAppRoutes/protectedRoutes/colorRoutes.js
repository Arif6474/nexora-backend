import { Router } from 'express';
import {
    getAllColors,
    getSingleColor,
    createColor,
    updateColor,
    deleteColor,
    archiveColor,
    getColorWithQuery,
} from '#controllers/colorController.js';

const router = Router();
router.get('/', getAllColors);
router.post('/', createColor);
router.get('/getColorWithQuery', getColorWithQuery);
router.get('/getSingleColor/:id', getSingleColor);
router.patch('/:id', updateColor);
router.delete('/:id', deleteColor);
router.patch('/archiveColor/:id', archiveColor);

export default router;
