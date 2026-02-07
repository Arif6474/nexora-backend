import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const productSizeSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    size: {
        type: Schema.Types.ObjectId,
        ref: 'Size',
        required: true,
    },
    quantity: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export default model('ProductSize', productSizeSchema);
