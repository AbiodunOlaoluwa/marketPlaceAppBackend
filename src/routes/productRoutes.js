import express from 'express';
import { getAllProducts, searchProducts, getClickPrice } from "../controllers/productController.js";
const router = express.Router();

router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/:productId/clickPrice', getClickPrice);

export default router;
