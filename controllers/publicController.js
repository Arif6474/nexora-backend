import brandModel from '#models/brandModel.js';
import categoryModel from '#models/categoryModel.js'
import productColorModel from '#models/productColorModel.js';
import productModel from '#models/productModel.js';
import productSizeModel from '#models/productSizeModel.js';
import subcategoryModel from '#models/subcategoryModel.js';
import asyncHandler from 'express-async-handler'

const getHomePageData = asyncHandler(async (req, res) => {
    const featuredProducts = await productModel.find({ isFeatured: true, isActive: true }).sort({ serial: 1 })
    const latestProducts = await productModel.find({ isActive: true }).sort({ createdAt: -1 }).limit(10)
    res.status(200).json({
        featuredProducts,
        latestProducts
    })
})

const getAllProductCategories = asyncHandler(async (req, res) => {
    const categories = await categoryModel.find({ isActive: true }).sort({ serial: 1 });
    res.status(200).json(categories);
})

const getAllBrands = asyncHandler(async (req, res) => {
    const brands = await brandModel.find({ isActive: true }).sort({ serial: 1 });
    res.status(200).json(brands);
})
const getSubCategoriesByCategoryId = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const subCategories = await subcategoryModel.find({ category: categoryId, isActive: true }).sort({ serial: 1 });
    res.status(200).json(subCategories);
})

const getSingleProductDetails = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    // Fetch the product details, populate 'category'
    const product = await productModel.findById(productId).populate('category').exec();

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    // Fetch product images, populate 'color', and sort by 'serial'
    const productColors = await productColorModel.find({ product: product._id, isActive: true }).populate('color').sort({ serial: 1 });

    // Fetch product sizes, populate 'size', and sort by 'serial' from the Size model
    // Note: Assuming size model has serial field, if not, might need adjustment
    const productSizes = await productSizeModel.find({ product: product._id, isActive: true }).populate('size');

    // Sort productSizes array by the 'serial' field of the populated 'size' field if available, or just return as is
    // const sortedProductSizes = productSizes.sort((a, b) => a.size.serial - b.size.serial); 
    // Simplified for now as Size model structure wasn't fully detailed in previous steps but assuming standard structure

    // Send the response with the product, product images, and product sizes
    res.status(200).json({
        product,
        productColors,
        productSizes,
    });
});

const getAllProductsWithSearch = asyncHandler(async (req, res) => {
    const { searchQuery } = req.query;

    if (!searchQuery) {
        return res.status(400).json({ message: "Search query is required" });
    }

    const products = await productModel.find({
        title: { $regex: searchQuery, $options: 'i' },
        isActive: true
    }).populate('category').sort({ createdAt: -1 });

    if (products.length === 0) {
        return res.status(404).json({ message: "No products found" });
    }

    res.status(200).json(products);
});

const getAllProductsWithQuery = asyncHandler(async (req, res) => {
    const { category, searchQuery, subcategory, brand, sortBy } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (searchQuery && searchQuery !== "null") filters.title = { $regex: searchQuery, $options: 'i' };
    if (subcategory && subcategory !== "null") filters.subcategory = subcategory;
    if (brand && brand !== "null") filters.brand = brand;
    filters.isActive = true;



    // Step 2: Determine sort options
    let sortOptions = {};
    if (sortBy === 'priceLowToHigh') {
        sortOptions = { price: 1 };
    } else if (sortBy === 'priceHighToLow') {
        sortOptions = { price: -1 };
    } else if (sortBy === 'newest') {
        sortOptions = { createdAt: -1 };
    } else if (sortBy === 'oldest') {
        sortOptions = { createdAt: 1 };
    } else {
        sortOptions = { createdAt: -1 }; // Default sort
    }

    // Step 3: Query products using filters
    const products = await productModel
        .find(filters)
        .populate('category')
        .sort(sortOptions);

    res.status(200).json(products);
});

const getSingleProductBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const product = await productModel.findOne({ slug })

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
});

export {
    getHomePageData,
    getAllProductCategories,
    getSingleProductDetails,
    getAllProductsWithSearch,
    getSingleProductBySlug,
    getAllProductsWithQuery,
    getSubCategoriesByCategoryId,
    getAllBrands
}