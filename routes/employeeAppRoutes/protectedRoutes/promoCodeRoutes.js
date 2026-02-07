import { Router } from "express";
import {
    createPromoCode,
    deletePromoCode,
    getAllPromoCodes,
    updatePromoCode
} from "#controllers/promoCodeController.js";

const promoCodeRoutes = Router();

promoCodeRoutes.post('/', createPromoCode);
promoCodeRoutes.patch('/:id', updatePromoCode);
promoCodeRoutes.delete('/:id', deletePromoCode);
promoCodeRoutes.get('/', getAllPromoCodes);

export default promoCodeRoutes;
