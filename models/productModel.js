import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const productSchema = new Schema({
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Please provide a category'],
    },
    subcategory: {
        type: Schema.Types.ObjectId,
        ref: 'Subcategory',
    },
    brand: {
        type: Schema.Types.ObjectId,
        ref: 'Brand',
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
    gender: {
        type: String,
        enum: ['Men', 'Women', 'Unisex', 'Kids'],
        default: 'Unisex',
    },
    discount: {
        type: Number,
        default: 0,
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
