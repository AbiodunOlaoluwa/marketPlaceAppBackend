import express from 'express';
import { getAllProducts, searchProducts } from "../controllers/productController.js";
const router = express.Router();

router.get('/', getAllProducts);
router.get('/search', searchProducts);

export default router;
