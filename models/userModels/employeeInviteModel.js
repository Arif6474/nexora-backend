import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const employeeInviteSchema = new Schema({
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
    },
    token: {
        type: String,
        required: true,
    },
    invitedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export default model('EmployeeInvite', employeeInviteSchema);
