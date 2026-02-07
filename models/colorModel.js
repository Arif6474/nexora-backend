import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const colorSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    hexCode: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },

}, { timestamps: true });

export default model('Color', colorSchema);