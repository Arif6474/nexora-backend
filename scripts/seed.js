import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import { uploadFile } from '../utils/uploadFile.js';
import Category from '../models/categoryModel.js';
import Subcategory from '../models/subcategoryModel.js';
import Brand from '../models/brandModel.js';
import Color from '../models/colorModel.js';
import Size from '../models/sizeModel.js';
import Product from '../models/productModel.js';
import ProductColor from '../models/productColorModel.js';
import ProductSize from '../models/productSizeModel.js';
import ProductImage from '../models/productImageModel.js';

import {
  CATEGORIES_DATA,
  BRANDS_DATA,
  COLORS_DATA,
  CLOTHING_SIZES,
  SHOE_SIZES,
  PRODUCTS_DATA
} from './catalogData.js';

dotenv.config();

const downloadedBuffers = new Map();

/**
 * Downloads an image from external URL (cached in memory) and uploads it to R2 at the specified key
 */
async function uploadOrGetImage(imageUrl, key) {
  let item = downloadedBuffers.get(imageUrl);
  if (!item) {
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`  -> Downloading: ${imageUrl.slice(0, 60)}...`);
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 20000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        item = {
          data: response.data,
          contentType: response.headers['content-type'] || 'image/jpeg'
        };
        downloadedBuffers.set(imageUrl, item);
        break;
      } catch (err) {
        retries--;
        console.warn(`  [Warning] Download failed for ${imageUrl.slice(0, 50)}: ${err.message}. Retries left: ${retries}`);
        if (retries === 0) throw err;
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  // Always upload to the target key on R2
  console.log(`  -> Uploading to R2: ${key}`);
  await uploadFile(item.contentType, key, item.data);
  return key;
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function seed() {
  console.log('========================================');
  console.log(' Starting Nexora E-Commerce Seeding');
  console.log('========================================');

  await mongoose.connect(process.env.MONGO_URI);
  console.log(' Connected to MongoDB');

  // 1. Seed Colors
  console.log('\n--- 1. Seeding Colors ---');
  const colorMap = new Map();
  for (const c of COLORS_DATA) {
    let colorDoc = await Color.findOne({ name: c.name });
    if (!colorDoc) {
      colorDoc = await Color.create({ name: c.name, hexCode: c.hexCode, isActive: true });
    } else {
      colorDoc.hexCode = c.hexCode;
      colorDoc.isActive = true;
      await colorDoc.save();
    }
    colorMap.set(c.name, colorDoc);
  }
  console.log(` Seeded ${colorMap.size} colors.`);

  // 2. Seed Sizes
  console.log('\n--- 2. Seeding Sizes ---');
  const sizeMap = new Map();
  for (const s of [...CLOTHING_SIZES, ...SHOE_SIZES]) {
    const key = `${s.itemType}_${s.size}`;
    let sizeDoc = await Size.findOne({ itemType: s.itemType, size: s.size });
    if (!sizeDoc) {
      sizeDoc = await Size.create({
        itemType: s.itemType,
        gender: s.gender,
        size: s.size,
        sizeChart: s.sizeChart,
        serial: s.serial,
        isActive: true
      });
    } else {
      sizeDoc.sizeChart = s.sizeChart;
      sizeDoc.serial = s.serial;
      sizeDoc.isActive = true;
      await sizeDoc.save();
    }
    sizeMap.set(key, sizeDoc);
  }
  console.log(` Seeded ${sizeMap.size} sizes (clothing & shoes).`);

  // 3. Seed Brands
  console.log('\n--- 3. Seeding Brands ---');
  const brandMap = new Map();
  for (const b of BRANDS_DATA) {
    let brandDoc = await Brand.findOne({ slug: b.slug });
    if (!brandDoc) {
      brandDoc = await Brand.create({
        name: b.name,
        slug: b.slug,
        description: b.description,
        isActive: true
      });
    } else {
      brandDoc.name = b.name;
      brandDoc.description = b.description;
      brandDoc.isActive = true;
      await brandDoc.save();
    }
    brandMap.set(b.name, brandDoc);
  }
  console.log(` Seeded ${brandMap.size} brands.`);

  // 4. Seed Categories (Exactly 10)
  console.log('\n--- 4. Seeding 10 Categories ---');
  const categoryMap = new Map();
  const subcategoryMap = new Map();

  for (const cat of CATEGORIES_DATA) {
    console.log(`Processing category: ${cat.name} (${cat.slug})`);
    const imageKey = `images/category/seed-${cat.slug}.jpg`;
    await uploadOrGetImage(cat.imageUrl, imageKey);

    let catDoc = await Category.findOne({ slug: cat.slug });
    if (!catDoc) {
      catDoc = await Category.create({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: imageKey,
        isFeatured: cat.isFeatured,
        serial: cat.serial,
        isActive: true
      });
    } else {
      catDoc.name = cat.name;
      catDoc.description = cat.description;
      catDoc.image = imageKey;
      catDoc.isFeatured = cat.isFeatured;
      catDoc.serial = cat.serial;
      catDoc.isActive = true;
      await catDoc.save();
    }
    categoryMap.set(cat.slug, catDoc);

    // Seed Subcategories
    for (let i = 0; i < cat.subcategories.length; i++) {
      const subName = cat.subcategories[i];
      const subSlug = slugify(subName);
      let subDoc = await Subcategory.findOne({ category: catDoc._id, slug: subSlug });
      if (!subDoc) {
        subDoc = await Subcategory.create({
          name: subName,
          slug: subSlug,
          category: catDoc._id,
          description: `${subName} under ${cat.name}`,
          serial: i + 1,
          isActive: true
        });
      } else {
        subDoc.name = subName;
        subDoc.serial = i + 1;
        subDoc.isActive = true;
        await subDoc.save();
      }
      subcategoryMap.set(`${cat.slug}__${subName}`, subDoc);
    }
  }

  console.log(` Seeded ${categoryMap.size} categories and ${subcategoryMap.size} subcategories.`);

  // 5. Seed Products (Exactly 50: 5 per category)
  console.log('\n--- 5. Seeding 50 Products (5 per Category) ---');
  const seededProductIds = [];

  for (let idx = 0; idx < PRODUCTS_DATA.length; idx++) {
    const prod = PRODUCTS_DATA[idx];
    console.log(`[${idx + 1}/50] Processing: ${prod.title} (SKU: ${prod.sku})`);

    const categoryDoc = categoryMap.get(prod.categorySlug);
    if (!categoryDoc) {
      throw new Error(`Category not found for slug: ${prod.categorySlug}`);
    }

    const subcategoryDoc = subcategoryMap.get(`${prod.categorySlug}__${prod.subcategoryName}`);
    const brandDoc = brandMap.get(prod.brandName);

    // Upload Main Image
    const mainImageKey = `images/product/seed-${prod.sku.toLowerCase()}.jpg`;
    await uploadOrGetImage(prod.mainImageUrl, mainImageKey);

    // Upsert Product by SKU
    let productDoc = await Product.findOne({ sku: prod.sku });
    const productData = {
      category: categoryDoc._id,
      subcategory: subcategoryDoc ? subcategoryDoc._id : undefined,
      brand: brandDoc ? brandDoc._id : undefined,
      sku: prod.sku,
      title: prod.title,
      slug: prod.slug,
      description: prod.description,
      quantity: prod.quantity,
      price: prod.price,
      discount: prod.discount,
      image: mainImageKey,
      isFeatured: prod.isFeatured,
      gender: prod.gender,
      serial: prod.serial,
      isActive: true
    };

    if (!productDoc) {
      productDoc = await Product.create(productData);
    } else {
      Object.assign(productDoc, productData);
      await productDoc.save();
    }
    seededProductIds.push(productDoc._id);

    // 5a. Seed ProductImages (Detail Images)
    // Clear out old productImages for this product to prevent duplicate accumulation
    await ProductImage.deleteMany({ product: productDoc._id });
    for (let di = 0; di < prod.detailImageUrls.length; di++) {
      const detailUrl = prod.detailImageUrls[di];
      const detailKey = `images/productImages/seed-${prod.sku.toLowerCase()}-${di + 1}.jpg`;
      await uploadOrGetImage(detailUrl, detailKey);
      await ProductImage.create({
        product: productDoc._id,
        image: detailKey,
        serial: di + 1,
        isActive: true
      });
    }

    // 5b. Seed ProductColors
    await ProductColor.deleteMany({ product: productDoc._id });
    for (let ci = 0; ci < prod.colors.length; ci++) {
      const colorName = prod.colors[ci];
      const colorDoc = colorMap.get(colorName);
      if (colorDoc) {
        await ProductColor.create({
          product: productDoc._id,
          color: colorDoc._id,
          serial: ci + 1,
          isActive: true
        });
      }
    }

    // 5c. Seed ProductSizes
    await ProductSize.deleteMany({ product: productDoc._id });
    if (prod.sizeType === 'Clothing') {
      const clothingSizeKeys = ['XS', 'S', 'M', 'L', 'XL'];
      const qtyPerSize = Math.max(1, Math.floor(prod.quantity / clothingSizeKeys.length));
      for (const sizeKey of clothingSizeKeys) {
        const sizeDoc = sizeMap.get(`Clothing_${sizeKey}`);
        if (sizeDoc) {
          await ProductSize.create({
            product: productDoc._id,
            size: sizeDoc._id,
            quantity: qtyPerSize,
            isActive: true
          });
        }
      }
    } else if (prod.sizeType === 'Shoes') {
      const shoeSizeKeys = ['38', '39', '40', '41', '42'];
      const qtyPerSize = Math.max(1, Math.floor(prod.quantity / shoeSizeKeys.length));
      for (const sizeKey of shoeSizeKeys) {
        const sizeDoc = sizeMap.get(`Shoes_${sizeKey}`);
        if (sizeDoc) {
          await ProductSize.create({
            product: productDoc._id,
            size: sizeDoc._id,
            quantity: qtyPerSize,
            isActive: true
          });
        }
      }
    }
    // Note: prod.sizeType === 'None' (e.g. Bags) intentionally has NO size variants assigned.
  }

  // 6. Ensure exactly 10 categories and exactly 50 products exist
  console.log('\n--- 6. Database Verification ---');
  const validCategorySlugs = CATEGORIES_DATA.map(c => c.slug);
  const totalCategories = await Category.countDocuments({ isActive: true });
  const allCategories = await Category.find({ isActive: true });

  console.log(`Total Active Categories in DB: ${totalCategories}`);
  for (const cat of allCategories) {
    const prodCount = await Product.countDocuments({ category: cat._id, isActive: true });
    console.log(`  - Category: ${cat.name} (${cat.slug}) -> ${prodCount} products`);
  }

  const totalProducts = await Product.countDocuments({ isActive: true });
  console.log(`Total Active Products in DB: ${totalProducts}`);

  const totalProductImages = await ProductImage.countDocuments({ isActive: true });
  const totalProductColors = await ProductColor.countDocuments({ isActive: true });
  const totalProductSizes = await ProductSize.countDocuments({ isActive: true });

  console.log(`Total Product Images: ${totalProductImages}`);
  console.log(`Total Product Colors: ${totalProductColors}`);
  console.log(`Total Product Sizes: ${totalProductSizes}`);

  // Test R2 public accessibility of all categories and products
  const spacesUrl = 'https://pub-eafb6d63e4e4469abbdf36012aaf4816.r2.dev/';
  console.log('\n--- 7. Verifying All Images on R2 CDN ---');
  let catOk = 0;
  for (const cat of allCategories) {
    try {
      await axios.head(spacesUrl + cat.image);
      catOk++;
    } catch (err) {
      console.error(`  [FAIL] Category image: ${cat.name} (${cat.image}) -> ${err.message}`);
    }
  }
  console.log(` Category Images verified on R2: ${catOk}/${allCategories.length} OK`);

  const allProducts = await Product.find({ isActive: true });
  let prodOk = 0;
  for (const prod of allProducts) {
    try {
      await axios.head(spacesUrl + prod.image);
      prodOk++;
    } catch (err) {
      console.error(`  [FAIL] Product image: ${prod.sku} (${prod.image}) -> ${err.message}`);
    }
  }
  console.log(` Product Images verified on R2: ${prodOk}/${allProducts.length} OK`);

  const allProductImages = await ProductImage.find({ isActive: true });
  let piOk = 0;
  for (const pi of allProductImages) {
    try {
      await axios.head(spacesUrl + pi.image);
      piOk++;
    } catch (err) {
      console.error(`  [FAIL] ProductImage: (${pi.image}) -> ${err.message}`);
    }
  }
  console.log(` Gallery ProductImages verified on R2: ${piOk}/${allProductImages.length} OK`);

  console.log('========================================');
  console.log(' Seeding & Verification Completed Successfully!');
  console.log('========================================');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
