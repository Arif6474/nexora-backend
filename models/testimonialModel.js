import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const testimonialSchema = new Schema({
    author: {
        type: String,
        required: [true, 'Please provide an author name'],
        trim: true,
    },
    role: {
        type: String,
        default: 'Verified Buyer',
        trim: true,
    },
    content: {
        type: String,
        required: [true, 'Please provide testimonial content'],
        trim: true,
    },
    rating: {
        type: Number,
        default: 5,
        min: 1,
        max: 5,
    },
    image: {
        type: String,
        default: '',
    },
    size: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium',
    },
    serial: {
        type: Number,
        default: 1,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export default model('Testimonial', testimonialSchema);
