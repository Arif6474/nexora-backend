import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const categorySchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please provide a category name'],
    },
    slug: {
        type: String,
        unique: true,
    },
    description: {
        type: String,
    },
    image: {
        type: String,
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

export default model('Category', categorySchema);
