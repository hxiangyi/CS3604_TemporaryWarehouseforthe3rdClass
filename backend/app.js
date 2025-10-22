const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
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

// 生成随机 token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function getLatestCodeRecord(db, phone) {
  return await db.get(
    'SELECT * FROM verification_codes WHERE phone = ? ORDER BY id DESC LIMIT 1',
    phone
  );
}

// 创建会话令牌（7天有效期）
async function createSessionToken(db, userId) {
  const token = generateToken();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7天

  await db.run(
    'INSERT INTO session_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    userId,
    token,
    expiresAt
  );

  return { token, expiresAt };
}

// 请求验证码（登录/注册通用）
app.post('/auth/request-code', async (req, res) => {
  try {
    const { phone } = req.body || {};

    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: '请输入正确的手机号码' });
    }

    const code = generateCode();
    const expiresAt = Date.now() + 60 * 1000; // 60秒有效期（毫秒值）

    const db = await getDb();
    try {
      await db.run(
        'INSERT INTO verification_codes (phone, code, expires_at, created_at) VALUES (?, ?, ?, ?)',
        phone,
        code,
        expiresAt,
        new Date().toISOString()
      );
    } finally {
      await db.close();
    }

    console.log(`手机号 ${phone} 的验证码是: ${code}`);
    return res.json({ message: '验证码已发送', seconds: 60 });
  } catch (err) {
    console.error('request-code error:', err);
    return res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

// 登录接口
app.post('/auth/login', async (req, res) => {
  try {
    const { phone, code, rememberMe } = req.body || {};

    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: '请输入正确的手机号码' });
    }

    const db = await getDb();
    try {
      const user = await db.get('SELECT * FROM users WHERE phone = ?', phone);
      if (!user) {
        return res.status(400).json({ error: '该手机号未注册，请先完成注册' });
      }

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

      // 如果勾选了"记住我"，生成并返回 token
      let tokenData = null;
      if (rememberMe) {
        tokenData = await createSessionToken(db, user.id);
      }

      return res.json({
        message: '登录成功',
        user: { id: user.id, phone: user.phone },
        token: tokenData ? tokenData.token : null
      });
    } finally {
      await db.close();
    }
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

// 验证 token 接口（用于自动登录）
app.post('/auth/verify-token', async (req, res) => {
  try {
    const { token } = req.body || {};

    if (!token) {
      return res.status(400).json({ error: 'Token 不能为空' });
    }

    const db = await getDb();
    try {
      const session = await db.get(
        'SELECT * FROM session_tokens WHERE token = ?',
        token
      );

      if (!session) {
        return res.status(401).json({ error: 'Token 无效' });
      }

      const now = Date.now();
      if (Number(session.expires_at) < now) {
        return res.status(401).json({ error: 'Token 已过期' });
      }

      const user = await db.get('SELECT * FROM users WHERE id = ?', session.user_id);
      if (!user) {
        return res.status(401).json({ error: '用户不存在' });
      }

      return res.json({
        message: '验证成功',
        user: { id: user.id, phone: user.phone }
      });
    } finally {
      await db.close();
    }
  } catch (err) {
    console.error('verify-token error:', err);
    return res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

// 注册接口
app.post('/auth/register', async (req, res) => {
  try {
    const { phone, code, agree, rememberMe } = req.body || {};

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
        let tokenData = null;
        if (rememberMe) {
          tokenData = await createSessionToken(db, exists.id);
        }
        return res.json({
          message: '该手机号已注册，将直接为您登录',
          user: { id: exists.id, phone: exists.phone },
          token: tokenData ? tokenData.token : null
        });
      }

      const result = await db.run('INSERT INTO users (phone) VALUES (?)', phone);
      const userId = result.lastID;

      // 如果勾选了"记住我"，生成并返回 token
      let tokenData = null;
      if (rememberMe) {
        tokenData = await createSessionToken(db, userId);
      }

      return res.json({
        message: '注册成功',
        user: { id: userId, phone },
        token: tokenData ? tokenData.token : null
      });
    } finally {
      await db.close();
    }
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

module.exports = app;