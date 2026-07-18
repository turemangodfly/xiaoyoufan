const express = require("express");
const { authMiddleware } = require("./auth");
const { all, get, run } = require("../db");

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const items = all(
    `SELECT c.*, m.name, m.price, m.image, r.name as restaurantName, r.id as restaurantId
     FROM cart_items c
     JOIN menu_items m ON c.menuItemId = m.id
     JOIN restaurants r ON c.restaurantId = r.id
     WHERE c.userId = ?`,
    [req.user.id]
  );
  res.json(items);
});

router.post("/", authMiddleware, (req, res) => {
  const { restaurantId, menuItemId, quantity } = req.body;
  const existing = get("SELECT * FROM cart_items WHERE userId = ? AND menuItemId = ?", [req.user.id, menuItemId]);
  if (existing) {
    run("UPDATE cart_items SET quantity = quantity + ? WHERE id = ?", [quantity || 1, existing.id]);
  } else {
    run("INSERT INTO cart_items (userId, restaurantId, menuItemId, quantity) VALUES (?, ?, ?, ?)",
      [req.user.id, restaurantId, menuItemId, quantity || 1]);
  }
  res.json({ success: true });
});

router.put("/:id", authMiddleware, (req, res) => {
  const { quantity } = req.body;
  if (quantity <= 0) {
    run("DELETE FROM cart_items WHERE id = ? AND userId = ?", [req.params.id, req.user.id]);
  } else {
    run("UPDATE cart_items SET quantity = ? WHERE id = ? AND userId = ?", [quantity, req.params.id, req.user.id]);
  }
  res.json({ success: true });
});

router.delete("/", authMiddleware, (req, res) => {
  run("DELETE FROM cart_items WHERE userId = ?", [req.user.id]);
  res.json({ success: true });
});

module.exports = router;
