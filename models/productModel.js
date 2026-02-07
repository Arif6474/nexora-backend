import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const productSchema = new Schema({
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Please provide a category'],
    },
    subCategory: {
        type: Schema.Types.ObjectId,
        ref: 'SubCategory',
    },
    sku: {
        type: String,
        unique: true,
    },
    title: {
        type: String,
    },
    slug: {
        type: String,
        unique: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    quantity: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
    },
    image: {
        type: String,
        required: [true, 'Please provide a card image'],
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    serial: {
        type: Number,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export default model('Product', productSchema);
