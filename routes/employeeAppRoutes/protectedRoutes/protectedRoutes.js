import { Router } from "express";
import productRoutes from "./productRoutes.js";
import productColorRoutes from "./productColorRoutes.js";
import productSizeRoutes from "./productSizeRoutes.js";
import colorRoutes from "./colorRoutes.js";
import sizeRoutes from "./sizeRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import orderRoutes from "./orderRoutes.js";
import promoCodeRoutes from "./promoCodeRoutes.js";
import subcategoryRoutes from "./subcategoryRoutes.js";
import productImageRoutes from "./productImageRoutes.js";

const protectedRoutes = Router();

protectedRoutes.use('/product', productRoutes);
protectedRoutes.use('/productColor', productColorRoutes);
protectedRoutes.use('/productSize', productSizeRoutes);
protectedRoutes.use('/color', colorRoutes);
protectedRoutes.use('/size', sizeRoutes);
protectedRoutes.use('/category', categoryRoutes);
protectedRoutes.use('/subcategory', subcategoryRoutes);
protectedRoutes.use('/order', orderRoutes);
protectedRoutes.use('/productImage', productImageRoutes);
protectedRoutes.use('/promoCode', promoCodeRoutes);

export default protectedRoutes;
