import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const employeeSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
    },
    level: {
        type: String,
        enum: ['superAdmin', 'admin', 'employee'],
        default: 'employee',
    },
    image: {
        type: String,
    },
    isRegistered: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export default model('Employee', employeeSchema);
