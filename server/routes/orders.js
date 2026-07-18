const express = require("express");
const { authMiddleware } = require("./auth");
const { all, get, run } = require("../db");

const router = express.Router();

router.post("/", authMiddleware, (req, res) => {
  const { restaurantId, items, totalPrice, deliveryFee, address, phone, note } = req.body;
  const result = run(
    "INSERT INTO orders (userId, restaurantId, items, totalPrice, deliveryFee, address, phone, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [req.user.id, restaurantId, JSON.stringify(items), totalPrice, deliveryFee || 3, address || "", phone || "", note || ""]
  );
   run("DELETE FROM cart_items WHERE userId = ? AND restaurantId = ?", [req.user.id, restaurantId]);
  res.json({ id: result.lastInsertRowid, success: true });
});

router.get("/", authMiddleware, (req, res) => {
  // 自动推进订单状态模拟配送
  const allOrders = all("SELECT id, status, createdAt FROM orders WHERE userId = ? ORDER BY createdAt DESC", [req.user.id]);
  const now = Date.now();
  allOrders.forEach((o) => {
    const t = new Date(o.createdAt + "Z").getTime();
    const elapsed = (now - t) / 1000;
    if (o.status === "pending" && elapsed > 15) {
      run("UPDATE orders SET status = 'delivering' WHERE id = ? AND status = 'pending'", [o.id]);
    }
    if (o.status === "delivering" && elapsed > 40) {
      run("UPDATE orders SET status = 'completed' WHERE id = ? AND status = 'delivering'", [o.id]);
    }
  });

  const orders = all(
    `SELECT o.*, r.name as restaurantName, r.image as restaurantImage
     FROM orders o JOIN restaurants r ON o.restaurantId = r.id
     WHERE o.userId = ? ORDER BY o.createdAt DESC`,
    [req.user.id]
  );
  res.json(orders.map((o) => ({ ...o, items: JSON.parse(o.items) })));
});

router.get("/:id", authMiddleware, (req, res) => {
  const order = get(
    `SELECT o.*, r.name as restaurantName, r.image as restaurantImage
     FROM orders o JOIN restaurants r ON o.restaurantId = r.id
     WHERE o.id = ? AND o.userId = ?`,
    [req.params.id, req.user.id]
  );
  if (!order) return res.status(404).json({ error: "订单不存在" });
  order.items = JSON.parse(order.items);
  res.json(order);
});

router.put("/:id/cancel", authMiddleware, (req, res) => {
  run("UPDATE orders SET status = 'cancelled' WHERE id = ? AND userId = ? AND status = 'pending'", [req.params.id, req.user.id]);
  res.json({ success: true });
});

router.put("/:id/complete", authMiddleware, (req, res) => {
  run("UPDATE orders SET status = 'completed' WHERE id = ? AND userId = ? AND status = 'delivering'", [req.params.id, req.user.id]);
  res.json({ success: true });
});

module.exports = router;
