const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "xiaoyoufan.db");
let db = null;
let SQL = null;

async function initDB() {
  SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      avatar TEXT DEFAULT '/images/default-avatar.png',
      address TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, description TEXT, image TEXT,
      rating REAL DEFAULT 4.5, sales INTEGER DEFAULT 0,
      deliveryFee REAL DEFAULT 3.0, minOrder REAL DEFAULT 0,
      category TEXT, status TEXT DEFAULT 'open'
    );
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurantId INTEGER NOT NULL,
      name TEXT NOT NULL, description TEXT,
      price REAL NOT NULL, oldPrice REAL, image TEXT,
      category TEXT, sales INTEGER DEFAULT 0, stock INTEGER DEFAULT 999,
      FOREIGN KEY (restaurantId) REFERENCES restaurants(id)
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL, restaurantId INTEGER NOT NULL,
      items TEXT NOT NULL, totalPrice REAL NOT NULL,
      deliveryFee REAL DEFAULT 3.0, address TEXT, phone TEXT, note TEXT,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL, restaurantId INTEGER NOT NULL,
      menuItemId INTEGER NOT NULL, quantity INTEGER DEFAULT 1,
      FOREIGN KEY (menuItemId) REFERENCES menu_items(id)
    );
  `);

  const result = db.exec("SELECT COUNT(*) as count FROM restaurants");
  const count = result.length > 0 && result[0].values.length > 0 ? result[0].values[0][0] : 0;
  if (count === 0) seedData();
  saveDB();
}

function seedData() {
  const r = ["校园食堂一窗口,经典食堂套餐，营养均衡,/images/rest1.jpg,4.5,1580,0,食堂快餐",
    "麻辣香锅店,正宗川味麻辣香锅,/images/rest2.jpg,4.7,890,2,川菜",
    "港式茶餐厅,经典港式奶茶、烧腊,/images/rest3.jpg,4.3,670,3,茶餐厅",
    "正宗黄焖鸡,黄焖鸡米饭专家,/images/rest4.jpg,4.6,1200,0,小吃快餐",
    "兰州拉面馆,手工拉面，汤鲜味美,/images/rest5.jpg,4.4,950,2,面食",
    "韩式石锅饭,正宗韩式料理,/images/rest6.jpg,4.2,560,3,韩餐",
    "重庆小面,麻辣鲜香重庆味道,/images/rest7.jpg,4.8,2100,1,面食",
    "广东肠粉王,现做肠粉，滑嫩爽口,/images/rest8.jpg,4.1,340,2,早餐"].map(s => s.split(","));
  for (const x of r) {
    db.run("INSERT INTO restaurants (name,description,image,rating,sales,deliveryFee,category) VALUES (?,?,?,?,?,?,?)", x);
  }
  const items = [
    [1,"红烧肉套餐","红烧肉+时蔬+米饭",15,18,"套餐",560],[1,"糖醋排骨套餐","糖醋排骨+青菜+米饭",16,20,"套餐",430],
    [1,"宫保鸡丁饭","宫保鸡丁+米饭",13,15,"盖饭",380],[1,"西红柿鸡蛋面","西红柿鸡蛋汤面",10,12,"面食",290],
    [1,"鱼香肉丝饭","鱼香肉丝+米饭",14,16,"盖饭",350],[1,"红烧茄子饭","红烧茄子+米饭",11,13,"盖饭",280],
    [2,"微辣香锅套餐","荤素搭配，微辣口味",28,35,"套餐",340],[2,"中辣香锅套餐","荤素搭配，中辣口味",30,38,"套餐",280],
    [2,"特辣香锅套餐","荤素搭配，特辣口味",32,40,"套餐",190],[2,"单人香锅","单人份香锅+米饭",22,28,"单人餐",450],
    [2,"加份肥牛","追加肥牛一份",8,null,"加料",600],[2,"酸梅汤","冰镇酸梅汤",5,null,"饮品",720],
    [3,"叉烧饭","蜜汁叉烧+米饭",18,22,"主食",210],[3,"烧鸭饭","脆皮烧鸭+米饭",20,25,"主食",180],
    [3,"丝袜奶茶","正宗港式丝袜奶茶",8,10,"饮品",450],[3,"菠萝油","新鲜出炉菠萝油",6,8,"小吃",320],
    [3,"咖喱鱼蛋","港式咖喱鱼蛋",7,null,"小吃",260],[4,"黄焖鸡米饭","经典黄焖鸡+米饭",16,20,"套餐",680],
    [4,"黄焖排骨饭","黄焖排骨+米饭",18,22,"套餐",320],[4,"黄焖牛肉饭","黄焖牛肉+米饭",22,28,"套餐",210],
    [4,"加份鸡腿","额外加鸡腿一只",5,null,"加料",540],[5,"牛肉拉面","正宗兰州牛肉拉面",12,15,"面食",520],
    [5,"牛肉拌面","牛肉拌面+小菜",14,17,"面食",340],[5,"大盘鸡面","新疆大盘鸡+宽面",20,25,"面食",180],
    [5,"凉皮","陕西凉皮",8,10,"小吃",290],[5,"肉夹馍","陕西肉夹馍",6,8,"小吃",410],
    [6,"石锅拌饭","韩式石锅拌饭+辣酱",22,28,"主食",310],[6,"韩式炸鸡","韩式炸鸡半只",25,32,"炸鸡",240],
    [6,"大酱汤","韩式大酱汤+米饭",18,22,"汤饭",170],[6,"泡菜饼","韩式泡菜饼",12,15,"小吃",190],
    [6,"年糕火锅","韩式年糕火锅",35,45,"火锅",120],[7,"重庆小面","标准重庆小面",10,12,"面食",890],
    [7,"肥肠面","红烧肥肠面",15,18,"面食",560],[7,"担担面","正宗四川担担面",12,15,"面食",410],
    [7,"冰粉","红糖冰粉",5,null,"饮品",670],[7,"冒菜","麻辣冒菜(时蔬)",18,22,"菜品",230],
    [8,"鲜虾肠粉","鲜虾肠粉+酱汁",12,15,"肠粉",160],[8,"鸡蛋肠粉","鸡蛋肠粉+酱汁",8,10,"肠粉",210],
    [8,"瘦肉肠粉","瘦肉肠粉+酱汁",10,12,"肠粉",140],[8,"皮蛋瘦肉粥","皮蛋瘦肉粥",8,10,"粥",120],
    [8,"豆浆","现磨豆浆",3,null,"饮品",90]];
  for (const m of items) {
    db.run("INSERT INTO menu_items (restaurantId,name,description,price,oldPrice,category,sales) VALUES (?,?,?,?,?,?,?)", m);
  }
}

function saveDB() {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function get(sql, params = []) {
  const rows = all(sql, params);
  return rows.length > 0 ? rows[0] : undefined;
}

function run(sql, params = []) {
  db.run(sql, params);
  const r = db.exec("SELECT last_insert_rowid()");
  const id = r.length > 0 && r[0].values.length > 0 ? Number(r[0].values[0][0]) : 0;
  saveDB();
  return { lastInsertRowid: id };
}

module.exports = { initDB, all, get, run };

