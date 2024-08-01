import pool from "../models/db.js";

const addItemToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;
  try {
    let cart = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    if (cart.rowCount === 0) {
      cart = await pool.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING *', [userId]);
    } else {
      cart = cart.rows[0];
    }
    const cartItem = await pool.query(
      'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [cart.id, productId, quantity]
    );
    res.json(cartItem.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
};

const getCartItems = async (req, res) => {
    const { userId } = req.params;
    try {
      const cart = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
      if (cart.rowCount === 0) {
        return res.status(404).json({ error: 'Cart not found' });
      }
      const cartItems = await pool.query('SELECT * FROM cart_items WHERE cart_id = $1', [cart.rows[0].id]);
      res.json(cartItems.rows);
    } catch (error) {
        console.log(`Error: ${error}`)
      res.status(500).json({ error: 'Failed to retrieve cart items' });
    }
  };

export {addItemToCart, getCartItems};
