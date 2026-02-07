import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const productColorSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    color: {
        type: Schema.Types.ObjectId,
        ref: 'Color',
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    serial: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

export default model('ProductColor', productColorSchema);
