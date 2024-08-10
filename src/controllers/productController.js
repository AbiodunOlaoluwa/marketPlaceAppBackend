import pool from "../models/db.js";

const getAllProducts = async (req, res) => {
  const { category, min_price, max_price } = req.query;
  let query = 'SELECT * FROM products WHERE stock_quantity > 0';
  let params = [];
  if (category) {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }
  if (min_price) {
    params.push(min_price);
    query += ` AND price >= $${params.length}`;
  }
  if (max_price) {
    params.push(max_price);
    query += ` AND price <= $${params.length}`;
  }
  try {
    const products = await pool.query(query, params);
    res.json(products.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
};

const searchProducts = async (req, res) => {
  const { q } = req.query;
  const searchQuery = `
    SELECT * FROM products
    WHERE LOWER(name) LIKE LOWER($1) OR LOWER(description) LIKE LOWER($1)
  `;
  try {
    const products = await pool.query(searchQuery, [`%${q}%`]);
    res.json(products.rows);
  } catch (error) {
    console.log(`Error: ${error}`)
    res.status(500).json({ error: 'Failed to search products' });
  }
};


//will be hit up when we want to ascertain exactly the amount to deduct for a click
const getClickPrice = async (req, res) => {
  try {
    const { productId } = req.params;
    const clickInfo = await pool.query('SELECT price_per_click FROM clicks WHERE product_id = $1', [productId]);
    res.json(clickInfo.rows[0]);
  } catch (error) {
    console.error('Failed to get click price: ', error);
    res.status(500).json({ error: 'Failed to get click price' });
  }
}

export { getAllProducts, searchProducts, getClickPrice };
