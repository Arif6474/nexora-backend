import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const messageSchema = new Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    intent: {
        type: String,
        default: null,
    },
    language: {
        type: Object,
        default: null,
    },
    products: {
        type: Array,
        default: [],
    },
    order: {
        type: Object,
        default: null,
    },
    requiresAuth: {
        type: Boolean,
        default: false,
    },
    verifiedSource: {
        type: String,
        default: null,
    },
    quickReplies: {
        type: [String],
        default: [],
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
}, { _id: true });

const conversationSchema = new Schema({
    sessionId: {
        type: String,
        required: true,
        index: true,
    },
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        default: null,
        index: true,
    },
    title: {
        type: String,
        default: 'New Consultation',
    },
    messages: [messageSchema],
    isActive: {
        type: Boolean,
        default: true,
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
        index: true,
    }
}, { timestamps: true });

conversationSchema.index({ customer: 1, lastMessageAt: -1 });
conversationSchema.index({ sessionId: 1, customer: 1 });

export default model('Conversation', conversationSchema);
