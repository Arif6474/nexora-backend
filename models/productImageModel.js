import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const productImageSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    image: {
        type: String,
        required: [true, 'Image is required'],
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

export default model('ProductImage', productImageSchema);
