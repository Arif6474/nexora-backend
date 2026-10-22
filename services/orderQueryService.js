import Order from '#models/order/orderModel.js';

/**
 * Privacy-preserving order query service.
 * Enforces customer authentication, explicit tracking requests, and customer ownership.
 */
class OrderQueryService {
    /**
     * Look up order by orderId or customer recent orders.
     * STRICT SECURITY: Requires a verified customerId from an authenticated JWT.
     * Will NOT fetch orders unless either an orderId is provided OR isExplicitTracking is true.
     */
    async getCustomerOrder({ customerId, orderId, isExplicitTracking = false } = {}) {
        if (!customerId) {
            return {
                authorized: false,
                requiresAuth: true,
                message: "Authentication required to access order information."
            };
        }

        const trimmedOrderId = (orderId && typeof orderId === 'string') ? orderId.trim().toUpperCase() : null;

        // If no specific order ID provided and not an explicit tracking request, do not return orders
        if (!trimmedOrderId && !isExplicitTracking) {
            return {
                authorized: true,
                found: false,
                message: "Please specify your Order ID (e.g. SM...) to track your order.",
                orders: []
            };
        }

        const query = { customer: customerId };
        if (trimmedOrderId) {
            query.orderId = trimmedOrderId;
        }

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(trimmedOrderId ? 1 : 3)
            .populate('products.product', 'title image price slug')
            .lean();

        if (!orders || orders.length === 0) {
            return {
                authorized: true,
                found: false,
                message: trimmedOrderId
                    ? `No order found with ID ${trimmedOrderId} in your account.`
                    : "You do not have any active orders in your account.",
                orders: []
            };
        }

        const sanitizedOrders = orders.map(order => ({
            id: order._id,
            orderId: order.orderId,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            totalAmount: order.totalAmount,
            discount: order.discount || 0,
            finalAmount: order.finalAmount,
            shippingMethod: order.shippingDetails?.shippingMethod || 'Standard',
            shippingCity: order.shippingDetails?.city,
            trackingNumber: order.shippingDetails?.trackingNumber || 'Pending assignment',
            createdAt: order.createdAt,
            itemCount: (order.products || []).reduce((acc, p) => acc + (p.quantity || 1), 0),
            items: (order.products || []).map(p => ({
                title: p.product?.title || 'Luxury Garment',
                quantity: p.quantity,
                unitPrice: p.unitPrice,
                totalPrice: p.totalPrice,
                color: p.color,
                size: p.size,
                image: p.product?.image
            }))
        }));

        return {
            authorized: true,
            found: true,
            orders: sanitizedOrders,
            primaryOrder: sanitizedOrders[0]
        };
    }
}

export const orderQueryService = new OrderQueryService();
export default orderQueryService;
