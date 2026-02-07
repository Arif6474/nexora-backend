import mongoose from 'mongoose';
const { model, Schema } = mongoose;

const orderSchema = Schema({
  orderId: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  totalAmount: { type: Number, required: true },
  promoCode: { type: Schema.Types.ObjectId, ref: 'PromoCode' },
  discount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Completed'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cod'],
    required: true
  },
  paymentDetails: {
    transactionId: { type: String },
    paymentDate: { type: Date },
    amountPaid: { type: Number }
  },
  shippingDetails: {
    address: { type: String, required: true },
    shippingMethod: { type: String, enum: ['Standard', 'Express'], required: true },
    trackingNumber: { type: String },
    recipientName: { type: String },
    email: { type: String },
    phone: { type: String },
    city: { type: String },
    area: { type: String },
    country: { type: String },
  },
  isActive: { type: Boolean, default: true },
  products: [
    {
      product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      totalPrice: { type: Number, required: true },
      variant: { type: String },
    }
  ]
}, { timestamps: true });

export default model('Order', orderSchema);
