import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const promoCodeSchema = new Schema({
    code: {
        type: String,
        required: [true, 'Promo code is required'],
        unique: true,
        uppercase: true,
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: [true, 'Discount type is required'],
    },
    discountValue: {
        type: Number,
        required: [true, 'Discount value is required'],
    },
    expiryDate: {
        type: Date,
        required: [true, 'Expiry date is required'],
    },
    usageLimit: {
        type: Number,
        default: null, // null means unlimited
    },
    usedCount: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export default model('PromoCode', promoCodeSchema);
