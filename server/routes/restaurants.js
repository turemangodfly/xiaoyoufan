const express = require("express");
const { all, get } = require("../db");
const router = express.Router();

router.get("/", (req, res) => {
  const { category, keyword } = req.query;
  let query = "SELECT * FROM restaurants WHERE 1=1";
  const params = [];
  if (category) {
    query += " AND category LIKE ?";
    params.push(`%${category}%`);
  }
  if (keyword) {
    query += " AND (name LIKE ? OR description LIKE ?)";
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  query += " ORDER BY sales DESC";
  const restaurants = all(query, params);
  res.json(restaurants);
});

router.get("/categories/list", (req, res) => {
  const categories = all("SELECT DISTINCT category FROM restaurants ORDER BY category");
  res.json(categories.map((c) => c.category));
});

router.get("/:id", (req, res) => {
  const restaurant = get("SELECT * FROM restaurants WHERE id = ?", [req.params.id]);
  if (!restaurant) return res.status(404).json({ error: "商家不存在" });
  const menu = all("SELECT * FROM menu_items WHERE restaurantId = ? ORDER BY category, sales DESC", [req.params.id]);
  res.json({ ...restaurant, menu });
});

module.exports = router;
