import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const userSchema = Schema(
    {
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
        },
        address: {
            type: String,
        },
        bio: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        image: {
            type: String,
        },
        provider: {
            type: String,
        },
    },
    { timestamps: true }
);

export default model('Customer', userSchema);
