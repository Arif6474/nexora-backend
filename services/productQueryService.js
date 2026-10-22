import mongoose from 'mongoose';
import Product from '#models/productModel.js';
import Category from '#models/categoryModel.js';
import Subcategory from '#models/subcategoryModel.js';
import Brand from '#models/brandModel.js';
import ProductColor from '#models/productColorModel.js';
import ProductSize from '#models/productSizeModel.js';
import Color from '#models/colorModel.js';
import Size from '#models/sizeModel.js';

/**
 * Validated, authorized database query service for products.
 * Never executes arbitrary or LLM-generated MongoDB pipelines.
 */
class ProductQueryService {
    /**
     * Sanitizes regex strings to prevent ReDoS / injection
     */
    sanitizeRegex(str) {
        if (!str || typeof str !== 'string') return '';
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
    }

    /**
     * Comprehensive search with explicit, validated filters.
     */
    async searchProducts(params = {}) {
        const {
            query = '',
            category = '',
            brand = '',
            gender = '',
            color = '',
            size = '',
            minPrice,
            maxPrice,
            inStockOnly = true,
            isFeatured,
            limit = 6,
            sortBy = 'newest'
        } = params;

        const filters = { isActive: true };

        // 1. Stock filter
        if (inStockOnly) {
            filters.quantity = { $gt: 0 };
        }

        // 2. Featured filter
        if (typeof isFeatured === 'boolean') {
            filters.isFeatured = isFeatured;
        }

        // 3. Price bounds
        if (typeof minPrice === 'number' && !isNaN(minPrice)) {
            filters.price = filters.price || {};
            filters.price.$gte = Math.max(0, minPrice);
        }
        if (typeof maxPrice === 'number' && !isNaN(maxPrice)) {
            filters.price = filters.price || {};
            filters.price.$lte = Math.max(0, maxPrice);
        }

        // 4. Gender filter
        if (gender && typeof gender === 'string') {
            const cleanGender = gender.trim().toLowerCase();
            if (cleanGender === 'women' || cleanGender === 'woman' || cleanGender === 'female') {
                filters.gender = { $in: ['Women', 'Unisex'] };
            } else if (cleanGender === 'men' || cleanGender === 'man' || cleanGender === 'male') {
                filters.gender = { $in: ['Men', 'Unisex'] };
            } else if (cleanGender === 'unisex') {
                filters.gender = 'Unisex';
            } else if (cleanGender === 'kids' || cleanGender === 'kid') {
                filters.gender = 'Kids';
            }
        }

        // 5. Category filter (id, slug, or name regex)
        if (category && typeof category === 'string' && category.trim()) {
            const cleanCat = category.trim();
            if (mongoose.Types.ObjectId.isValid(cleanCat)) {
                filters.category = cleanCat;
            } else {
                const matchedCat = await Category.findOne({
                    isActive: true,
                    $or: [
                        { slug: cleanCat.toLowerCase() },
                        { name: { $regex: this.sanitizeRegex(cleanCat), $options: 'i' } }
                    ]
                }).select('_id');
                if (matchedCat) {
                    filters.category = matchedCat._id;
                }
            }
        }

        // 6. Brand filter
        if (brand && typeof brand === 'string' && brand.trim()) {
            const cleanBrand = brand.trim();
            if (mongoose.Types.ObjectId.isValid(cleanBrand)) {
                filters.brand = cleanBrand;
            } else {
                const matchedBrand = await Brand.findOne({
                    isActive: true,
                    $or: [
                        { slug: cleanBrand.toLowerCase() },
                        { name: { $regex: this.sanitizeRegex(cleanBrand), $options: 'i' } }
                    ]
                }).select('_id');
                if (matchedBrand) {
                    filters.brand = matchedBrand._id;
                }
            }
        }

        // 7. Text Query
        const cleanQuery = typeof query === 'string' ? query.trim() : '';
        if (cleanQuery) {
            const sanitized = this.sanitizeRegex(cleanQuery);
            const lowerQuery = cleanQuery.toLowerCase();

            // Check if query implies gender and gender filter isn't set
            if (!filters.gender && (lowerQuery.includes('women') || lowerQuery.includes('woman') || lowerQuery.includes('মহিলা') || lowerQuery.includes('নারী') || lowerQuery.includes('aurat') || lowerQuery.includes('donna'))) {
                filters.gender = { $in: ['Women', 'Unisex'] };
            } else if (!filters.gender && (lowerQuery.includes('men') || lowerQuery.includes('man') || lowerQuery.includes('পুরুষ') || lowerQuery.includes('mard') || lowerQuery.includes('uomo'))) {
                filters.gender = { $in: ['Men', 'Unisex'] };
            }

            // Find matching categories or brands
            const matchedCats = await Category.find({
                isActive: true,
                $or: [
                    { name: { $regex: sanitized, $options: 'i' } },
                    { slug: { $regex: sanitized, $options: 'i' } },
                    { description: { $regex: sanitized, $options: 'i' } }
                ]
            }).select('_id');

            const matchedCatIds = matchedCats.map(c => c._id);

            const searchConditions = [
                { title: { $regex: sanitized, $options: 'i' } },
                { description: { $regex: sanitized, $options: 'i' } },
                { sku: { $regex: sanitized, $options: 'i' } }
            ];

            if (matchedCatIds.length > 0) {
                searchConditions.push({ category: { $in: matchedCatIds } });
            }

            filters.$or = searchConditions;
        }

        // 8. Color and Size filtering via relational models
        if (color && typeof color === 'string' && color.trim()) {
            const cleanColor = color.trim();
            // Match color terms: if "black", match both "black" and "noir"
            const colorTerms = [cleanColor];
            if (/black/i.test(cleanColor)) colorTerms.push('noir');
            if (/white/i.test(cleanColor)) colorTerms.push('pure white', 'blanc');
            if (/blue/i.test(cleanColor)) colorTerms.push('navy');

            const colorRegexConditions = colorTerms.map(t => ({
                name: { $regex: this.sanitizeRegex(t), $options: 'i' }
            }));

            const colorDocs = await Color.find({
                $or: colorRegexConditions,
                isActive: true
            }).select('_id');

            if (colorDocs.length > 0) {
                const colorIds = colorDocs.map(c => c._id);
                const productColors = await ProductColor.find({ color: { $in: colorIds }, isActive: true }).select('product');
                const productIdsWithColor = productColors.map(pc => pc.product);
                if (filters._id && filters._id.$in) {
                    const existingStrSet = new Set(filters._id.$in.map(String));
                    filters._id.$in = productIdsWithColor.filter(id => existingStrSet.has(String(id)));
                } else {
                    filters._id = { $in: productIdsWithColor };
                }
            }
        }

        if (size && typeof size === 'string' && size.trim()) {
            const sizeDoc = await Size.findOne({
                size: { $regex: `^${this.sanitizeRegex(size.trim())}$`, $options: 'i' },
                isActive: true
            }).select('_id');
            if (sizeDoc) {
                const productSizes = await ProductSize.find({
                    size: sizeDoc._id,
                    isActive: true,
                    quantity: { $gt: 0 }
                }).select('product');
                const productIdsWithSize = productSizes.map(ps => ps.product);
                if (filters._id && filters._id.$in) {
                    const existingStrSet = new Set(filters._id.$in.map(String));
                    filters._id.$in = productIdsWithSize.filter(id => existingStrSet.has(String(id)));
                } else {
                    filters._id = { $in: productIdsWithSize };
                }
            }
        }

        // Sorting
        let sortObj = { createdAt: -1 };
        if (sortBy === 'priceAsc') sortObj = { price: 1 };
        if (sortBy === 'priceDesc') sortObj = { price: -1 };
        if (sortBy === 'serial') sortObj = { serial: 1, createdAt: -1 };

        const safeLimit = Math.min(Math.max(1, limit), 12);
        const products = await Product.find(filters)
            .populate('category', 'name slug')
            .populate('brand', 'name slug')
            .populate('subcategory', 'name slug')
            .sort(sortObj)
            .limit(safeLimit)
            .lean();

        // Attach variant summaries
        const productIds = products.map(p => p._id);
        const [colors, sizes] = await Promise.all([
            ProductColor.find({ product: { $in: productIds }, isActive: true }).populate('color', 'name hexCode').lean(),
            ProductSize.find({ product: { $in: productIds }, isActive: true }).populate('size', 'size itemType').lean()
        ]);

        const productsWithDetails = products.map(p => {
            const pColors = colors.filter(c => String(c.product) === String(p._id)).map(c => c.color?.name).filter(Boolean);
            const pSizes = sizes.filter(s => String(s.product) === String(p._id)).map(s => ({
                size: s.size?.size,
                quantity: s.quantity,
                inStock: s.quantity > 0
            }));

            const finalPrice = p.discount ? Math.round(p.price - (p.price * p.discount / 100)) : p.price;

            return {
                id: p._id,
                title: p.title,
                slug: p.slug,
                sku: p.sku,
                price: p.price,
                discount: p.discount || 0,
                finalPrice,
                quantity: p.quantity,
                inStock: p.quantity > 0,
                gender: p.gender,
                image: p.image,
                category: p.category?.name || 'Fashion',
                categorySlug: p.category?.slug,
                brand: p.brand?.name || 'Nexora Atelier',
                colors: [...new Set(pColors)],
                sizes: pSizes,
                link: `/product/${p.slug || p._id}`
            };
        });

        return productsWithDetails;
    }

    /**
     * Retrieve single product full details
     */
    async getProductDetails(identifier) {
        if (!identifier) return null;
        const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
        const query = isObjectId ? { _id: identifier, isActive: true } : { slug: identifier, isActive: true };

        const product = await Product.findOne(query)
            .populate('category', 'name slug')
            .populate('brand', 'name slug')
            .populate('subcategory', 'name slug')
            .lean();

        if (!product) return null;

        const [colors, sizes] = await Promise.all([
            ProductColor.find({ product: product._id, isActive: true }).populate('color', 'name hexCode').lean(),
            ProductSize.find({ product: product._id, isActive: true }).populate('size', 'size itemType measurements sizeChart').lean()
        ]);

        const cleanDescription = (product.description || '').replace(/<[^>]*>?/gm, '').trim();
        const finalPrice = product.discount ? Math.round(product.price - (product.price * product.discount / 100)) : product.price;

        return {
            id: product._id,
            title: product.title,
            slug: product.slug,
            sku: product.sku,
            price: product.price,
            discount: product.discount || 0,
            finalPrice,
            quantity: product.quantity,
            inStock: product.quantity > 0,
            gender: product.gender,
            image: product.image,
            description: cleanDescription,
            category: product.category?.name || 'Collection',
            brand: product.brand?.name || 'Nexora',
            colors: colors.map(c => c.color?.name).filter(Boolean),
            sizes: sizes.map(s => ({
                size: s.size?.size,
                quantity: s.quantity,
                inStock: s.quantity > 0
            })),
            link: `/product/${product.slug || product._id}`
        };
    }

    /**
     * Compare two or three products
     */
    async compareProducts(identifiers = []) {
        if (!Array.isArray(identifiers) || identifiers.length === 0) return [];
        const validIds = identifiers.slice(0, 3);
        const details = await Promise.all(validIds.map(id => this.getProductDetails(id)));
        return details.filter(Boolean);
    }

    /**
     * Check real-time availability of product by color/size
     */
    async checkAvailability(productId, { size, color } = {}) {
        const product = await Product.findOne({ _id: productId, isActive: true }).select('title quantity price').lean();
        if (!product) {
            return { verified: false, message: 'Product not found' };
        }

        let variantInfo = {
            totalStock: product.quantity,
            isAvailable: product.quantity > 0,
            productTitle: product.title
        };

        if (size) {
            const sizeDoc = await Size.findOne({ size: { $regex: `^${this.sanitizeRegex(size)}$`, $options: 'i' } });
            if (sizeDoc) {
                const ps = await ProductSize.findOne({ product: productId, size: sizeDoc._id, isActive: true });
                variantInfo.sizeRequested = size;
                variantInfo.sizeAvailable = ps ? ps.quantity > 0 : false;
                variantInfo.sizeQuantity = ps ? ps.quantity : 0;
            }
        }

        if (color) {
            const colorDoc = await Color.findOne({ name: { $regex: this.sanitizeRegex(color), $options: 'i' } });
            if (colorDoc) {
                const pc = await ProductColor.findOne({ product: productId, color: colorDoc._id, isActive: true });
                variantInfo.colorRequested = color;
                variantInfo.colorAvailable = !!pc;
            }
        }

        return {
            verified: true,
            ...variantInfo
        };
    }
}

export const productQueryService = new ProductQueryService();
export default productQueryService;
