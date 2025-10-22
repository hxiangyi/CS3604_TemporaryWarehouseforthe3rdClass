const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

// 数据库连接配置
const dbConfig = {
  filename: process.env.DB_PATH || path.join(__dirname, 'data.sqlite'),
  driver: sqlite3.Database
};

// 初始化数据库表
async function initDb() {
  const db = await open(dbConfig);
  
  // 创建用户表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 创建验证码表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建会话令牌表（用于"记住我"功能）
  await db.exec(`
    CREATE TABLE IF NOT EXISTS session_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await db.close();
}

// 获取数据库连接
async function getDb() {
  return await open(dbConfig);
}

module.exports = {
  initDb,
  getDb
};