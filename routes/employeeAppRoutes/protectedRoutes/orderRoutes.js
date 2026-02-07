import { Router } from "express";
import {
    deleteOrder,
    getOrders,
    getOrderById,
    updateOrderStatus
} from "#controllers/order/orderController.js";

const orderRoutes = Router();

orderRoutes.get('/', getOrders);
orderRoutes.get('/:orderId', getOrderById);
orderRoutes.patch('/:orderId', updateOrderStatus);
orderRoutes.delete('/:orderId', deleteOrder);

export default orderRoutes;
