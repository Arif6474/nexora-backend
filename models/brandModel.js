import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const brandSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please provide a brand name'],
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
    serial: {
        type: Number,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export default model('Brand', brandSchema);
