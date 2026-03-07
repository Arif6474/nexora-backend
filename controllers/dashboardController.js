import asyncHandler from 'express-async-handler';
import Order from '#models/order/orderModel.js';
import Product from '#models/productModel.js';
import Customer from '#models/userModels/customerModel.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
    // 1. Total Sales (Delivered orders)
    const salesData = await Order.aggregate([
        { $match: { orderStatus: 'Delivered' } },
        {
            $group: {
                _id: null,
                total: { $sum: '$finalAmount' }
            }
        }
    ]);
    const totalSales = salesData.length > 0 ? salesData[0].total : 0;

    // 2. Total Pending Orders
    const totalPendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });
    const totalDeliveredOrders = await Order.countDocuments({ orderStatus: 'Delivered' });

    // 3. Total Active Products
    const totalActiveProducts = await Product.countDocuments({ isActive: true });

    // 4. Total Customers
    const totalCustomers = await Customer.countDocuments();

    // 5. Top 10 Selling Products
    const topSellingData = await Order.aggregate([
        { $unwind: '$products' },
        {
            $group: {
                _id: '$products.product',
                totalSold: { $sum: '$products.quantity' }
            }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 }
    ]);

    // Populate product details for top sellers
    const topSellingProducts = await Promise.all(
        topSellingData.map(async (item) => {
            const product = await Product.findById(item._id).select('title image price slug');
            return {
                ...product?.toObject(),
                totalSold: item.totalSold
            };
        })
    );

    res.status(200).json({
        stats: {
            totalSales,
            totalPendingOrders,
            totalDeliveredOrders,
            totalActiveProducts,
            totalCustomers
        },
        topSellingProducts
    });
});

export const getOrdersReport = asyncHandler(async (req, res) => {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const filters = {};
    if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filters.createdAt.$lte = end;
        }
    }

    let groupFormat;
    switch (groupBy) {
        case 'month':
            groupFormat = '%Y-%m';
            break;
        case 'week':
            groupFormat = '%Y-%U';
            break;
        case 'day':
        default:
            groupFormat = '%Y-%m-%d';
    }

    const report = await Order.aggregate([
        { $match: filters },
        {
            $group: {
                _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
                totalOrders: { $sum: 1 },
                totalSales: { $sum: '$finalAmount' },
                totalDiscount: { $sum: '$discount' },
                deliveredCount: {
                    $sum: { $cond: [{ $eq: ['$orderStatus', 'Delivered'] }, 1, 0] }
                },
                pendingCount: {
                    $sum: { $cond: [{ $eq: ['$orderStatus', 'Pending'] }, 1, 0] }
                }
            }
        },
        { $sort: { _id: -1 } }
    ]);

    res.status(200).json({ report });
});
