import express from "express";
import {addItemToCart, getCartItems} from "../controllers/cartController.js";
const router = express.Router();

router.post('/items', addItemToCart);
router.get('/:userId/items', getCartItems);

export default router
