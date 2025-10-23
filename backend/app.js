const express = require('express');
const cors = require('cors');
const { getDb } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// 手机号校验（中国大陆11位手机号）
function isValidPhone(phone) {
  return typeof phone === 'string' && /^1\d{10}$/.test(phone.trim());
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function getLatestCodeRecord(db, phone) {
  return await db.get(
    'SELECT * FROM verification_codes WHERE phone = ? ORDER BY id DESC LIMIT 1',
    phone
  );
}

// 请求验证码（登录/注册通用）
app.post('/auth/request-code', async (req, res) => {
  try {
    const { phone, isLogin } = req.body || {};

    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: '请输入正确的手机号码' });
    }

    const db = await getDb();
    try {
      // 如果是登录请求，检查手机号是否已注册
      if (isLogin) {
        const user = await db.get('SELECT * FROM users WHERE phone = ?', phone);
        if (!user) {
          return res.status(400).json({ error: '该手机号未注册，请先完成注册' });
        }
      }

      const code = generateCode();
      const expiresAt = Date.now() + 60 * 1000; // 60秒有效期（毫秒值）

      await db.run(
        'INSERT INTO verification_codes (phone, code, expires_at, created_at) VALUES (?, ?, ?, ?)',
        phone,
        code,
        expiresAt,
        new Date().toISOString()
      );

      console.log(`手机号 ${phone} 的验证码是: ${code}`);
      return res.json({ message: '验证码已发送', seconds: 60 });
    } finally {
      await db.close();
    }
  } catch (err) {
    console.error('request-code error:', err);
    return res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

// 登录接口
app.post('/auth/login', async (req, res) => {
  try {
    const { phone, code, password, loginType } = req.body || {};

    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: '请输入正确的手机号码' });
    }

    const db = await getDb();
    try {
      const user = await db.get('SELECT * FROM users WHERE phone = ?', phone);
      if (!user) {
        return res.status(400).json({ error: '该手机号未注册，请先完成注册' });
      }

      // 密码登录
      if (loginType === 'password') {
        return res.status(400).json({ error: '您还未设置密码，请使用验证码登录' });
      }

      // 验证码登录
      const record = await getLatestCodeRecord(db, phone);
      if (!record) {
        return res.status(400).json({ error: '验证码错误' });
      }

      const now = Date.now();
      if (Number(record.expires_at) < now) {
        return res.status(400).json({ error: '验证码已过期' });
      }
      if (String(record.code) !== String(code)) {
        return res.status(400).json({ error: '验证码错误' });
      }

      return res.json({ message: '登录成功' });
    } finally {
      await db.close();
    }
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

// 注册接口
app.post('/auth/register', async (req, res) => {
  try {
    const { phone, code, agree } = req.body || {};

    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: '请输入正确的手机号码' });
    }
    if (!agree) {
      return res.status(400).json({ error: '请先同意《淘贝用户协议》' });
    }

    const db = await getDb();
    try {
      const record = await getLatestCodeRecord(db, phone);
      if (!record) {
        return res.status(400).json({ error: '验证码错误' });
      }
      const now = Date.now();
      if (Number(record.expires_at) < now) {
        return res.status(400).json({ error: '验证码已过期' });
      }
      if (String(record.code) !== String(code)) {
        return res.status(400).json({ error: '验证码错误' });
      }

      const exists = await db.get('SELECT * FROM users WHERE phone = ?', phone);
      if (exists) {
        // 已注册则直接提示并视为登录成功
        return res.json({ message: '该手机号已注册，将直接为您登录' });
      }

      await db.run('INSERT INTO users (phone) VALUES (?)', phone);
      return res.json({ message: '注册成功' });
    } finally {
      await db.close();
    }
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

module.exports = app;