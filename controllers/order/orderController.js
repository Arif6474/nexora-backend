import asyncHandler from 'express-async-handler'
import Order from '#models/order/orderModel.js';
import Product from '#models/productModel.js';
import Customer from '#models/userModels/customerModel.js';
import PromoCode from '#models/promoCodeModel.js';
import { generateCustomOrderId } from '#utils/orderId.js';
import { createConsignmentAutoAWB } from './shopifyDelivery.js';
import { getDocumentsWithQuery } from '#crudServices/crudServices.js';

// Create a new order
export const createOrder = async (req, res) => {
    try {
        const { totalAmount, paymentMethod, shippingDetails, products, promoCodeId } = req.body;
        const customerId = req.customer._id;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(400).json({ message: 'Customer not found' });
        }

        // Validate products
        for (const item of products) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(400).json({ message: `Product with id ${item.product} not found` });
            }
        }

        let finalAmount = totalAmount;
        let discount = 0;
        let promoCodeDoc = null;

        // Apply promo code if provided
        if (promoCodeId) {
            promoCodeDoc = await PromoCode.findOne({
                _id: promoCodeId,
                isActive: true,
                expiryDate: { $gte: new Date() }
            });

            if (promoCodeDoc) {
                if (promoCodeDoc.usageLimit && promoCodeDoc.usedCount >= promoCodeDoc.usageLimit) {
                    return res.status(400).json({ message: 'Promo code usage limit reached' });
                }

                if (promoCodeDoc.discountType === 'percentage') {
                    discount = (totalAmount * promoCodeDoc.discountValue) / 100;
                } else {
                    discount = promoCodeDoc.discountValue;
                }

                finalAmount = totalAmount - discount;
                if (finalAmount < 0) finalAmount = 0;

                // Increment usage count
                promoCodeDoc.usedCount += 1;
                await promoCodeDoc.save();
            }
        }

        // Create a new order document
        const newOrder = new Order({
            orderId: generateCustomOrderId(), // Generate a unique order ID
            customer: customerId,
            totalAmount,
            discount,
            finalAmount,
            promoCode: promoCodeDoc ? promoCodeDoc._id : undefined,
            orderStatus: 'Pending', // Default status
            paymentStatus: 'Pending', // Default status
            paymentMethod,
            shippingDetails,
            products: products.map(item => ({
                product: item.product,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                variant: item.variant
            }))
        });

        // Save the new order
        await newOrder.save();

        return res.status(201).json({ message: 'Order created successfully', order: newOrder });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Get all orders (optionally filtered by customer or order status)
export const getOrders = async (req, res) => {
    try {
        const { customerId, orderStatus } = req.query;

        const filter = {};

        if (customerId) filter.customer = customerId;
        if (orderStatus) filter.orderStatus = orderStatus;

        const orders = await Order.find(filter)
            .populate('customer', 'name email')  // Populate customer details
            .populate('products.product', 'title price');  // Populate product details

        return res.status(200).json({ orders });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Get a single order by ID
export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('customer', 'name email')
            .populate('products.product', 'title price')
            .populate('promoCode', 'code discountType discountValue');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        return res.status(200).json({ order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderStatus, paymentStatus } = req.body;

        // Ensure valid status values
        const validOrderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Completed'];
        const validPaymentStatuses = ['Pending', 'Completed', 'Failed'];

        if (orderStatus && !validOrderStatuses.includes(orderStatus)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }

        if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({ message: 'Invalid payment status' });
        }

        const order = await Order.findByIdAndUpdate(orderId, {
            orderStatus: orderStatus || undefined,
            paymentStatus: paymentStatus || undefined
        }, { new: true });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        return res.status(200).json({ message: 'Order status updated successfully', order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Delete an order
export const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findByIdAndDelete(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        return res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const getMyAllOrders = async (req, res) => {
    try {
        const customerId = req.customer._id;

        const orders = await Order.find({ customer: customerId })
            .populate('products.product');

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: 'No orders found for this customer' });
        }

        return res.status(200).json({ orders });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

export const getMyOrderById = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const customerId = req.customer._id;

        const order = await Order.findOne({ _id: orderId, customer: customerId })
            .populate('products.product')
            .populate('promoCode');

        if (!order) {
            return res.status(404).json({ message: 'Order not found for this customer' });
        }

        return res.status(200).json({ order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const getOrderCountByStatus = async (req, res) => {
    try {
        // Aggregation to get order counts by status
        const orderCounts = await Order.aggregate([
            {
                $group: {
                    _id: '$orderStatus', // Group by order status
                    count: { $sum: 1 } // Count the number of orders per status
                }
            }
        ]);

        // Prepare the result object with order statuses as keys and counts as values
        const result = orderCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        // Return the result
        return res.status(200).json({ orderCounts: result });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const getOrdersByStatus = async (req, res) => {
    try {
        const { orderStatus } = req.params;

        const orders = await Order.find({ orderStatus })
            .populate('customer')
            .populate('products.product')
            .sort({ createdAt: -1 }); // Sort by creation date, most recent first

        return res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

export const updateOrderStatusById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderStatus } = req.body;

        // Validate status values
        const validOrderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Completed'];

        if (orderStatus && !validOrderStatuses.includes(orderStatus)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }

        const order = await Order.findByIdAndUpdate(orderId, {
            orderStatus: orderStatus || undefined
        }, { new: true });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        return res.status(200).json({ message: 'Order status updated successfully', order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const getSingleOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('customer', '-password')
            .populate('products.product')
            .populate('promoCode');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        return res.status(200).json({ order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const forwardOrderToShopifyDelivery = async (req, res) => {

    const { orderId } = req.params;

    const order = await Order.findById(orderId)

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus !== 'Processing' && order.orderStatus !== 'Pending') {
        return res.status(400).json({ message: 'Only orders with status "Processing" or "Pending" can be forwarded to delivery.' });
    }
    console.log("order in forwardOrderToShopifyDelivery", order);

    const { awb, labelPdf } = await createConsignmentAutoAWB(orderId);

    res.status(200).json({ message: 'Order forwarded to Shopify Delivery successfully', awb, labelPdf });

}

export const getOrdersWithQuery = asyncHandler(async (req, res) => {
    const filters = {
        customer: req.query.customer,
        orderStatus: req.query.orderStatus,
    };
    await getDocumentsWithQuery({ model: Order, req, res, filters });
})
