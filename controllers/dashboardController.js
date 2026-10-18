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
            const product = await Product.findById(item._id).select('title image price slug sku');
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

    const filters = {
        orderStatus: 'Delivered',
        isActive: { $ne: false },
    };

    if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) {
            if (typeof startDate === 'string' && startDate.length === 10) {
                const [y, m, d] = startDate.split('-').map(Number);
                filters.createdAt.$gte = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
            } else {
                filters.createdAt.$gte = new Date(startDate);
            }
        }
        if (endDate) {
            if (typeof endDate === 'string' && endDate.length === 10) {
                const [y, m, d] = endDate.split('-').map(Number);
                filters.createdAt.$lte = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
            } else {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filters.createdAt.$lte = end;
            }
        }
    }

    let groupFormat;
    switch (groupBy) {
        case 'year':
            groupFormat = '%Y-%m'; // Monthly breakdown for the year
            break;
        case 'month':
            groupFormat = '%Y-%m-%d'; // Daily breakdown for the month
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
                deliveredCount: { $sum: 1 },
                totalItems: { $sum: { $size: { $ifNull: ['$products', []] } } },
            },
        },
        { $sort: { _id: -1 } },
    ]);

    // Fetch individual delivered orders for the period
    const orders = await Order.find(filters)
        .populate('customer', 'name email phone')
        .populate('products.product', 'title price')
        .sort({ createdAt: -1 })
        .lean();

    const summaryAgg = await Order.aggregate([
        { $match: filters },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSales: { $sum: '$finalAmount' },
                totalDiscount: { $sum: '$discount' },
                totalItems: { $sum: { $size: { $ifNull: ['$products', []] } } },
            },
        },
    ]);

    const summary = summaryAgg[0] || {
        totalOrders: 0,
        totalSales: 0,
        totalDiscount: 0,
        totalItems: 0,
    };

    res.status(200).json({
        report,
        orders,
        summary,
    });
});
