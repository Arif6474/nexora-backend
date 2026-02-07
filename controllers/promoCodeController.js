import asyncHandler from 'express-async-handler'
import PromoCode from '#models/promoCodeModel.js'

import { archiveDocument, createDocument, deleteDocument, getAllDocuments, getSingleDocument, updateDocument } from '#crudServices/crudServices.js';

const getAllPromoCodes = asyncHandler(async (req, res) => {
    await getAllDocuments({ model: PromoCode, req, res });
})

const getSinglePromoCode = asyncHandler(async (req, res) => {
    await getSingleDocument({ model: PromoCode, req, res });
})

const createPromoCode = asyncHandler(async (req, res) => {
    await createDocument({ model: PromoCode, req, res });
})

const updatePromoCode = asyncHandler(async (req, res) => {
    await updateDocument({ model: PromoCode, req, res });
});

const deletePromoCode = asyncHandler(async (req, res) => {
    await deleteDocument({ model: PromoCode, req, res });
});

const archivePromoCode = asyncHandler(async (req, res) => {
    await archiveDocument({ model: PromoCode, req, res });
});

const validatePromoCode = asyncHandler(async (req, res) => {
    const { code } = req.body;

    const promoCode = await PromoCode.findOne({
        code: code.toUpperCase(),
        isActive: true,
        expiryDate: { $gte: new Date() }
    });

    if (!promoCode) {
        return res.status(404).json({ message: 'Invalid or expired promo code' });
    }

    if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
        return res.status(400).json({ message: 'Promo code usage limit reached' });
    }

    res.status(200).json({
        valid: true,
        promoCode: {
            _id: promoCode._id,
            code: promoCode.code,
            discountType: promoCode.discountType,
            discountValue: promoCode.discountValue
        }
    });
});

export {
    getAllPromoCodes,
    getSinglePromoCode,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    archivePromoCode,
    validatePromoCode
}
