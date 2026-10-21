import mongoose from 'mongoose';
import brandModel from '#models/brandModel.js';
import categoryModel from '#models/categoryModel.js'
import productColorModel from '#models/productColorModel.js';
import productImageModel from '#models/productImageModel.js';
import productModel from '#models/productModel.js';
import productSizeModel from '#models/productSizeModel.js';
import subcategoryModel from '#models/subcategoryModel.js';
import testimonialModel from '#models/testimonialModel.js';
import asyncHandler from 'express-async-handler'

const getHomePageData = asyncHandler(async (req, res) => {
    const featuredProducts = await productModel.find({ isFeatured: true, isActive: true }).sort({ serial: 1 })
    const latestProducts = await productModel.find({ isActive: true }).sort({ createdAt: -1 }).limit(10)
    const testimonials = await testimonialModel.find({ isActive: true }).sort({ serial: 1, createdAt: -1 })
    res.status(200).json({
        featuredProducts,
        latestProducts,
        testimonials
    })
})

const getAllTestimonials = asyncHandler(async (req, res) => {
    const testimonials = await testimonialModel.find({ isActive: true }).sort({ serial: 1, createdAt: -1 })
    res.status(200).json(testimonials)
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
    const sortedProductSizes = productSizes.sort((a, b) => a.size.serial - b.size.serial);
    const productImages = await productImageModel.find({ product: product._id, isActive: true }).sort({ serial: 1 });
    // Sort productSizes array by the 'serial' field of the populated 'size' field if available, or just return as is
    // const sortedProductSizes = productSizes.sort((a, b) => a.size.serial - b.size.serial); 
    // Simplified for now as Size model structure wasn't fully detailed in previous steps but assuming standard structure

    // Send the response with the product, product images, and product sizes
    res.status(200).json({
        product,
        productColors,
        productSizes: sortedProductSizes,
        productImages
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
    const { category, searchQuery, search, subcategory, brand, gender, sortBy } = req.query;

    const filters = {};

    // 1. Category filter: support ObjectId, slug, or name
    if (category && category !== "null" && category.trim() !== "") {
        if (mongoose.Types.ObjectId.isValid(category)) {
            filters.category = category;
        } else {
            const matchedCategory = await categoryModel.findOne({
                $or: [
                    { slug: category },
                    { name: { $regex: `^${category}$`, $options: 'i' } },
                    { name: { $regex: category, $options: 'i' } }
                ]
            });
            if (matchedCategory) {
                filters.category = matchedCategory._id;
            }
        }
    }

    // 2. Subcategory filter: support ObjectId, slug, or name
    if (subcategory && subcategory !== "null" && subcategory.trim() !== "") {
        if (mongoose.Types.ObjectId.isValid(subcategory)) {
            filters.subcategory = subcategory;
        } else {
            const matchedSubcategory = await subcategoryModel.findOne({
                $or: [
                    { slug: subcategory },
                    { name: { $regex: subcategory, $options: 'i' } }
                ]
            });
            if (matchedSubcategory) {
                filters.subcategory = matchedSubcategory._id;
            }
        }
    }

    // 3. Brand filter: support ObjectId, slug, or name
    if (brand && brand !== "null" && brand.trim() !== "") {
        if (mongoose.Types.ObjectId.isValid(brand)) {
            filters.brand = brand;
        } else {
            const matchedBrand = await brandModel.findOne({
                $or: [
                    { slug: brand },
                    { name: { $regex: brand, $options: 'i' } }
                ]
            });
            if (matchedBrand) {
                filters.brand = matchedBrand._id;
            }
        }
    }

    // 4. Gender filter
    const effectiveGender = (gender || "").trim();
    if (effectiveGender && effectiveGender !== "null") {
        const cleanGender = effectiveGender.toLowerCase();
        if (cleanGender === 'women' || cleanGender === 'woman') {
            filters.gender = { $in: ['Women', 'Unisex'] };
        } else if (cleanGender === 'men' || cleanGender === 'man') {
            filters.gender = { $in: ['Men', 'Unisex'] };
        } else if (cleanGender === 'unisex') {
            filters.gender = 'Unisex';
        } else if (cleanGender === 'kids' || cleanGender === 'kid') {
            filters.gender = 'Kids';
        } else {
            filters.gender = { $regex: effectiveGender, $options: 'i' };
        }
    }

    // 5. Search filter (search or searchQuery)
    const rawSearch = (searchQuery || search || "").trim();
    if (rawSearch && rawSearch !== "null") {
        const lowerSearch = rawSearch.toLowerCase();
        // If search represents a gender and gender filter isn't already applied
        if (!filters.gender && (lowerSearch === 'women' || lowerSearch === 'woman')) {
            filters.gender = { $in: ['Women', 'Unisex'] };
        } else if (!filters.gender && (lowerSearch === 'men' || lowerSearch === 'man')) {
            filters.gender = { $in: ['Men', 'Unisex'] };
        } else {
            // Check if search matches category names
            const matchedCats = await categoryModel.find({
                $or: [
                    { name: { $regex: rawSearch, $options: 'i' } },
                    { slug: { $regex: rawSearch, $options: 'i' } },
                    { description: { $regex: rawSearch, $options: 'i' } }
                ]
            }).select('_id');

            const matchedCatIds = matchedCats.map(c => c._id);

            const searchConditions = [
                { title: { $regex: rawSearch, $options: 'i' } },
                { description: { $regex: rawSearch, $options: 'i' } }
            ];

            if (matchedCatIds.length > 0) {
                searchConditions.push({ category: { $in: matchedCatIds } });
            }

            filters.$or = searchConditions;
        }
    }

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

    // Fetch the product details, populate 'category', 'brand', and 'subcategory'
    let product = await productModel.findOne({ slug, isActive: true }).populate('category').populate('brand').populate('subcategory').exec();

    // Fallback: If not found by slug, and slug is a valid ObjectId, try finding by ID
    if (!product && mongoose.Types.ObjectId.isValid(slug)) {
        product = await productModel.findOne({ _id: slug, isActive: true }).populate('category').populate('brand').populate('subcategory').exec();
    }

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    // Fetch product images, populate 'color', and sort by 'serial'
    const productColors = await productColorModel.find({ product: product._id, isActive: true }).populate('color').sort({ serial: 1 });

    // Fetch product sizes, populate 'size', and sort by 'serial' from the Size model
    const productSizes = await productSizeModel.find({ product: product._id, isActive: true }).populate('size');
    const sortedProductSizes = productSizes.sort((a, b) => (a.size?.serial || 0) - (b.size?.serial || 0));

    // Fetch all product images
    const productImages = await productImageModel.find({ product: product._id, isActive: true }).sort({ serial: 1 });

    // Fetch related products (same category, different product)
    const relatedProducts = await productModel.find({
        category: product.category._id,
        _id: { $ne: product._id },
        isActive: true
    }).populate('category').populate('brand').populate('subcategory').limit(8).sort({ serial: 1 });

    // Send the response with the product, product images, product sizes, and related products
    res.status(200).json({
        product,
        productColors,
        productSizes: sortedProductSizes,
        productImages,
        relatedProducts
    });
});

export {
    getHomePageData,
    getAllProductCategories,
    getSingleProductDetails,
    getAllProductsWithSearch,
    getSingleProductBySlug,
    getAllProductsWithQuery,
    getSubCategoriesByCategoryId,
    getAllBrands,
    getAllTestimonials
}