const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { get, all, run } = require("../db");

const router = express.Router();
const JWT_SECRET = "xiaoyoufan_jwt_secret_2026";

router.post("/register", (req, res) => {
  const { username, password, phone } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "用户名和密码不能为空" });
  }
  try {
    const existing = get("SELECT id FROM users WHERE username = ?", [username]);
    if (existing) {
      return res.status(400).json({ error: "用户名已存在" });
    }
    const hashed = bcrypt.hashSync(password, 10);
    const result = run("INSERT INTO users (username, password, phone) VALUES (?, ?, ?)", [username, hashed, phone || ""]);
    const token = jwt.sign({ id: result.lastInsertRowid, username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: result.lastInsertRowid, username, phone: phone || "" } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "请输入用户名和密码" });
  }
  const user = get("SELECT * FROM users WHERE username = ?", [username]);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "用户名或密码错误" });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, username: user.username, phone: user.phone, avatar: user.avatar, address: user.address } });
});

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "未登录" });
  try {
    const decoded = jwt.verify(header.replace("Bearer ", ""), JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "登录已过期" });
  }
}

router.get("/me", authMiddleware, (req, res) => {
  const user = get("SELECT id, username, phone, avatar, address, createdAt FROM users WHERE id = ?", [req.user.id]);
  res.json(user);
});

router.put("/me", authMiddleware, (req, res) => {
  const { phone, address, avatar } = req.body;
  run("UPDATE users SET phone = ?, address = ?, avatar = ? WHERE id = ?", [phone || "", address || "", avatar || "", req.user.id]);
  res.json({ success: true });
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
