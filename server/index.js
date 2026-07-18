const express = require("express");
const cors = require("cors");
const path = require("path");
const { initDB } = require("./db");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client")));

// 初始化数据库（异步）
initDB().then(() => {
  // 路由
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/restaurants", require("./routes/restaurants"));
  app.use("/api/orders", require("./routes/orders"));
  app.use("/api/cart", require("./routes/cart"));

  app.listen(PORT, () => {
    console.log(`校友范校园送餐系统已启动: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("数据库初始化失败:", err);
});
