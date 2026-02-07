    import mongoose from 'mongoose';

    const { Schema, model } = mongoose;

    const sizeSchema = new Schema({
    itemType: {
        type: String,
        enum: [
        'Clothing', 
        'Shoes', 
        ],
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female'],
        required: true,
    },
    size: {
        type: String,
        required: true
    },
    sizeChart: {
        type: Map,
        of: String,
        required: true,
    },
    measurements: {
        type: Map,
        of: String,
        required: false,
    },
    serial: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    }, { timestamps: true });

    export default model('Size', sizeSchema);
