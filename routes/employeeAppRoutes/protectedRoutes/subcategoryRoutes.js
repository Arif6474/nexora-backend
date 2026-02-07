import { Router } from "express";
import {
    archiveSubcategory,
    createSubcategory,
    deleteSubcategory,
    getAllSubcategories,
    getSingleSubcategory,
    getSubcategoryWithQuery,
    updateSubcategory
} from "#controllers/subcategoryController.js";
import { upload } from '#utils/storage.js';

const subcategoryRoutes = Router();

subcategoryRoutes.post('/', upload.fields([{ name: 'image' }]), createSubcategory);
subcategoryRoutes.patch('/:id', upload.fields([{ name: 'image' }]), updateSubcategory);
subcategoryRoutes.delete('/:id', deleteSubcategory);

// Specialized routes (order often matters in Express, put specific ones before params if needed)
subcategoryRoutes.get('/getSingleSubcategory/:id', getSingleSubcategory);
subcategoryRoutes.patch('/archiveSubcategory/:id', archiveSubcategory);
subcategoryRoutes.get('/getSubcategoryWithQuery', getSubcategoryWithQuery);

// General get
subcategoryRoutes.get('/', getAllSubcategories);

export default subcategoryRoutes;
