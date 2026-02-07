import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const subcategorySchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please provide a subcategory name'],
    },
    slug: {
        type: String,
        unique: true,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Please provide a parent category'],
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

export default model('Subcategory', subcategorySchema);
