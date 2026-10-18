import { Router } from 'express';
import {
    getCustomersWithQuery,
    getSingleCustomer,
    archiveCustomer,
    updateCustomer,
    deleteCustomer
} from '#controllers/userControllers/customerController.js';

const router = Router();

router.get('/getCustomerWithQuery', getCustomersWithQuery);
router.get('/getSingleCustomer/:id', getSingleCustomer);
router.patch('/archiveCustomer/:id', archiveCustomer);
router.patch('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
